import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'

export async function PUT(req: NextRequest, { params }: { params: { id: string, assignmentId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'events', 'update')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const data = await req.json()
    const assignment = await prisma.eventAssignment.update({
      where: { id: params.assignmentId },
      data: {
        role: data.role,
        taskDescription: data.taskDescription,
      },
    })

    return NextResponse.json(assignment)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string, assignmentId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'events', 'update')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.eventAssignment.delete({
      where: { id: params.assignmentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 })
  }
}
