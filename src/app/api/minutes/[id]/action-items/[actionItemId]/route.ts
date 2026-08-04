import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'

export async function PUT(req: NextRequest, { params }: { params: { id: string, actionItemId: string } }) {
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
    const actionItem = await prisma.actionItem.update({
      where: { id: params.actionItemId },
      data: {
        description: data.description,
        ownerName: data.ownerName,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status,
        closedAt: data.status === 'DONE' ? new Date() : null,
      },
    })

    return NextResponse.json(actionItem)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update action item' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string, actionItemId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'minutes', 'update')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const current = await prisma.meetingMinute.findUnique({ where: { id: params.id } })
    if (!current || current.status === 'FINALIZED') {
      return NextResponse.json({ error: 'Cannot edit finalized minutes' }, { status: 400 })
    }

    await prisma.actionItem.delete({
      where: { id: params.actionItemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete action item' }, { status: 500 })
  }
}
