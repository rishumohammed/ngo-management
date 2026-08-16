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

  let volunteer = null

  if (params.id === 'me') {
    if (session.user.volunteerId) {
      volunteer = await prisma.volunteer.findUnique({
        where: { id: session.user.volunteerId },
        include: {
          stages: { orderBy: { createdAt: 'asc' } },
          hoursLogs: { orderBy: { date: 'desc' }, take: 20, include: { event: { select: { id: true, name: true } } } },
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
    }
    if (!volunteer && session.user.id) {
      volunteer = await prisma.volunteer.findFirst({
        where: {
          OR: [
            { userId: session.user.id },
            { email: session.user.email || '' },
            { email: (session.user.email || '').toLowerCase() },
          ],
        },
        include: {
          stages: { orderBy: { createdAt: 'asc' } },
          hoursLogs: { orderBy: { date: 'desc' }, take: 20, include: { event: { select: { id: true, name: true } } } },
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
    }
  } else {
    volunteer = await prisma.volunteer.findUnique({
      where: { id: params.id },
      include: {
        stages: { orderBy: { createdAt: 'asc' } },
        hoursLogs: { orderBy: { date: 'desc' }, take: 20, include: { event: { select: { id: true, name: true } } } },
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
  }

  if (!volunteer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check authorization
  const isOwn = (session.user.volunteerId && session.user.volunteerId === volunteer.id) ||
                (volunteer.userId && volunteer.userId === session.user.id) ||
                (volunteer.email && session.user.email && volunteer.email.toLowerCase() === session.user.email.toLowerCase())

  if (session.user.isVolunteer && !isOwn)
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

  let targetId = params.id
  if (targetId === 'me') {
    if (session.user.volunteerId) {
      targetId = session.user.volunteerId
    } else {
      const v = await prisma.volunteer.findFirst({
        where: { OR: [{ userId: session.user.id }, { email: session.user.email || '' }] },
        select: { id: true },
      })
      if (v) targetId = v.id
    }
  }

  const isOwn = session.user.isVolunteer && (session.user.volunteerId === targetId || session.user.id)
  if (!isOwn && !can(session.user.role, 'volunteers', 'update'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const volunteer = await prisma.volunteer.update({
    where: { id: targetId },
    data: {
      name: body.name,
      phone: body.phone,
      address: body.address,
      city: body.city,
      district: body.district,
      state: body.state,
      skills: body.skills,
      interests: body.interests,
      contributionType: body.contributionType,
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

// Stage advancement / rejection / suspension
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'volunteers', 'update'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  // Handle Suspend Action
  if (body.action === 'SUSPEND' || body.isSuspended === true) {
    const existing = await prisma.volunteer.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })

    const reason = body.reason || body.suspensionReason || 'Suspended by administrator'
    const updated = await prisma.volunteer.update({
      where: { id: params.id },
      data: {
        isSuspended: true,
        suspendedAt: new Date(),
        suspensionReason: reason,
      },
      include: {
        stages: true,
        user: { select: { id: true, email: true, isActive: true } },
      },
    })

    // If volunteer has an associated portal user, deactivate it
    if (existing.userId) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { isActive: false },
      })
    }

    await logAudit({
      userId: session.user.id,
      userName: session.user.name || undefined,
      action: 'SUSPEND',
      entity: 'Volunteer',
      entityId: params.id,
      entityName: updated.name,
      diff: {
        before: { isSuspended: existing.isSuspended },
        after: { isSuspended: true, suspensionReason: reason },
      },
    })

    return NextResponse.json(updated)
  }

  // Handle Reactivate / Unsuspend Action
  if (body.action === 'REACTIVATE' || body.action === 'UNSUSPEND' || body.isSuspended === false) {
    const existing = await prisma.volunteer.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })

    const updated = await prisma.volunteer.update({
      where: { id: params.id },
      data: {
        isSuspended: false,
        suspendedAt: null,
        suspensionReason: null,
      },
      include: {
        stages: true,
        user: { select: { id: true, email: true, isActive: true } },
      },
    })

    // If volunteer has an associated portal user, reactivate it
    if (existing.userId) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { isActive: true },
      })
    }

    await logAudit({
      userId: session.user.id,
      userName: session.user.name || undefined,
      action: 'REACTIVATE',
      entity: 'Volunteer',
      entityId: params.id,
      entityName: updated.name,
      diff: {
        before: { isSuspended: existing.isSuspended, suspensionReason: existing.suspensionReason },
        after: { isSuspended: false },
      },
    })

    return NextResponse.json(updated)
  }

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

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'volunteers', 'delete'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const volunteer = await prisma.volunteer.findUnique({
    where: { id: params.id },
    include: { user: true },
  })
  if (!volunteer) return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })

  const targetUserId = volunteer.userId

  // Safely cleanup all related records
  await prisma.$transaction(async (tx) => {
    // 1. Delete volunteer hours logs
    await tx.volunteerHoursLog.deleteMany({ where: { volunteerId: params.id } })

    // 2. Delete pipeline stages
    await tx.volunteerStage.deleteMany({ where: { volunteerId: params.id } })

    // 3. Delete event assignments
    await tx.eventAssignment.deleteMany({ where: { volunteerId: params.id } })

    // 4. Delete committee memberships
    await tx.committeeMember.deleteMany({ where: { volunteerId: params.id } })

    // 5. Unlink user before deleting volunteer
    await tx.volunteer.update({
      where: { id: params.id },
      data: { userId: null },
    })

    // 6. Delete volunteer record
    await tx.volunteer.delete({ where: { id: params.id } })

    // 7. Delete user account if it was a dedicated VOLUNTEER user
    if (targetUserId) {
      await tx.inviteToken.deleteMany({ where: { userId: targetUserId } })
      await tx.auditLog.updateMany({ where: { userId: targetUserId }, data: { userId: null } })
      const u = await tx.user.findUnique({ where: { id: targetUserId } })
      if (u && u.role === 'VOLUNTEER') {
        await tx.user.delete({ where: { id: targetUserId } })
      }
    }
  })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'DELETE',
    entity: 'Volunteer',
    entityId: params.id,
    entityName: volunteer.name,
    diff: {
      before: {
        name: volunteer.name,
        email: volunteer.email,
        currentStage: volunteer.currentStage,
        isSuspended: volunteer.isSuspended,
      },
    },
  })

  return NextResponse.json({ success: true, message: 'Volunteer deleted successfully' })
}
