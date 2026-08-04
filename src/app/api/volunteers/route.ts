import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { z } from 'zod'

const VolunteerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  availability: z.string().optional(),
  motivation: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'volunteers', 'read'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const stage = searchParams.get('stage') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '25')

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ]
  }
  if (stage) where.currentStage = stage

  const [volunteers, total] = await Promise.all([
    prisma.volunteer.findMany({
      where,
      include: { stages: true, user: { select: { id: true, email: true, isActive: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.volunteer.count({ where }),
  ])

  return NextResponse.json({ volunteers, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'volunteers', 'create'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = VolunteerSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })

  // Check email uniqueness
  const existing = await prisma.volunteer.findUnique({ where: { email: parsed.data.email } })
  if (existing)
    return NextResponse.json({ error: 'A volunteer with this email already exists' }, { status: 409 })

  const volunteer = await prisma.volunteer.create({
    data: {
      ...parsed.data,
      skills: parsed.data.skills || [],
      interests: parsed.data.interests || [],
      currentStage: 'APPLICATION',
      stages: {
        create: {
          stage: 'APPLICATION',
          status: 'IN_PROGRESS',
        },
      },
    },
    include: { stages: true },
  })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'CREATE',
    entity: 'Volunteer',
    entityId: volunteer.id,
    entityName: volunteer.name,
    diff: { after: { name: volunteer.name, email: volunteer.email, stage: volunteer.currentStage } },
  })

  return NextResponse.json(volunteer, { status: 201 })
}
