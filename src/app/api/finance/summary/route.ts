import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { getFiscalYearDateRange } from '@/lib/utils'
import dayjs from 'dayjs'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'read'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const fiscalYear = searchParams.get('fiscalYear') || ''
  const dateRange = getFiscalYearDateRange(fiscalYear)

  const donationWhere: Record<string, any> = { status: 'CONFIRMED' }
  const commercialWhere: Record<string, any> = {}
  const expenseWhere: Record<string, any> = { status: 'PAID' }

  if (dateRange) {
    donationWhere.date = { gte: dateRange.startDate, lte: dateRange.endDate }
    commercialWhere.date = { gte: dateRange.startDate, lte: dateRange.endDate }
    expenseWhere.date = { gte: dateRange.startDate, lte: dateRange.endDate }
  }

  const sixMonthsAgo = dayjs().subtract(6, 'month').startOf('month').toDate()

  try {
    const [
      accounts,
      donationsAll,
      commercialRevsAll,
      expensesAll,
      expensesByCategoryRaw,
    ] = await Promise.all([
      prisma.paymentAccount.findMany({
        where: { isArchived: false },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      }),
      prisma.donation.aggregate({
        where: donationWhere,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.commercialRevenue.aggregate({
        where: commercialWhere,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: expenseWhere,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.groupBy({
        by: ['categoryId'],
        where: expenseWhere,
        _sum: { amount: true },
        _count: true,
      }),
    ])

    // Total available funds across payment accounts
    const totalAccountBalance = accounts.reduce(
      (sum: number, acc: any) => sum + Number(acc.currentBalance || 0),
      0
    )

    const totalDonations = Number(donationsAll._sum.amount || 0)
    const totalCommercialRevenues = Number(commercialRevsAll._sum.amount || 0)
    const totalRevenue = totalDonations + totalCommercialRevenues
    const totalExpenses = Number(expensesAll._sum.amount || 0)
    const netSurplus = totalRevenue - totalExpenses

    // Expenses by Category details
    const categoryIds = expensesByCategoryRaw.map((c: any) => c.categoryId)
    const categories = await prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds } },
    })

    const expensesByCategory = expensesByCategoryRaw.map((group: any) => {
      const cat = categories.find((c: any) => c.id === group.categoryId)
      return {
        categoryId: group.categoryId,
        categoryName: cat?.name || 'Uncategorized',
        amount: Number(group._sum.amount || 0),
        count: Number(group._count),
      }
    })

    // Fetch last 6 months records for trend charts
    const [recentDonations, recentCommercial, recentExpenses] = await Promise.all([
      prisma.donation.findMany({
        where: { date: { gte: sixMonthsAgo }, status: 'CONFIRMED' },
        select: { date: true, amount: true },
      }),
      prisma.commercialRevenue.findMany({
        where: { date: { gte: sixMonthsAgo } },
        select: { date: true, amount: true },
      }),
      prisma.expense.findMany({
        where: { date: { gte: sixMonthsAgo }, status: 'PAID' },
        select: { date: true, amount: true },
      }),
    ])

    const monthlyMap: Record<string, { donations: number; commercial: number; expenses: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const mKey = dayjs().subtract(i, 'month').format('YYYY-MM')
      monthlyMap[mKey] = { donations: 0, commercial: 0, expenses: 0 }
    }

    recentDonations.forEach((d: { date: Date; amount: any }) => {
      const mKey = dayjs(d.date).format('YYYY-MM')
      if (monthlyMap[mKey]) monthlyMap[mKey].donations += Number(d.amount || 0)
    })
    recentCommercial.forEach((c: { date: Date; amount: any }) => {
      const mKey = dayjs(c.date).format('YYYY-MM')
      if (monthlyMap[mKey]) monthlyMap[mKey].commercial += Number(c.amount || 0)
    })
    recentExpenses.forEach((e: { date: Date; amount: any }) => {
      const mKey = dayjs(e.date).format('YYYY-MM')
      if (monthlyMap[mKey]) monthlyMap[mKey].expenses += Number(e.amount || 0)
    })

    const monthlyTrends = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      donations: data.donations,
      commercial: data.commercial,
      totalIncome: data.donations + data.commercial,
      expenses: data.expenses,
      net: data.donations + data.commercial - data.expenses,
    }))

    return NextResponse.json({
      accounts: accounts.map((a: any) => ({
        id: a.id,
        accountName: a.accountName,
        accountType: a.accountType,
        bankName: a.bankName,
        accountNumber: a.accountNumber,
        currentBalance: Number(a.currentBalance),
        openingBalance: Number(a.openingBalance),
        isDefault: a.isDefault,
      })),
      totalAccountBalance,
      totalDonations,
      totalCommercialRevenues,
      totalRevenue,
      totalExpenses,
      netSurplus,
      expensesByCategory,
      monthlyTrends,
    })
  } catch (error) {
    console.error('Error computing financial summary:', error)
    return NextResponse.json({ error: 'Failed to compute financial summary' }, { status: 500 })
  }
}
