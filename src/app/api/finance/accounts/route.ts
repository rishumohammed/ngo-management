import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { z } from 'zod'

const AccountSchema = z.object({
  accountName: z.string().min(1, 'Account name is required'),
  accountType: z.enum(['BANK_ACCOUNT', 'CASH_IN_HAND', 'DIGITAL_WALLET']),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  ifscCode: z.string().optional().nullable(),
  branchName: z.string().optional().nullable(),
  openingBalance: z.number().min(0, 'Opening balance cannot be negative'),
  isDefault: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'read'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let accounts = await prisma.paymentAccount.findMany({
    where: { isArchived: false },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })

  // Seed default cash and bank accounts if none exist
  if (accounts.length === 0) {
    const mainBank = await prisma.paymentAccount.create({
      data: {
        accountName: 'Main Bank Account (SBI)',
        accountType: 'BANK_ACCOUNT',
        bankName: 'State Bank of India',
        openingBalance: 0,
        currentBalance: 0,
        isDefault: true,
      },
    })
    const cashBox = await prisma.paymentAccount.create({
      data: {
        accountName: 'Main Cash Box',
        accountType: 'CASH_IN_HAND',
        openingBalance: 0,
        currentBalance: 0,
      },
    })
    accounts = [mainBank, cashBox]
  }

  return NextResponse.json({ accounts })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'create'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = AccountSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })

  const { accountName, accountType, bankName, accountNumber, ifscCode, branchName, openingBalance, isDefault } = parsed.data

  if (isDefault) {
    await prisma.paymentAccount.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    })
  }

  const account = await prisma.paymentAccount.create({
    data: {
      accountName,
      accountType,
      bankName: bankName || null,
      accountNumber: accountNumber || null,
      ifscCode: ifscCode || null,
      branchName: branchName || null,
      openingBalance,
      currentBalance: openingBalance,
      isDefault: !!isDefault,
    },
  })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'CREATE',
    entity: 'PaymentAccount',
    entityId: account.id,
    entityName: account.accountName,
    diff: { after: { accountName: account.accountName, openingBalance: account.openingBalance } },
  })

  return NextResponse.json(account, { status: 201 })
}
