import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { generateMembershipCardPdf } from '@/lib/pdf/membershipCard'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!can(session.user.role, 'members', 'read'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const member = await prisma.member.findUnique({
      where: { id: params.id },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const orgSettingsList = await prisma.orgSetting.findMany({
      where: {
        key: { in: ['org_name', 'org_logo', 'org_signature', 'org_qr_code', 'signatory_name', 'signatory_title'] },
      },
    })

    const orgData = {
      orgName: orgSettingsList.find((s) => s.key === 'org_name')?.value || 'Free Mind Foundation',
      orgLogo: orgSettingsList.find((s) => s.key === 'org_logo')?.value || undefined,
      orgSignature: orgSettingsList.find((s) => s.key === 'org_signature')?.value || undefined,
      orgQrCode: orgSettingsList.find((s) => s.key === 'org_qr_code')?.value || undefined,
      signatory: orgSettingsList.find((s) => s.key === 'signatory_name')?.value || 'Authorised Signatory',
      signatoryTitle: orgSettingsList.find((s) => s.key === 'signatory_title')?.value || undefined,
    }

    const pdfBuffer = await generateMembershipCardPdf({ member, orgData })

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Membership_Card_${member.memberNumber}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Membership Card PDF Error:', error)
    return NextResponse.json({ error: 'Failed to generate Membership Card' }, { status: 500 })
  }
}
