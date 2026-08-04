import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { getFiscalYear, formatReceiptNumber } from '@/lib/utils'
import { z } from 'zod'

const DonationSchema = z.object({
  donorName: z.string().min(1),
  donorPhone: z.string().optional(),
  donorEmail: z.string().email().optional().or(z.literal('')),
  donorPan: z.string().optional(),
  donorAddress: z.string().optional(),
  amount: z.number().positive(),
  date: z.string().min(1),
  paymentMode: z.enum(['CASH', 'CHEQUE', 'NEFT', 'RTGS', 'IMPS', 'UPI', 'DEMAND_DRAFT', 'ONLINE']),
  chequeNumber: z.string().optional(),
  bankName: z.string().optional(),
  purpose: z.string().optional(),
  tier: z.string().optional(),
  notes: z.string().optional(),
  emailReceipt: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'donations', 'read'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const mode = searchParams.get('paymentMode') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '25')

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { donorName: { contains: search } },
      { receiptNumber: { contains: search } },
      { donorPan: { contains: search } },
    ]
  }
  if (status) where.status = status
  if (mode) where.paymentMode = mode

  const [donations, total] = await Promise.all([
    prisma.donation.findMany({
      where,
      include: { receipt: true },
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.donation.count({ where }),
  ])

  return NextResponse.json({ donations, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'donations', 'create'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = DonationSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })

  // Get settings for receipt format
  const settings = await prisma.orgSetting.findMany({
    where: { key: { in: ['receipt_prefix', 'fy_start_month'] } },
  })
  const prefix = settings.find((s) => s.key === 'receipt_prefix')?.value || 'FMF'
  const fyStartMonth = parseInt(settings.find((s) => s.key === 'fy_start_month')?.value || '4')

  const donationDate = new Date(parsed.data.date)
  const fiscalYear = getFiscalYear(donationDate, fyStartMonth)

  // Sequential receipt number within fiscal year
  const countInFY = await prisma.donation.count({ where: { fiscalYear } })
  const receiptNumber = formatReceiptNumber(prefix, fiscalYear, countInFY + 1)

  const donation = await prisma.donation.create({
    data: {
      ...parsed.data,
      amount: parsed.data.amount,
      date: donationDate,
      fiscalYear,
      receiptNumber,
      donorEmail: parsed.data.donorEmail || null,
      receipt: { create: {} },
    },
    include: { receipt: true },
  })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'CREATE',
    entity: 'Donation',
    entityId: donation.id,
    entityName: `${donation.donorName} — ${donation.receiptNumber}`,
    diff: { after: { donorName: donation.donorName, amount: donation.amount, receiptNumber: donation.receiptNumber } },
  })

  return NextResponse.json(donation, { status: 201 })
}
