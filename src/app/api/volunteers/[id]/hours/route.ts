import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const HoursSchema = z.object({
  date: z.string().min(1),
  activity: z.string().min(1),
  hours: z.number().positive().max(24),
  notes: z.string().optional(),
  eventId: z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Volunteers can only see own hours
  if (session.user.isVolunteer && session.user.volunteerId !== params.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const logs = await prisma.volunteerHoursLog.findMany({
    where: { volunteerId: params.id },
    include: { event: { select: { id: true, name: true } } },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(logs)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Volunteers can only log own hours
  if (session.user.isVolunteer && session.user.volunteerId !== params.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = HoursSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 })

  const log = await prisma.volunteerHoursLog.create({
    data: {
      volunteerId: params.id,
      date: new Date(parsed.data.date),
      activity: parsed.data.activity,
      hours: parsed.data.hours,
      notes: parsed.data.notes,
      eventId: parsed.data.eventId,
    },
  })

  return NextResponse.json(log, { status: 201 })
}
