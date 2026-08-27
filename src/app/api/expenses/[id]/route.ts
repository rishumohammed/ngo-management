import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { z } from 'zod'

const ExpenseUpdateSchema = z.object({
  categoryId: z.string().optional(),
  paymentAccountId: z.string().optional().nullable(),
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  paymentMode: z.enum(['CASH', 'CHEQUE', 'NEFT', 'RTGS', 'IMPS', 'UPI', 'DEMAND_DRAFT', 'ONLINE']).optional(),
  payeeName: z.string().min(1).optional(),
  referenceNo: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  status: z.enum(['PAID', 'PENDING', 'CANCELLED']).optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'update'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await prisma.expense.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

  const body = await req.json()
  const parsed = ExpenseUpdateSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })

  // Revert previous account deduction if it was PAID
  if (existing.paymentAccountId && existing.status === 'PAID') {
    await prisma.paymentAccount.update({
      where: { id: existing.paymentAccountId },
      data: { currentBalance: { increment: Number(existing.amount) } },
    })
  }

  const newStatus = parsed.data.status || existing.status
  const newAccountId = parsed.data.paymentAccountId !== undefined ? parsed.data.paymentAccountId : existing.paymentAccountId
  const newAmount = parsed.data.amount !== undefined ? parsed.data.amount : Number(existing.amount)

  const updated = await prisma.expense.update({
    where: { id: params.id },
    data: {
      categoryId: parsed.data.categoryId || existing.categoryId,
      paymentAccountId: newAccountId,
      amount: newAmount,
      date: parsed.data.date ? new Date(parsed.data.date) : existing.date,
      paymentMode: parsed.data.paymentMode || existing.paymentMode,
      payeeName: parsed.data.payeeName || existing.payeeName,
      referenceNo: parsed.data.referenceNo !== undefined ? parsed.data.referenceNo : existing.referenceNo,
      description: parsed.data.description !== undefined ? parsed.data.description : existing.description,
      receiptUrl: parsed.data.receiptUrl !== undefined ? parsed.data.receiptUrl : existing.receiptUrl,
      status: newStatus,
    },
    include: { category: true, paymentAccount: true },
  })

  // Apply new account deduction if new status is PAID
  if (newAccountId && newStatus === 'PAID') {
    await prisma.paymentAccount.update({
      where: { id: newAccountId },
      data: { currentBalance: { decrement: newAmount } },
    })
  }

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'UPDATE',
    entity: 'Expense',
    entityId: updated.id,
    entityName: `${updated.payeeName} — ${updated.voucherNo}`,
    diff: { before: existing, after: updated },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'delete'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await prisma.expense.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

  // Revert balance deduction if it was PAID
  if (existing.paymentAccountId && existing.status === 'PAID') {
    await prisma.paymentAccount.update({
      where: { id: existing.paymentAccountId },
      data: { currentBalance: { increment: Number(existing.amount) } },
    })
  }

  await prisma.expense.delete({ where: { id: params.id } })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'DELETE',
    entity: 'Expense',
    entityId: existing.id,
    entityName: `${existing.payeeName} — ${existing.voucherNo}`,
  })

  return NextResponse.json({ message: 'Expense deleted successfully' })
}
