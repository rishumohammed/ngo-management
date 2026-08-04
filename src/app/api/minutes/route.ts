import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { z } from 'zod'

const MinuteSchema = z.object({
  meetingType: z.enum(['BOARD', 'COMMITTEE', 'GENERAL_BODY', 'AD_HOC']),
  title: z.string().min(1),
  date: z.string().min(1),
  location: z.string().optional(),
  onlineLink: z.string().optional(),
  committeeId: z.string().optional(),
  attendees: z.array(z.object({ name: z.string(), memberId: z.string().optional(), isAbsent: z.boolean().optional() })).optional(),
  agendaItems: z.array(z.object({ title: z.string(), notes: z.string().optional(), decisions: z.string().optional(), orderIndex: z.number() })).optional(),
  actionItems: z.array(z.object({ description: z.string(), ownerName: z.string(), dueDate: z.string().optional() })).optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'minutes', 'read'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '25')
  const status = searchParams.get('status') || ''
  const type = searchParams.get('meetingType') || ''

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (type) where.meetingType = type

  const [minutes, total] = await Promise.all([
    prisma.meetingMinute.findMany({
      where,
      include: {
        committee: { select: { name: true } },
        actionItems: { where: { status: 'OPEN' }, select: { id: true } },
        _count: { select: { attendees: true, agendaItems: true } },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.meetingMinute.count({ where }),
  ])

  return NextResponse.json({ minutes, total })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'minutes', 'create'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = MinuteSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })

  const { attendees = [], agendaItems = [], actionItems = [], ...rest } = parsed.data

  const minute = await prisma.meetingMinute.create({
    data: {
      ...rest,
      date: new Date(rest.date),
      status: 'DRAFT',
      attendees: {
        create: attendees.map(a => ({ name: a.name, memberId: a.memberId, isAbsent: a.isAbsent || false })),
      },
      agendaItems: {
        create: agendaItems.map((a, idx) => ({ title: a.title, notes: a.notes, decisions: a.decisions, orderIndex: a.orderIndex ?? idx })),
      },
      actionItems: {
        create: actionItems.map(a => ({ description: a.description, ownerName: a.ownerName, dueDate: a.dueDate ? new Date(a.dueDate) : null })),
      },
    },
    include: { attendees: true, agendaItems: true, actionItems: true },
  })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'CREATE',
    entity: 'MeetingMinute',
    entityId: minute.id,
    entityName: minute.title,
  })

  return NextResponse.json(minute, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'minutes', 'update'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, status } = await req.json()
  const minute = await prisma.meetingMinute.findUnique({ where: { id } })
  if (!minute) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (minute.status === 'FINALIZED')
    return NextResponse.json({ error: 'Finalized minutes cannot be changed' }, { status: 400 })

  const updated = await prisma.meetingMinute.update({
    where: { id },
    data: {
      status,
      finalizedAt: status === 'FINALIZED' ? new Date() : undefined,
    },
  })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'STATUS_CHANGE',
    entity: 'MeetingMinute',
    entityId: id,
    entityName: minute.title,
    diff: { before: { status: minute.status }, after: { status } },
  })

  return NextResponse.json(updated)
}
