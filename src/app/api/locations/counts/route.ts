import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [
      memberStateGroup,
      memberDistrictGroup,
      volunteerStateGroup,
      volunteerDistrictGroup,
    ] = await Promise.all([
      prisma.member.groupBy({
        by: ['state'],
        _count: { id: true },
        where: { state: { not: null } },
      }),
      prisma.member.groupBy({
        by: ['state', 'district'],
        _count: { id: true },
        where: { district: { not: null } },
      }),
      prisma.volunteer.groupBy({
        by: ['state'],
        _count: { id: true },
        where: { state: { not: null } },
      }),
      prisma.volunteer.groupBy({
        by: ['state', 'district'],
        _count: { id: true },
        where: { district: { not: null } },
      }),
    ])

    // State counts: { [stateName]: { members: number, volunteers: number } }
    const stateCounts: Record<string, { members: number; volunteers: number }> = {}
    
    memberStateGroup.forEach((g) => {
      if (g.state) {
        stateCounts[g.state] = stateCounts[g.state] || { members: 0, volunteers: 0 }
        stateCounts[g.state].members = g._count.id
      }
    })

    volunteerStateGroup.forEach((g) => {
      if (g.state) {
        stateCounts[g.state] = stateCounts[g.state] || { members: 0, volunteers: 0 }
        stateCounts[g.state].volunteers = g._count.id
      }
    })

    // District counts: { [`${state}___${district}`]: { members: number, volunteers: number } }
    const districtCounts: Record<string, { members: number; volunteers: number }> = {}

    memberDistrictGroup.forEach((g) => {
      if (g.district) {
        const key = g.state ? `${g.state}___${g.district}` : g.district
        districtCounts[key] = districtCounts[key] || { members: 0, volunteers: 0 }
        districtCounts[key].members = g._count.id
      }
    })

    volunteerDistrictGroup.forEach((g) => {
      if (g.district) {
        const key = g.state ? `${g.state}___${g.district}` : g.district
        districtCounts[key] = districtCounts[key] || { members: 0, volunteers: 0 }
        districtCounts[key].volunteers = g._count.id
      }
    })

    return NextResponse.json({ stateCounts, districtCounts })
  } catch (err) {
    console.error('Failed to calculate location counts:', err)
    return NextResponse.json({ error: 'Failed to calculate counts' }, { status: 500 })
  }
}
