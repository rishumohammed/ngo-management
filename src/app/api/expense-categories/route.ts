import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'
import { z } from 'zod'

const CategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional().nullable(),
  budgetLimit: z.number().optional().nullable(),
})

const DEFAULT_CATEGORIES = [
  { name: 'Office Rent & Maintenance', description: 'Rent, maintenance, and facility charges' },
  { name: 'Staff Salaries & Honorarium', description: 'Salaries, stipends, and honorarium for staff and trainers' },
  { name: 'Program & Outreach Operations', description: 'Costs for preventive wellness programs and campaigns' },
  { name: 'Utilities & Bills', description: 'Electricity, internet, water, and phone bills' },
  { name: 'Event & Workshop Expenses', description: 'Venue, logistics, materials, and catering for events' },
  { name: 'Travel & Conveyance', description: 'Field travel, transport, and fuel reimbursements' },
  { name: 'Administrative & Legal Fees', description: 'Audit fees, legal compliance, software, and printing' },
]

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'read'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const fiscalYear = searchParams.get('fiscalYear')

  const whereExpenses: any = {}
  if (fiscalYear && fiscalYear !== 'ALL') {
    whereExpenses.fiscalYear = fiscalYear
  }

  let categories = await prisma.expenseCategory.findMany({
    where: { isArchived: false },
    include: {
      expenses: {
        where: whereExpenses,
        select: { amount: true },
      },
      _count: {
        select: {
          expenses: {
            where: whereExpenses,
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Auto-seed default expense categories if empty
  if (categories.length === 0) {
    await prisma.expenseCategory.createMany({
      data: DEFAULT_CATEGORIES,
      skipDuplicates: true,
    })
    categories = await prisma.expenseCategory.findMany({
      where: { isArchived: false },
      include: {
        expenses: {
          where: whereExpenses,
          select: { amount: true },
        },
        _count: {
          select: {
            expenses: {
              where: whereExpenses,
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  const mappedCategories = categories.map((cat) => {
    const totalAmount = cat.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const expenseCount = cat.expenses.length
    const { expenses, ...catData } = cat
    return {
      ...catData,
      expenseCount,
      totalAmount,
    }
  })

  return NextResponse.json({ categories: mappedCategories })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'finance', 'create'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = CategorySchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 })

  const existing = await prisma.expenseCategory.findFirst({
    where: { name: parsed.data.name, isArchived: false },
  })
  if (existing)
    return NextResponse.json({ error: 'Category with this name already exists' }, { status: 400 })

  const category = await prisma.expenseCategory.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      budgetLimit: parsed.data.budgetLimit !== undefined ? parsed.data.budgetLimit : null,
    },
  })

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'CREATE',
    entity: 'ExpenseCategory',
    entityId: category.id,
    entityName: category.name,
  })

  return NextResponse.json(category, { status: 201 })
}
