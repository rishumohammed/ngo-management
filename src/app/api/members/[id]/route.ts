import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { z } from 'zod'

const UpdateMemberSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  joinDate: z.string().optional(),
  membershipType: z.enum(['GENERAL', 'LIFE', 'HONORARY', 'PATRON']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DECEASED']).optional(),
  notes: z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'members', 'read'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const member = await prisma.member.findUnique({ where: { id: params.id } })
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(member)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'members', 'update'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const before = await prisma.member.findUnique({ where: { id: params.id } })
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = UpdateMemberSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })

  const data = { ...parsed.data }
  if (data.joinDate) Object.assign(data, { joinDate: new Date(data.joinDate) })

  const member = await prisma.member.update({ where: { id: params.id }, data })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'UPDATE',
    entity: 'Member',
    entityId: member.id,
    entityName: member.name,
    diff: {
      before: before as unknown as Record<string, unknown>,
      after: member as unknown as Record<string, unknown>,
    },
  })

  return NextResponse.json(member)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'members', 'delete'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const member = await prisma.member.findUnique({ where: { id: params.id } })
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.member.delete({ where: { id: params.id } })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'DELETE',
    entity: 'Member',
    entityId: params.id,
    entityName: member.name,
    diff: { before: member as unknown as Record<string, unknown> },
  })

  return NextResponse.json({ success: true })
}
