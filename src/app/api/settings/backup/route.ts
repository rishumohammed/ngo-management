import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!can(session.user.role, 'settings', 'update'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const [
      memberCount,
      volunteerCount,
      donationCount,
      expenseCount,
      userCount,
      auditLogCount,
    ] = await Promise.all([
      prisma.member.count(),
      prisma.volunteer.count(),
      prisma.donation.count(),
      prisma.expense.count(),
      prisma.user.count(),
      prisma.auditLog.count(),
    ])

    return NextResponse.json({
      schedule: {
        frequency: 'Daily',
        time: '02:00 AM IST',
        cronExpression: '0 2 * * *',
        status: 'Active',
      },
      retentionPolicy: {
        maxAgeDays: 7,
        autoCleanup: true,
        compression: 'GZIP (.sql.gz)',
      },
      stats: {
        memberCount,
        volunteerCount,
        donationCount,
        expenseCount,
        userCount,
        auditLogCount,
      },
    })
  } catch (error: any) {
    console.error('Backup Status API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch backup status' }, { status: 500 })
  }
}
