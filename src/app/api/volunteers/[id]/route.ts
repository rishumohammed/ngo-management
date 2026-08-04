import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { getEmailProvider, volunteerInviteTemplate } from '@/lib/email'
import { DEFAULT_PIPELINE_STAGES } from '@/lib/constants'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'

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
      hoursLogs: { orderBy: { date: 'desc' }, take: 20 },
      eventAssignments: { include: { event: true } },
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          inviteTokens: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  })

  if (!volunteer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Volunteers can only see their own profile
  if (session.user.isVolunteer && session.user.volunteerId !== params.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  let latestInviteUrl = null
  let latestInviteToken = null
  if (volunteer.user?.inviteTokens && volunteer.user.inviteTokens.length > 0) {
    const latest = volunteer.user.inviteTokens[0]
    if (new Date(latest.expiresAt) > new Date() && !latest.usedAt) {
      latestInviteToken = latest.token
      latestInviteUrl = `${appUrl}/auth/setup-password?token=${latest.token}`
    }
  }

  return NextResponse.json({
    ...volunteer,
    credentials: {
      hasAccount: !!volunteer.userId,
      user: volunteer.user,
      latestInviteUrl,
      latestInviteToken,
    },
  })
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
    diff: { after: body },
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

  // Get active configured pipeline stages
  const stagesSetting = await prisma.orgSetting.findUnique({
    where: { key: 'volunteer_pipeline_stages' },
  })
  let activeStages: string[] = DEFAULT_PIPELINE_STAGES.filter((s) => s.enabled).map((s) => s.key)
  if (stagesSetting?.value) {
    try {
      const parsedStages = JSON.parse(stagesSetting.value)
      if (Array.isArray(parsedStages) && parsedStages.length > 0) {
        activeStages = parsedStages.filter((s: any) => s.enabled !== false).map((s: any) => s.key)
      }
    } catch (e) {
      console.error('Failed to parse configured volunteer pipeline stages', e)
    }
  }
  if (!activeStages.includes('APPROVED')) {
    activeStages.push('APPROVED')
  }

  // Determine new currentStage
  let newStage: string = stage

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
    const currentIdx = activeStages.indexOf(stage)
    const nextStage = currentIdx !== -1 ? activeStages[currentIdx + 1] : undefined

    if (nextStage && nextStage !== 'APPROVED') {
      // Create next stage record
      await prisma.volunteerStage.upsert({
        where: { volunteerId_stage: { volunteerId: params.id, stage: nextStage as any } },
        create: { volunteerId: params.id, stage: nextStage as any, status: 'PENDING' },
        update: {},
      })
      await prisma.volunteer.update({ where: { id: params.id }, data: { currentStage: nextStage as any } })
      newStage = nextStage
    } else {
      // Stage was APPROVED (or final step passed) — finalize and create login account
      await prisma.volunteer.update({
        where: { id: params.id },
        data: { currentStage: 'APPROVED', approvedAt: new Date() },
      })

      // Check if user already exists
      if (!volunteer.userId) {
        const tempPassword = Math.random().toString(36).slice(-8) + 'Fm1!'
        const passwordHash = await bcrypt.hash(tempPassword, 12)

        let user = await prisma.user.findUnique({ where: { email: volunteer.email } })
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: volunteer.email,
              name: volunteer.name,
              passwordHash,
              role: 'VOLUNTEER',
              isActive: true,
            },
          })
        }

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
