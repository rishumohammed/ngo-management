import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'

dayjs.extend(quarterOfYear)

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const now = new Date()
  const startOfMonth = dayjs().startOf('month').toDate()
  const startOfQuarter = dayjs().startOf('quarter').toDate()
  const next7Days = dayjs().add(7, 'day').toDate()
  const next30Days = dayjs().add(30, 'day').toDate()

  const [
    totalMembers,
    newMembersThisMonth,
    activeVolunteers,
    volunteerPipeline,
    donationsThisMonth,
    donationsThisQuarter,
    receiptsThisMonth,
    upcomingEvents,
    overdueActionItems,
    expiringTerms,
    recentActivity,
    orgSettings,
    monthlyDonations,
  ] = await Promise.all([
    prisma.member.count({ where: { status: 'ACTIVE' } }),
    prisma.member.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.volunteer.count({ where: { currentStage: 'APPROVED' } }),
    prisma.volunteer.groupBy({
      by: ['currentStage'],
      _count: { currentStage: true },
      where: { currentStage: { not: 'APPROVED' } },
    }),
    prisma.donation.aggregate({
      where: { date: { gte: startOfMonth }, status: 'CONFIRMED' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.donation.aggregate({
      where: { date: { gte: startOfQuarter }, status: 'CONFIRMED' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.donationReceipt.count({
      where: { generatedAt: { gte: startOfMonth } },
    }),
    prisma.event.findMany({
      where: { startDate: { gte: now, lte: next7Days }, status: { in: ['PLANNED', 'ONGOING'] } },
      orderBy: { startDate: 'asc' },
      take: 5,
    }),
    prisma.actionItem.count({
      where: { status: 'OPEN', dueDate: { lt: now } },
    }),
    prisma.committeeMember.count({
      where: { termEnd: { gte: now, lte: next30Days }, isActive: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10,
    }),
    prisma.orgSetting.findMany({
      where: { key: { in: ['eighty_g_validity', 'org_name'] } },
    }),
    // Monthly donations for last 6 months
    prisma.$queryRaw<Array<{ month: string; total: number; count: number }>>`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        CAST(SUM(amount) AS DOUBLE) as total,
        COUNT(*) as count
      FROM donations
      WHERE date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        AND status = 'CONFIRMED'
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month ASC
    `,
  ])

  // Check 80G expiry
  const eightyGValidity = orgSettings.find((s) => s.key === 'eighty_g_validity')?.value
  const eightyGExpiry = eightyGValidity ? new Date(eightyGValidity) : null
  const eightyGExpiringSoon = eightyGExpiry
    ? dayjs(eightyGExpiry).diff(dayjs(), 'day') <= 90
    : false

  return {
    totalMembers,
    newMembersThisMonth,
    activeVolunteers,
    volunteerPipeline,
    donationsThisMonth: {
      amount: Number(donationsThisMonth._sum.amount || 0),
      count: donationsThisMonth._count,
    },
    donationsThisQuarter: {
      amount: Number(donationsThisQuarter._sum.amount || 0),
      count: donationsThisQuarter._count,
    },
    receiptsThisMonth,
    upcomingEvents,
    overdueActionItems,
    expiringTerms,
    recentActivity,
    eightyGExpiry: eightyGExpiry?.toISOString(),
    eightyGExpiringSoon,
    monthlyDonations,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  return <DashboardClient data={data} />
}
