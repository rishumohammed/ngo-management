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
  const sixMonthsAgo = dayjs().subtract(6, 'month').startOf('month').toDate()

  try {
    const [
      totalMembers,
      newMembersThisMonth,
      activeVolunteers,
      volunteerPipeline,
      donationsThisMonth,
      donationsThisQuarter,
      receiptsThisMonth,
      upcomingEventsRaw,
      overdueActionItems,
      expiringTerms,
      recentActivityRaw,
      orgSettings,
      recentDonations,
    ] = await Promise.all([
      prisma.member.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
      prisma.member.count({ where: { createdAt: { gte: startOfMonth } } }).catch(() => 0),
      prisma.volunteer.count({ where: { currentStage: 'APPROVED' } }).catch(() => 0),
      prisma.volunteer.groupBy({
        by: ['currentStage'],
        _count: { currentStage: true },
        where: { currentStage: { not: 'APPROVED' } },
      }).catch(() => []),
      prisma.donation.aggregate({
        where: { date: { gte: startOfMonth }, status: 'CONFIRMED' },
        _sum: { amount: true },
        _count: true,
      }).catch(() => ({ _sum: { amount: null }, _count: 0 })),
      prisma.donation.aggregate({
        where: { date: { gte: startOfQuarter }, status: 'CONFIRMED' },
        _sum: { amount: true },
        _count: true,
      }).catch(() => ({ _sum: { amount: null }, _count: 0 })),
      prisma.donationReceipt.count({
        where: { generatedAt: { gte: startOfMonth } },
      }).catch(() => 0),
      prisma.event.findMany({
        where: { startDate: { gte: now, lte: next7Days }, status: { in: ['PLANNED', 'ONGOING'] } },
        orderBy: { startDate: 'asc' },
        take: 5,
      }).catch(() => []),
      prisma.actionItem.count({
        where: { status: 'OPEN', dueDate: { lt: now } },
      }).catch(() => 0),
      prisma.committeeMember.count({
        where: { termEnd: { gte: now, lte: next30Days }, isActive: true },
      }).catch(() => 0),
      prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
      }).catch(() => []),
      prisma.orgSetting.findMany({
        where: { key: { in: ['eighty_g_validity', 'org_name'] } },
      }).catch(() => []),
      prisma.donation.findMany({
        where: { date: { gte: sixMonthsAgo }, status: 'CONFIRMED' },
        select: { date: true, amount: true },
        orderBy: { date: 'asc' },
      }).catch(() => []),
    ])

    // Compute monthly donation aggregations cleanly in JS (avoids BigInt serialization issues with $queryRaw)
    const monthlyMap: Record<string, { total: number; count: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const mKey = dayjs().subtract(i, 'month').format('YYYY-MM')
      monthlyMap[mKey] = { total: 0, count: 0 }
    }
    for (const d of recentDonations) {
      const mKey = dayjs(d.date).format('YYYY-MM')
      if (monthlyMap[mKey]) {
        monthlyMap[mKey].total += Number(d.amount || 0)
        monthlyMap[mKey].count += 1
      }
    }
    const monthlyDonations = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      total: data.total,
      count: data.count,
    }))

    // Check 80G expiry
    const eightyGValidity = orgSettings.find((s) => s.key === 'eighty_g_validity')?.value
    const eightyGExpiry = eightyGValidity ? new Date(eightyGValidity) : null
    const eightyGExpiringSoon = eightyGExpiry
      ? dayjs(eightyGExpiry).diff(dayjs(), 'day') <= 90
      : false

    // Safely serialize upcomingEvents (convert Dates to ISO strings)
    const upcomingEvents = upcomingEventsRaw.map((e) => ({
      id: e.id,
      name: e.name,
      status: e.status,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate ? e.endDate.toISOString() : null,
      location: e.location,
    }))

    // Safely serialize recentActivity
    const recentActivity = recentActivityRaw.map((a) => ({
      id: a.id,
      action: a.action,
      entity: a.entity,
      entityName: a.entityName,
      userName: a.userName,
      timestamp: a.timestamp.toISOString(),
    }))

    return {
      totalMembers,
      newMembersThisMonth,
      activeVolunteers,
      volunteerPipeline: volunteerPipeline.map((v) => ({
        currentStage: v.currentStage,
        _count: { currentStage: Number(v._count.currentStage) },
      })),
      donationsThisMonth: {
        amount: Number(donationsThisMonth._sum.amount || 0),
        count: Number(donationsThisMonth._count || 0),
      },
      donationsThisQuarter: {
        amount: Number(donationsThisQuarter._sum.amount || 0),
        count: Number(donationsThisQuarter._count || 0),
      },
      receiptsThisMonth,
      upcomingEvents,
      overdueActionItems,
      expiringTerms,
      recentActivity,
      eightyGExpiry: eightyGExpiry?.toISOString() || null,
      eightyGExpiringSoon,
      monthlyDonations,
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      totalMembers: 0,
      newMembersThisMonth: 0,
      activeVolunteers: 0,
      volunteerPipeline: [],
      donationsThisMonth: { amount: 0, count: 0 },
      donationsThisQuarter: { amount: 0, count: 0 },
      receiptsThisMonth: 0,
      upcomingEvents: [],
      overdueActionItems: 0,
      expiringTerms: 0,
      recentActivity: [],
      eightyGExpiry: null,
      eightyGExpiringSoon: false,
      monthlyDonations: [],
    }
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  return <DashboardClient data={data} />
}
