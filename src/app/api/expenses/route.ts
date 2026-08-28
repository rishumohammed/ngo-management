import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { getFiscalYear, formatReceiptNumber } from '@/lib/utils'
import { z } from 'zod'

const ExpenseSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  paymentAccountId: z.string().optional().nullable(),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  paymentMode: z.enum(['CASH', 'CHEQUE', 'NEFT', 'RTGS', 'IMPS', 'UPI', 'DEMAND_DRAFT', 'ONLINE']),
  payeeName: z.string().min(1, 'Payee/Vendor name is required'),
  referenceNo: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  status: z.enum(['PAID', 'PENDING', 'CANCELLED']).optional(),
  isVoucher: z.boolean().optional(),
})


export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'read'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const categoryId = searchParams.get('categoryId') || ''
  const accountId = searchParams.get('paymentAccountId') || ''
  const status = searchParams.get('status') || ''
  const fiscalYear = searchParams.get('fiscalYear') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '25')

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { payeeName: { contains: search } },
      { voucherNo: { contains: search } },
      { description: { contains: search } },
      { referenceNo: { contains: search } },
    ]
  }
  if (categoryId) where.categoryId = categoryId
  if (accountId) where.paymentAccountId = accountId
  if (status) where.status = status
  if (fiscalYear && fiscalYear !== 'ALL') where.fiscalYear = fiscalYear

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        category: true,
        paymentAccount: true,
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.expense.count({ where }),
  ])

  return NextResponse.json({ expenses, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'create'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = ExpenseSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })

  // Get settings for voucher format and limit
  const settings = await prisma.orgSetting.findMany()
  const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value || ''

  const maxLimitVal = getSetting('voucher_max_limit')
  if (parsed.data.isVoucher && maxLimitVal) {
    const maxLimit = parseFloat(maxLimitVal)
    if (!isNaN(maxLimit) && maxLimit > 0 && parsed.data.amount > maxLimit) {
      return NextResponse.json(
        {
          error: `Voucher amount (₹${parsed.data.amount.toLocaleString('en-IN')}) exceeds maximum allowed voucher limit of ₹${maxLimit.toLocaleString('en-IN')} set in Organization Settings.`,
        },
        { status: 400 }
      )
    }
  }


  const prefix = (getSetting('receipt_prefix') || 'FMF') + '/EXP'
  const fyStartMonth = parseInt(getSetting('fy_start_month') || '4')


  const expenseDate = new Date(parsed.data.date)
  const fiscalYear = getFiscalYear(expenseDate, fyStartMonth)

  const countInFY = await prisma.expense.count({ where: { fiscalYear } })
  const voucherNo = formatReceiptNumber(prefix, fiscalYear, countInFY + 1)

  const status = parsed.data.status || 'PAID'
  const accountId = parsed.data.paymentAccountId || null

  const expense = await prisma.expense.create({
    data: {
      voucherNo,
      fiscalYear,
      categoryId: parsed.data.categoryId,
      paymentAccountId: accountId,
      amount: parsed.data.amount,
      date: expenseDate,
      paymentMode: parsed.data.paymentMode,
      payeeName: parsed.data.payeeName,
      referenceNo: parsed.data.referenceNo || null,
      description: parsed.data.description || null,
      receiptUrl: parsed.data.receiptUrl || null,
      status,
    },
    include: {
      category: true,
      paymentAccount: true,
    },
  })

  // Deduct from PaymentAccount if PAID
  if (accountId && status === 'PAID') {
    await prisma.paymentAccount.update({
      where: { id: accountId },
      data: { currentBalance: { decrement: parsed.data.amount } },
    })
  }

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'CREATE',
    entity: 'Expense',
    entityId: expense.id,
    entityName: `${expense.payeeName} — ₹${expense.amount} (${expense.voucherNo})`,
    diff: { after: { payeeName: expense.payeeName, amount: expense.amount, voucherNo: expense.voucherNo } },
  })

  return NextResponse.json(expense, { status: 201 })
}
