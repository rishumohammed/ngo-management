import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'committees', 'update')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const data = await req.json()
    const member = await prisma.committeeMember.create({
      data: {
        committeeId: params.id,
        memberId: data.memberId || null,
        volunteerId: data.volunteerId || null,
        designation: data.designation,
        role: data.role || 'MEMBER',
        termStart: data.termStart ? new Date(data.termStart) : null,
        termEnd: data.termEnd ? new Date(data.termEnd) : null,
      },
    })

    return NextResponse.json(member)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add committee member' }, { status: 500 })
  }
}
