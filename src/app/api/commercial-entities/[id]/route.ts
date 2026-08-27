import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { z } from 'zod'

const EntityUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  regNumber: z.string().optional().nullable(),
  entityType: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'update'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await prisma.commercialEntity.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Commercial Entity not found' }, { status: 404 })

  const body = await req.json()
  const parsed = EntityUpdateSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })

  const updated = await prisma.commercialEntity.update({
    where: { id: params.id },
    data: {
      name: parsed.data.name || existing.name,
      regNumber: parsed.data.regNumber !== undefined ? parsed.data.regNumber : existing.regNumber,
      entityType: parsed.data.entityType !== undefined ? parsed.data.entityType : existing.entityType,
      contactPerson: parsed.data.contactPerson !== undefined ? parsed.data.contactPerson : existing.contactPerson,
      phone: parsed.data.phone !== undefined ? parsed.data.phone : existing.phone,
      email: parsed.data.email !== undefined ? parsed.data.email : existing.email,
      notes: parsed.data.notes !== undefined ? parsed.data.notes : existing.notes,
    },
  })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'UPDATE',
    entity: 'CommercialEntity',
    entityId: updated.id,
    entityName: updated.name,
    diff: { before: existing, after: updated },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'delete'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await prisma.commercialEntity.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Commercial Entity not found' }, { status: 404 })

  const updated = await prisma.commercialEntity.update({
    where: { id: params.id },
    data: { isArchived: true },
  })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'DELETE',
    entity: 'CommercialEntity',
    entityId: existing.id,
    entityName: existing.name,
  })

  return NextResponse.json({ message: 'Commercial Entity archived successfully' })
}
