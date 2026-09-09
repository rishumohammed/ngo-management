import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getEmailProvider } from '@/lib/email'
import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!can(session.user.role, 'settings', 'update'))
      return NextResponse.json({ error: 'Forbidden — Super Admin only' }, { status: 403 })

    const { targetEmail = 'freemindfoundation786@gmail.com' } = await req.json()

    const settings = await prisma.orgSetting.findMany({
      where: { key: { in: ['org_name'] } },
    })
    const orgName = settings.find((s) => s.key === 'org_name')?.value || 'Free Mind Foundation'

    const emailProvider = await getEmailProvider()
    await emailProvider.send({
      to: targetEmail,
      subject: `Test Email Connection — ${orgName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background: #00897B; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">${orgName}</h1>
          </div>
          <div style="padding: 32px; background: #ffffff;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Email System Operational</h2>
            <p style="color: #444; line-height: 1.6;">
              This is a test email sent from the <strong>FMF Management System</strong>. Your email provider configuration is working successfully!
            </p>
            <div style="background: #E0F2F1; color: #00695C; padding: 12px 16px; border-radius: 6px; font-weight: bold; margin-top: 20px;">
              ✓ Transactional Email Status: Active
            </div>
          </div>
          <div style="padding: 16px; background: #f9f9f9; text-align: center;">
            <p style="color: #aaa; font-size: 12px; margin: 0;">${orgName} — System Diagnostics</p>
          </div>
        </div>
      `,
      text: `Test Email Connection from ${orgName}. Your email provider configuration is working successfully!`,
    })

    return NextResponse.json({
      success: true,
      message: `Test email successfully sent to ${targetEmail}`,
    })
  } catch (error: any) {
    console.error('Test Email Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to send test email' },
      { status: 500 }
    )
  }
}
