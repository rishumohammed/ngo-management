import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { getFiscalYear, formatReceiptNumber } from '@/lib/utils'
import { z } from 'zod'

const RevenueSchema = z.object({
  entityId: z.string().min(1, 'Commercial Entity is required'),
  paymentAccountId: z.string().optional().nullable(),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  revenueType: z.enum(['PROFIT_SHARE', 'DIVIDEND', 'SERVICE_FEE', 'ROYALTY', 'OTHER']),
  paymentMode: z.enum(['CASH', 'CHEQUE', 'NEFT', 'RTGS', 'IMPS', 'UPI', 'DEMAND_DRAFT', 'ONLINE']),
  referenceNo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  documentUrl: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'read'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const entityId = searchParams.get('entityId') || ''
  const accountId = searchParams.get('paymentAccountId') || ''
  const fiscalYear = searchParams.get('fiscalYear') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '25')

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { receiptNo: { contains: search } },
      { referenceNo: { contains: search } },
      { notes: { contains: search } },
      { entity: { name: { contains: search } } },
    ]
  }
  if (entityId) where.entityId = entityId
  if (accountId) where.paymentAccountId = accountId
  if (fiscalYear && fiscalYear !== 'ALL') where.fiscalYear = fiscalYear

  const [revenues, total] = await Promise.all([
    prisma.commercialRevenue.findMany({
      where,
      include: {
        entity: true,
        paymentAccount: true,
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.commercialRevenue.count({ where }),
  ])

  return NextResponse.json({ revenues, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'create'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = RevenueSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })

  const settings = await prisma.orgSetting.findMany()
  const getSetting = (key: string) => settings.find((s) => s.key === key)?.value || ''
  const prefix = (getSetting('receipt_prefix') || 'FMF') + '/CR'
  const fyStartMonth = parseInt(getSetting('fy_start_month') || '4')

  const revDate = new Date(parsed.data.date)
  const fiscalYear = getFiscalYear(revDate, fyStartMonth)

  const countInFY = await prisma.commercialRevenue.count({ where: { fiscalYear } })
  const receiptNo = formatReceiptNumber(prefix, fiscalYear, countInFY + 1)
  const accountId = parsed.data.paymentAccountId || null

  const revenue = await prisma.commercialRevenue.create({
    data: {
      receiptNo,
      fiscalYear,
      entityId: parsed.data.entityId,
      paymentAccountId: accountId,
      amount: parsed.data.amount,
      date: revDate,
      revenueType: parsed.data.revenueType,
      paymentMode: parsed.data.paymentMode,
      referenceNo: parsed.data.referenceNo || null,
      notes: parsed.data.notes || null,
      documentUrl: parsed.data.documentUrl || null,
    },
    include: {
      entity: true,
      paymentAccount: true,
    },
  })

  // Increment PaymentAccount balance
  if (accountId) {
    await prisma.paymentAccount.update({
      where: { id: accountId },
      data: { currentBalance: { increment: parsed.data.amount } },
    })
  }

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'CREATE',
    entity: 'CommercialRevenue',
    entityId: revenue.id,
    entityName: `${revenue.entity.name} — ₹${revenue.amount} (${revenue.receiptNo})`,
    diff: { after: { entityName: revenue.entity.name, amount: revenue.amount, receiptNo: revenue.receiptNo } },
  })

  return NextResponse.json(revenue, { status: 201 })
}
