import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { z } from 'zod'

const CommitteeSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['COMMITTEE', 'DEPARTMENT']).default('COMMITTEE'),
  purpose: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'committees', 'read'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const includeArchived = searchParams.get('includeArchived') === 'true'

  const committees = await prisma.committee.findMany({
    where: includeArchived ? {} : { isArchived: false },
    include: {
      members: {
        where: { isActive: true },
        include: {
          member: { select: { id: true, name: true } },
          volunteer: { select: { id: true, name: true } },
        },
      },
      _count: { select: { meetings: true, events: true } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(committees)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'committees', 'create'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = CommitteeSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 })

  const committee = await prisma.committee.create({ data: parsed.data })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'CREATE',
    entity: 'Committee',
    entityId: committee.id,
    entityName: committee.name,
  })

  return NextResponse.json(committee, { status: 201 })
}
