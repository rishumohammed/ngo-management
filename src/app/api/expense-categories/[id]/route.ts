import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { z } from 'zod'

const CategoryUpdateSchema = z.object({
  name: z.string().min(1, 'Category name is required').optional(),
  description: z.string().optional().nullable(),
  budgetLimit: z.number().optional().nullable(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'update'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await prisma.expenseCategory.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  const body = await req.json()
  const parsed = CategoryUpdateSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })

  const updated = await prisma.expenseCategory.update({
    where: { id: params.id },
    data: {
      name: parsed.data.name ?? existing.name,
      description: parsed.data.description !== undefined ? parsed.data.description : existing.description,
      budgetLimit: parsed.data.budgetLimit !== undefined ? parsed.data.budgetLimit : existing.budgetLimit,
    },
  })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'UPDATE',
    entity: 'ExpenseCategory',
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

  const existing = await prisma.expenseCategory.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  const updated = await prisma.expenseCategory.update({
    where: { id: params.id },
    data: { isArchived: true },
  })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'DELETE',
    entity: 'ExpenseCategory',
    entityId: existing.id,
    entityName: existing.name,
  })

  return NextResponse.json({ message: 'Category archived successfully' })
}
