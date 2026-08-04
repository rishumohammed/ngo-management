import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { getEmailProvider, volunteerInviteTemplate } from '@/lib/email'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'

const STAGE_ORDER = [
  'APPLICATION',
  'DOCUMENT_VERIFICATION',
  'INTERVIEW',
  'TRAINING',
  'APPROVED',
] as const

type StageType = (typeof STAGE_ORDER)[number]

const StageUpdateSchema = z.object({
  stage: z.enum(['APPLICATION', 'DOCUMENT_VERIFICATION', 'INTERVIEW', 'TRAINING', 'APPROVED', 'REJECTED']),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED']),
  notes: z.string().optional(),
  conductedBy: z.string().optional(),
  conductedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const volunteer = await prisma.volunteer.findUnique({
    where: { id: params.id },
    include: {
      stages: { orderBy: { createdAt: 'asc' } },
      hoursLogs: { orderBy: { date: 'desc' }, take: 10 },
      eventAssignments: { include: { event: true } },
      user: { select: { id: true, email: true, isActive: true, lastLoginAt: true } },
    },
  })

  if (!volunteer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Volunteers can only see their own profile
  if (session.user.isVolunteer && session.user.volunteerId !== params.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json(volunteer)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isOwn = session.user.isVolunteer && session.user.volunteerId === params.id
  if (!isOwn && !can(session.user.role, 'volunteers', 'update'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const volunteer = await prisma.volunteer.update({
    where: { id: params.id },
    data: {
      name: body.name,
      phone: body.phone,
      address: body.address,
      city: body.city,
      state: body.state,
      skills: body.skills,
      interests: body.interests,
      availability: body.availability,
      motivation: body.motivation,
    },
  })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'UPDATE',
    entity: 'Volunteer',
    entityId: volunteer.id,
    entityName: volunteer.name,
  })

  return NextResponse.json(volunteer)
}

// Stage advancement / rejection
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'volunteers', 'update'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = StageUpdateSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })

  const volunteer = await prisma.volunteer.findUnique({
    where: { id: params.id },
    include: { stages: true },
  })
  if (!volunteer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { stage, status, notes, conductedBy, conductedAt, rejectionReason } = parsed.data

  // Upsert the stage record
  await prisma.volunteerStage.upsert({
    where: { volunteerId_stage: { volunteerId: params.id, stage } },
    create: {
      volunteerId: params.id,
      stage,
      status,
      notes,
      conductedBy,
      conductedAt: conductedAt ? new Date(conductedAt) : undefined,
      completedAt: status === 'PASSED' || status === 'FAILED' ? new Date() : undefined,
    },
    update: {
      status,
      notes,
      conductedBy,
      conductedAt: conductedAt ? new Date(conductedAt) : undefined,
      completedAt: status === 'PASSED' || status === 'FAILED' ? new Date() : undefined,
    },
  })

  // Determine new currentStage
  let newStage: StageType | 'REJECTED' = stage as StageType | 'REJECTED'

  if (status === 'FAILED' || stage === 'REJECTED') {
    // Reject the volunteer
    await prisma.volunteer.update({
      where: { id: params.id },
      data: {
        currentStage: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: rejectionReason || notes,
      },
    })
    newStage = 'REJECTED'
  } else if (status === 'PASSED') {
    const currentIdx = STAGE_ORDER.indexOf(stage as StageType)
    const nextStage = STAGE_ORDER[currentIdx + 1] as StageType | undefined

    if (nextStage) {
      // Create next stage record
      await prisma.volunteerStage.upsert({
        where: { volunteerId_stage: { volunteerId: params.id, stage: nextStage } },
        create: { volunteerId: params.id, stage: nextStage, status: 'PENDING' },
        update: {},
      })
      await prisma.volunteer.update({ where: { id: params.id }, data: { currentStage: nextStage } })
      newStage = nextStage
    } else {
      // stage was APPROVED — create login account
      await prisma.volunteer.update({
        where: { id: params.id },
        data: { currentStage: 'APPROVED', approvedAt: new Date() },
      })

      // Check if user already exists
      if (!volunteer.userId) {
        const tempPassword = Math.random().toString(36).slice(-10)
        const passwordHash = await bcrypt.hash(tempPassword, 12)

        const user = await prisma.user.create({
          data: {
            email: volunteer.email,
            name: volunteer.name,
            passwordHash,
            role: 'VOLUNTEER',
          },
        })

        await prisma.volunteer.update({
          where: { id: params.id },
          data: { userId: user.id },
        })

        // Create invite token
        const token = uuid()
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)
        await prisma.inviteToken.create({
          data: { token, userId: user.id, expiresAt },
        })

        // Send invite email
        try {
          const orgName = (await prisma.orgSetting.findUnique({ where: { key: 'org_name' } }))?.value || 'Free Mind Foundation'
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const inviteUrl = `${appUrl}/auth/setup-password?token=${token}`
          const { subject, html, text } = volunteerInviteTemplate({ name: volunteer.name, inviteUrl, orgName })
          await (await getEmailProvider()).send({ to: volunteer.email, subject, html, text })
        } catch (emailErr) {
          console.error('Failed to send invite email:', emailErr)
        }
      }

      newStage = 'APPROVED'
    }
  }

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'STAGE_CHANGE',
    entity: 'Volunteer',
    entityId: params.id,
    entityName: volunteer.name,
    diff: {
      before: { stage: volunteer.currentStage },
      after: { stage: newStage, stageStatus: status },
    },
  })

  const updated = await prisma.volunteer.findUnique({
    where: { id: params.id },
    include: { stages: true },
  })
  return NextResponse.json(updated)
}
