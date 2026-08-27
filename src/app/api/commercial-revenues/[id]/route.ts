import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { z } from 'zod'

const RevenueUpdateSchema = z.object({
  entityId: z.string().optional(),
  paymentAccountId: z.string().optional().nullable(),
  amount: z.number().positive().optional(),
  date: z.string().optional(),
  revenueType: z.enum(['PROFIT_SHARE', 'DIVIDEND', 'SERVICE_FEE', 'ROYALTY', 'OTHER']).optional(),
  paymentMode: z.enum(['CASH', 'CHEQUE', 'NEFT', 'RTGS', 'IMPS', 'UPI', 'DEMAND_DRAFT', 'ONLINE']).optional(),
  referenceNo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  documentUrl: z.string().optional().nullable(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'update'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await prisma.commercialRevenue.findUnique({
    where: { id: params.id },
    include: { entity: true },
  })
  if (!existing) return NextResponse.json({ error: 'Commercial Revenue entry not found' }, { status: 404 })

  const body = await req.json()
  const parsed = RevenueUpdateSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })

  // Revert previous account addition
  if (existing.paymentAccountId) {
    await prisma.paymentAccount.update({
      where: { id: existing.paymentAccountId },
      data: { currentBalance: { decrement: Number(existing.amount) } },
    })
  }

  const newAccountId = parsed.data.paymentAccountId !== undefined ? parsed.data.paymentAccountId : existing.paymentAccountId
  const newAmount = parsed.data.amount !== undefined ? parsed.data.amount : Number(existing.amount)

  const updated = await prisma.commercialRevenue.update({
    where: { id: params.id },
    data: {
      entityId: parsed.data.entityId || existing.entityId,
      paymentAccountId: newAccountId,
      amount: newAmount,
      date: parsed.data.date ? new Date(parsed.data.date) : existing.date,
      revenueType: parsed.data.revenueType || existing.revenueType,
      paymentMode: parsed.data.paymentMode || existing.paymentMode,
      referenceNo: parsed.data.referenceNo !== undefined ? parsed.data.referenceNo : existing.referenceNo,
      notes: parsed.data.notes !== undefined ? parsed.data.notes : existing.notes,
      documentUrl: parsed.data.documentUrl !== undefined ? parsed.data.documentUrl : existing.documentUrl,
    },
    include: { entity: true, paymentAccount: true },
  })

  // Apply new account addition
  if (newAccountId) {
    await prisma.paymentAccount.update({
      where: { id: newAccountId },
      data: { currentBalance: { increment: newAmount } },
    })
  }

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'UPDATE',
    entity: 'CommercialRevenue',
    entityId: updated.id,
    entityName: `${updated.entity.name} — ${updated.receiptNo}`,
    diff: { before: existing, after: updated },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'delete'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await prisma.commercialRevenue.findUnique({
    where: { id: params.id },
    include: { entity: true },
  })
  if (!existing) return NextResponse.json({ error: 'Commercial Revenue entry not found' }, { status: 404 })

  // Revert balance addition
  if (existing.paymentAccountId) {
    await prisma.paymentAccount.update({
      where: { id: existing.paymentAccountId },
      data: { currentBalance: { decrement: Number(existing.amount) } },
    })
  }

  await prisma.commercialRevenue.delete({ where: { id: params.id } })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'DELETE',
    entity: 'CommercialRevenue',
    entityId: existing.id,
    entityName: `${existing.entity.name} — ${existing.receiptNo}`,
  })

  return NextResponse.json({ message: 'Commercial Revenue entry deleted successfully' })
}
