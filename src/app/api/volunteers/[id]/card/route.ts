import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { generateVolunteerCardPdf } from '@/lib/pdf/volunteerCard'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const volunteer = await prisma.volunteer.findUnique({
      where: { id: params.id },
    })

    if (!volunteer) {
      return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })
    }

    // Permission check: Admin with read permission or self-service volunteer matching user id
    const isAdmin = can(session.user.role, 'volunteers', 'read')
    const isSelf = session.user.role === 'VOLUNTEER' && volunteer.userId === session.user.id

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

    const pdfBuffer = await generateVolunteerCardPdf({ volunteer, orgData })

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Volunteer_Card_${volunteer.name.replace(/\s+/g, '_')}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Volunteer Card PDF Error:', error)
    return NextResponse.json({ error: 'Failed to generate Volunteer Card' }, { status: 500 })
  }
}
