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
      return NextResponse.json({ error: 'Forbidden — Super Admin only' }, { status: 403 })

    // Fetch primary tables data for dump
    const [
      users,
      members,
      volunteers,
      donations,
      expenses,
      committees,
      committeeMembers,
      events,
      meetingMinutes,
      orgSettings,
      auditLogs,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.member.findMany(),
      prisma.volunteer.findMany(),
      prisma.donation.findMany(),
      prisma.expense.findMany(),
      prisma.committee.findMany(),
      prisma.committeeMember.findMany(),
      prisma.event.findMany(),
      prisma.meetingMinute.findMany(),
      prisma.orgSetting.findMany(),
      prisma.auditLog.findMany({ take: 500, orderBy: { timestamp: 'desc' } }),
    ])

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `fmf_db_backup_${timestamp}.json`

    const dumpData = {
      meta: {
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.email,
        system: 'Free Mind Foundation Management Portal',
        retentionPolicy: 'Daily 2:00 AM Cron Backup (7-Day Auto-Cleanup)',
      },
      data: {
        users,
        members,
        volunteers,
        donations,
        expenses,
        committees,
        committeeMembers,
        events,
        meetingMinutes,
        orgSettings,
        auditLogs,
      },
    }

    return new NextResponse(JSON.stringify(dumpData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('In-App Database Backup Download Error:', error)
    return NextResponse.json({ error: 'Failed to generate database backup' }, { status: 500 })
  }
}
