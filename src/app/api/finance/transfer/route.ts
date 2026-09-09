import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { z } from 'zod'

const TransferSchema = z.object({
  fromAccountId: z.string().min(1, 'Source account is required'),
  toAccountId: z.string().min(1, 'Destination account is required'),
  amount: z.number().positive('Transfer amount must be greater than zero'),
  date: z.string().min(1, 'Date is required'),
  referenceNo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'update'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = TransferSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })
  }

  const { fromAccountId, toAccountId, amount, date, referenceNo, notes } = parsed.data

  if (amount <= 0) {
    return NextResponse.json({ error: 'Only positive transfer amounts are allowed.' }, { status: 400 })
  }

  if (fromAccountId === toAccountId) {
    return NextResponse.json({ error: 'Source and destination accounts must be different.' }, { status: 400 })
  }

  // Fetch both accounts
  const [fromAccount, toAccount] = await Promise.all([
    prisma.paymentAccount.findUnique({ where: { id: fromAccountId } }),
    prisma.paymentAccount.findUnique({ where: { id: toAccountId } }),
  ])

  if (!fromAccount || fromAccount.isArchived) {
    return NextResponse.json({ error: 'Source payment account not found or archived.' }, { status: 404 })
  }
  if (!toAccount || toAccount.isArchived) {
    return NextResponse.json({ error: 'Destination payment account not found or archived.' }, { status: 404 })
  }

  const availableBalance = Number(fromAccount.currentBalance)
  if (availableBalance < amount) {
    return NextResponse.json(
      {
        error: `Insufficient balance in "${fromAccount.accountName}". Available balance is ₹${availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}, but transfer amount is ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Bank balance & Cash in hand cannot be negative.`,
      },
      { status: 400 }
    )
  }

  // Perform atomic transfer
  const [updatedFrom, updatedTo] = await prisma.$transaction([
    prisma.paymentAccount.update({
      where: { id: fromAccountId },
      data: { currentBalance: { decrement: amount } },
    }),
    prisma.paymentAccount.update({
      where: { id: toAccountId },
      data: { currentBalance: { increment: amount } },
    }),
  ])

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'UPDATE',
    entity: 'PaymentAccount',
    entityId: fromAccountId,
    entityName: `Fund Transfer: ₹${amount} from ${fromAccount.accountName} to ${toAccount.accountName}`,
    diff: {
      before: { fromAccountBalance: availableBalance, toAccountBalance: Number(toAccount.currentBalance) },
      after: {
        fromAccountBalance: Number(updatedFrom.currentBalance),
        toAccountBalance: Number(updatedTo.currentBalance),
        referenceNo,
        notes,
      },
    },
  })

  return NextResponse.json({
    message: `Successfully transferred ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} from ${fromAccount.accountName} to ${toAccount.accountName}.`,
    fromAccount: updatedFrom,
    toAccount: updatedTo,
  })
}
