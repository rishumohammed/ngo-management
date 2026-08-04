import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password || password.length < 8)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const invite = await prisma.inviteToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!invite || invite.usedAt || invite.expiresAt < new Date())
    return NextResponse.json({ error: 'Invite link is invalid or has expired.' }, { status: 400 })

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: invite.userId },
      data: { passwordHash },
    }),
    prisma.inviteToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ])

  return NextResponse.json({ success: true })
}
