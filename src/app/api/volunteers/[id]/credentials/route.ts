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

const CredentialsActionSchema = z.object({
  action: z.enum(['SET_PASSWORD', 'GENERATE_INVITE', 'CREATE_ACCOUNT', 'TOGGLE_ACTIVE']),
  password: z.string().min(6).optional(),
  sendEmail: z.boolean().optional().default(false),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'volunteers', 'update'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = CredentialsActionSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })

  const volunteer = await prisma.volunteer.findUnique({
    where: { id: params.id },
    include: { user: { include: { inviteTokens: { orderBy: { createdAt: 'desc' }, take: 1 } } } },
  })
  if (!volunteer) return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const { action, password, sendEmail } = parsed.data

  let targetUserId = volunteer.userId

  // Action: CREATE_ACCOUNT
  if (action === 'CREATE_ACCOUNT') {
    if (!targetUserId) {
      // Check if user with this email already exists
      let user = await prisma.user.findUnique({ where: { email: volunteer.email } })
      if (!user) {
        const initialPassword = password || Math.random().toString(36).slice(-10) + 'A1!'
        const passwordHash = await bcrypt.hash(initialPassword, 12)
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
      targetUserId = user.id
      await prisma.volunteer.update({
        where: { id: params.id },
        data: { userId: user.id },
      })
    }
  }

  // Ensure we have a user for other actions
  if (!targetUserId && action !== 'CREATE_ACCOUNT') {
    // Automatically create user account
    const initialPassword = password || Math.random().toString(36).slice(-10) + 'A1!'
    const passwordHash = await bcrypt.hash(initialPassword, 12)
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
    targetUserId = user.id
    await prisma.volunteer.update({
      where: { id: params.id },
      data: { userId: user.id },
    })
  }

  if (!targetUserId) {
    return NextResponse.json({ error: 'Failed to find or create user account' }, { status: 500 })
  }

  // Action: SET_PASSWORD
  if (action === 'SET_PASSWORD') {
    const newPassword = password || Math.random().toString(36).slice(-8) + 'Fm1!'
    const passwordHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        passwordHash,
        isActive: true,
      },
    })

    // Invalidate old tokens
    await prisma.inviteToken.deleteMany({
      where: { userId: targetUserId },
    })

    await logAudit({
      userId: session.user.id,
      userName: session.user.name || undefined,
      action: 'UPDATE',
      entity: 'User',
      entityId: targetUserId,
      entityName: volunteer.name,
      diff: { after: { action: 'DIRECT_PASSWORD_SET' } },
    })

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated',
      credentials: {
        email: volunteer.email,
        password: newPassword,
      },
    })
  }

  // Action: GENERATE_INVITE
  if (action === 'GENERATE_INVITE' || action === 'CREATE_ACCOUNT') {
    // Invalidate old tokens
    await prisma.inviteToken.deleteMany({
      where: { userId: targetUserId },
    })

    const token = uuid()
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)
    await prisma.inviteToken.create({
      data: { token, userId: targetUserId, expiresAt },
    })

    const inviteUrl = `${appUrl}/auth/setup-password?token=${token}`

    if (sendEmail) {
      try {
        const orgName = (await prisma.orgSetting.findUnique({ where: { key: 'org_name' } }))?.value || 'Free Mind Foundation'
        const { subject, html, text } = volunteerInviteTemplate({ name: volunteer.name, inviteUrl, orgName })
        await (await getEmailProvider()).send({ to: volunteer.email, subject, html, text })
      } catch (err) {
        console.error('Failed to send invite email:', err)
      }
    }

    await logAudit({
      userId: session.user.id,
      userName: session.user.name || undefined,
      action: 'UPDATE',
      entity: 'User',
      entityId: targetUserId,
      entityName: volunteer.name,
      diff: { after: { action: 'INVITE_LINK_GENERATED' } },
    })

    return NextResponse.json({
      success: true,
      inviteToken: token,
      inviteUrl,
      expiresAt,
      emailSent: sendEmail,
    })
  }

  // Action: TOGGLE_ACTIVE
  if (action === 'TOGGLE_ACTIVE') {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: !user.isActive },
    })

    await logAudit({
      userId: session.user.id,
      userName: session.user.name || undefined,
      action: 'UPDATE',
      entity: 'User',
      entityId: targetUserId,
      entityName: volunteer.name,
      diff: { after: { isActive: updatedUser.isActive } },
    })

    return NextResponse.json({
      success: true,
      isActive: updatedUser.isActive,
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
