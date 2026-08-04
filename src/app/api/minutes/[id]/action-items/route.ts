import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'minutes', 'update')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const current = await prisma.meetingMinute.findUnique({ where: { id: params.id } })
    if (!current || current.status === 'FINALIZED') {
      return NextResponse.json({ error: 'Cannot edit finalized minutes' }, { status: 400 })
    }

    const data = await req.json()
    const actionItem = await prisma.actionItem.create({
      data: {
        minuteId: params.id,
        description: data.description,
        ownerName: data.ownerName,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status || 'OPEN',
      },
    })

    return NextResponse.json(actionItem)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create action item' }, { status: 500 })
  }
}
