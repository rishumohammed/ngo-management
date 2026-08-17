import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { getMemberNumber } from '@/lib/utils'
import { z } from 'zod'

const MemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  joinDate: z.string().min(1, 'Join date is required'),
  membershipType: z.enum(['GENERAL', 'LIFE', 'HONORARY', 'PATRON']).default('GENERAL'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DECEASED']).default('ACTIVE'),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'members', 'read'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const membershipType = searchParams.get('membershipType') || ''
  const filterState = searchParams.get('state') || ''
  const filterDistrict = searchParams.get('district') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '25')

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { memberNumber: { contains: search } },
    ]
  }
  if (status) where.status = status
  if (membershipType) where.membershipType = membershipType
  if (filterState) where.state = filterState
  if (filterDistrict) where.district = filterDistrict

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.member.count({ where }),
  ])

  return NextResponse.json({ members, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'members', 'create'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = MemberSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })

  // Generate sequential member number
  const count = await prisma.member.count()
  const memberNumber = getMemberNumber(count + 1)

  const member = await prisma.member.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      memberNumber,
      joinDate: new Date(parsed.data.joinDate),
    },
  })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'CREATE',
    entity: 'Member',
    entityId: member.id,
    entityName: member.name,
    diff: { after: member as unknown as Record<string, unknown> },
  })

  return NextResponse.json(member, { status: 201 })
}
