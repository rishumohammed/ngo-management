import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { generateVolunteerCardPdf } from '@/lib/pdf/volunteerCard'
import { getEmailProvider, volunteerInviteTemplate } from '@/lib/email'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!can(session.user.role, 'volunteers', 'read'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const volunteer = await prisma.volunteer.findUnique({
      where: { id: params.id },
    })

    if (!volunteer) {
      return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })
    }

    const orgSettingsList = await prisma.orgSetting.findMany({
      where: {
        key: { in: ['org_name', 'org_logo', 'org_signature', 'org_qr_code', 'signatory_name', 'signatory_title', 'app_url'] },
      },
    })

    const orgData = {
      orgName: orgSettingsList.find((s) => s.key === 'org_name')?.value || 'Free Mind Foundation',
      orgLogo: orgSettingsList.find((s) => s.key === 'org_logo')?.value || undefined,
      orgSignature: orgSettingsList.find((s) => s.key === 'org_signature')?.value || undefined,
      orgQrCode: orgSettingsList.find((s) => s.key === 'org_qr_code')?.value || undefined,
      signatory: orgSettingsList.find((s) => s.key === 'signatory_name')?.value || 'Authorised Signatory',
      signatoryTitle: orgSettingsList.find((s) => s.key === 'signatory_title')?.value || undefined,
      appUrl: orgSettingsList.find((s) => s.key === 'app_url')?.value || process.env.NEXTAUTH_URL || 'http://localhost:3000',
    }

    const pdfBuffer = await generateVolunteerCardPdf({ volunteer, orgData })
    const emailProvider = await getEmailProvider()

    const inviteToken = await prisma.inviteToken.findFirst({
      where: { userId: volunteer.userId || undefined },
      orderBy: { createdAt: 'desc' },
    })

    const inviteUrl = inviteToken ? `${orgData.appUrl}/auth/setup-password?token=${inviteToken.token}` : `${orgData.appUrl}/auth/login`

    const template = volunteerInviteTemplate({
      name: volunteer.name,
      inviteUrl,
      orgName: orgData.orgName,
    })

    await emailProvider.send({
      to: volunteer.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      attachments: [
        {
          filename: `Volunteer_Card_${volunteer.name.replace(/\s+/g, '_')}.pdf`,
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf',
        },
      ],
    })

    return NextResponse.json({
      success: true,
      message: `Volunteer Card email successfully dispatched to ${volunteer.email}`,
    })
  } catch (error: any) {
    console.error('Send Volunteer Card Email Error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to send Volunteer Card email' }, { status: 500 })
  }
}
