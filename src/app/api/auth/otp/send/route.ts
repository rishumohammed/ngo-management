import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEmailProvider, otpEmailTemplate } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email, purpose = 'VERIFICATION' } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 })
    }

    // Generate random 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store in DB
    await prisma.emailOtp.create({
      data: {
        email: email.trim().toLowerCase(),
        code,
        purpose,
        expiresAt,
      },
    })

    // Fetch org settings for email branding
    const settings = await prisma.orgSetting.findMany({
      where: { key: { in: ['org_name'] } },
    })
    const orgName = settings.find((s) => s.key === 'org_name')?.value || 'Free Mind Foundation'

    // Send Email
    try {
      const emailProvider = await getEmailProvider()
      const template = otpEmailTemplate({ code, purpose, orgName })
      await emailProvider.send({
        to: email.trim().toLowerCase(),
        subject: template.subject,
        html: template.html,
        text: template.text,
      })
    } catch (err: any) {
      console.error('Failed to dispatch OTP email:', err)
      // Return code in response if email provider fails in dev/test environment or return warning
      return NextResponse.json({
        success: true,
        message: 'OTP generated. (Note: Email delivery failed, check logs or test provider in settings)',
        warning: err?.message || 'Email delivery warning',
      })
    }

    return NextResponse.json({ success: true, message: 'Verification OTP sent to your email.' })
  } catch (error: any) {
    console.error('OTP Send Error:', error)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
