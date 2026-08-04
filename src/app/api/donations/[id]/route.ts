import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { getEmailProvider, donationReceiptTemplate } from '@/lib/email'
import { formatCurrency, formatDate } from '@/lib/utils'
import { generateReceiptPdf } from '@/lib/pdf/receipt'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'donations', 'read'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const donation = await prisma.donation.findUnique({
    where: { id: params.id },
    include: { receipt: true },
  })
  if (!donation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(donation)
}

// Download 80G PDF receipt
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'donations', 'read'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const action = body.action // 'pdf' | 'email'

  const donation = await prisma.donation.findUnique({ where: { id: params.id } })
  if (!donation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get org settings for PDF
  const settings = await prisma.orgSetting.findMany()
  const getSetting = (key: string) => settings.find((s) => s.key === key)?.value || ''

  const orgData = {
    orgName: getSetting('org_name') || 'Free Mind Foundation',
    orgAddress: getSetting('org_address') || '',
    orgPan: getSetting('org_pan') || '',
    eightyGNumber: getSetting('eighty_g_number') || '',
    eightyGValidity: getSetting('eighty_g_validity') || '',
    signatory: getSetting('signatory_name') || '',
    fcraNumber: getSetting('fcra_number') || '',
  }

  if (action === 'pdf') {
    try {
      const pdfBytes = await generateReceiptPdf({ donation, orgData })

      await logAudit({
        userId: session.user.id,
        userName: session.user.name || undefined,
        action: 'PDF_GENERATED',
        entity: 'Donation',
        entityId: donation.id,
        entityName: donation.receiptNumber,
      })

      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${donation.receiptNumber}.pdf"`,
        },
      })
    } catch (err) {
      console.error('PDF generation error:', err)
      return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
    }
  }

  if (action === 'email' && donation.donorEmail) {
    if (!can(session.user.role, 'donations', 'update'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
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
        where: { id: params.id },
        data: { receiptEmailed: true, receiptEmailedAt: new Date() },
      })

      await logAudit({
        userId: session.user.id,
        userName: session.user.name || undefined,
        action: 'EMAIL_SENT',
        entity: 'Donation',
        entityId: donation.id,
        entityName: donation.receiptNumber,
      })

      return NextResponse.json({ success: true })
    } catch (err) {
      console.error('Email send error:', err)
      return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
