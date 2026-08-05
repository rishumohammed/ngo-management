import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { getFiscalYear, formatReceiptNumber, formatCurrency, formatDate } from '@/lib/utils'
import { getEmailProvider, donationReceiptTemplate } from '@/lib/email'
import { generateReceiptPdf } from '@/lib/pdf/receipt'
import { z } from 'zod'

const DonationSchema = z.object({
  donorName: z.string().min(1, 'Donor name is required'),
  donorPhone: z.string().optional().nullable(),
  donorEmail: z.string().email().optional().nullable().or(z.literal('')),
  donorPan: z.string().optional().nullable(),
  donorAddress: z.string().optional().nullable(),
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  paymentMode: z.enum(['CASH', 'CHEQUE', 'NEFT', 'RTGS', 'IMPS', 'UPI', 'DEMAND_DRAFT', 'ONLINE']),
  chequeNumber: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  purpose: z.string().optional().nullable(),
  tier: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  emailReceipt: z.boolean().optional().nullable(),
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
  const settings = await prisma.orgSetting.findMany()
  const getSetting = (key: string) => settings.find((s) => s.key === key)?.value || ''
  const prefix = getSetting('receipt_prefix') || 'FMF'
  const fyStartMonth = parseInt(getSetting('fy_start_month') || '4')

  const donationDate = new Date(parsed.data.date)
  const fiscalYear = getFiscalYear(donationDate, fyStartMonth)

  // Sequential receipt number within fiscal year
  const countInFY = await prisma.donation.count({ where: { fiscalYear } })
  const receiptNumber = formatReceiptNumber(prefix, fiscalYear, countInFY + 1)

  const { emailReceipt, ...dataFields } = parsed.data

  const donation = await prisma.donation.create({
    data: {
      donorName: dataFields.donorName,
      donorPhone: dataFields.donorPhone || null,
      donorEmail: dataFields.donorEmail || null,
      donorPan: dataFields.donorPan || null,
      donorAddress: dataFields.donorAddress || null,
      amount: dataFields.amount,
      date: donationDate,
      paymentMode: dataFields.paymentMode,
      chequeNumber: dataFields.chequeNumber || null,
      bankName: dataFields.bankName || null,
      purpose: dataFields.purpose || null,
      tier: dataFields.tier || null,
      notes: dataFields.notes || null,
      fiscalYear,
      receiptNumber,
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

  // If emailReceipt was requested and donorEmail is provided, attempt to send receipt email
  if (emailReceipt && donation.donorEmail) {
    try {
      const orgData = {
        orgName: getSetting('org_name') || 'Free Mind Foundation',
        orgAddress: getSetting('org_address') || '',
        orgPan: getSetting('org_pan') || '',
        eightyGNumber: getSetting('eighty_g_number') || '',
        eightyGValidity: getSetting('eighty_g_validity') || '',
        signatory: getSetting('signatory_name') || '',
        fcraNumber: getSetting('fcra_number') || '',
      }

      const pdfBytes = await generateReceiptPdf({ donation, orgData })
      const { subject, html, text } = donationReceiptTemplate({
        donorName: donation.donorName,
        receiptNumber: donation.receiptNumber,
        amount: formatCurrency(Number(donation.amount)),
        date: formatDate(donation.date),
        orgName: orgData.orgName,
      })

      await (await getEmailProvider()).send({
        to: donation.donorEmail,
        subject,
        html,
        text,
        attachments: [
          {
            filename: `${donation.receiptNumber}.pdf`,
            content: Buffer.from(pdfBytes),
            contentType: 'application/pdf',
          },
        ],
      })

      await prisma.donation.update({
        where: { id: donation.id },
        data: { receiptEmailed: true, receiptEmailedAt: new Date() },
      })
    } catch (err) {
      console.error('Auto-email receipt failed:', err)
    }
  }

  return NextResponse.json(donation, { status: 201 })
}
