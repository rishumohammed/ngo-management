import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'events', 'update')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const data = await req.json()
    const assignment = await prisma.eventAssignment.create({
      data: {
        eventId: params.id,
        volunteerId: data.volunteerId || null,
        role: data.role || 'PARTICIPANT',
        taskDescription: data.taskDescription,
      },
    })

    return NextResponse.json(assignment)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to assign volunteer' }, { status: 500 })
  }
}
