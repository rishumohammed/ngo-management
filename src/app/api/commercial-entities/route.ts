import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { z } from 'zod'

const EntitySchema = z.object({
  name: z.string().min(1, 'Company/Enterprise name is required'),
  regNumber: z.string().optional().nullable(),
  entityType: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'read'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const entities = await prisma.commercialEntity.findMany({
    where: { isArchived: false },
    include: {
      _count: { select: { revenues: true } },
      revenues: {
        select: { amount: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  const formatted = entities.map((e: any) => {
    const totalRevenue = e.revenues.reduce((acc: number, r: { amount: any }) => acc + Number(r.amount), 0)
    const { revenues, ...rest } = e
    return { ...rest, totalRevenue }
  })

  return NextResponse.json({ entities: formatted })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'create'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = EntitySchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })

  const entity = await prisma.commercialEntity.create({
    data: {
      name: parsed.data.name,
      regNumber: parsed.data.regNumber || null,
      entityType: parsed.data.entityType || null,
      contactPerson: parsed.data.contactPerson || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
    },
  })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'CREATE',
    entity: 'CommercialEntity',
    entityId: entity.id,
    entityName: entity.name,
  })

  return NextResponse.json(entity, { status: 201 })
}
