import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { z } from 'zod'

const AccountUpdateSchema = z.object({
  accountName: z.string().min(1, 'Account name is required').optional(),
  accountType: z.enum(['BANK_ACCOUNT', 'CASH_IN_HAND', 'DIGITAL_WALLET']).optional(),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  ifscCode: z.string().optional().nullable(),
  branchName: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'update'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await prisma.paymentAccount.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const body = await req.json()
  const parsed = AccountUpdateSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })

  if (parsed.data.isDefault) {
    await prisma.paymentAccount.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    })
  }

  const updated = await prisma.paymentAccount.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      bankName: parsed.data.bankName !== undefined ? parsed.data.bankName : existing.bankName,
      accountNumber: parsed.data.accountNumber !== undefined ? parsed.data.accountNumber : existing.accountNumber,
      ifscCode: parsed.data.ifscCode !== undefined ? parsed.data.ifscCode : existing.ifscCode,
      branchName: parsed.data.branchName !== undefined ? parsed.data.branchName : existing.branchName,
    },
  })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'UPDATE',
    entity: 'PaymentAccount',
    entityId: updated.id,
    entityName: updated.accountName,
    diff: { before: existing, after: updated },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'delete'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await prisma.paymentAccount.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const updated = await prisma.paymentAccount.update({
    where: { id: params.id },
    data: { isArchived: true },
  })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'DELETE',
    entity: 'PaymentAccount',
    entityId: existing.id,
    entityName: existing.accountName,
  })

  return NextResponse.json({ message: 'Account archived successfully' })
}
