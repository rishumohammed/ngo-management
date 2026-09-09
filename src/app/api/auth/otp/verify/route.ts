import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email, code, purpose = 'VERIFICATION' } = await req.json()

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Find valid, non-expired OTP record
    const otpRecord = await prisma.emailOtp.findFirst({
      where: {
        email: normalizedEmail,
        code: code.trim(),
        purpose,
        expiresAt: { gte: new Date() },
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 })
    }

    // Mark verified
    await prisma.emailOtp.update({
      where: { id: otpRecord.id },
      data: { verifiedAt: new Date() },
    })

    return NextResponse.json({ success: true, message: 'Email verified successfully.' })
  } catch (error: any) {
    console.error('OTP Verify Error:', error)
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 })
  }
}
