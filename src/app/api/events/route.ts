import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { z } from 'zod'

const EventSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['WORKSHOP', 'SEMINAR', 'OUTREACH', 'FUNDRAISER', 'TRAINING', 'MEETING', 'OTHER']).default('OTHER'),
  description: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  location: z.string().optional(),
  onlineLink: z.string().optional(),
  status: z.enum(['PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED']).default('PLANNED'),
  committeeId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const upcoming = searchParams.get('upcoming') === 'true'
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')

  // Volunteers see only assigned events
  const volunteerId = session.user.isVolunteer ? session.user.volunteerId : null

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (upcoming) where.startDate = { gte: new Date() }
  if (volunteerId) {
    where.assignments = { some: { volunteerId } }
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        committee: { select: { name: true } },
        assignments: {
          include: { volunteer: { select: { name: true } } },
        },
      },
      orderBy: { startDate: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.event.count({ where }),
  ])

  return NextResponse.json({ events, total })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'events', 'create'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = EventSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 })

  const event = await prisma.event.create({
    data: {
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
  })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'CREATE',
    entity: 'Event',
    entityId: event.id,
    entityName: event.name,
  })

  return NextResponse.json(event, { status: 201 })
}
