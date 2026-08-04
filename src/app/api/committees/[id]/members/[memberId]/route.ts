import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'

export async function PUT(req: NextRequest, { params }: { params: { id: string, memberId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'committees', 'update')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const data = await req.json()
    const member = await prisma.committeeMember.update({
      where: { id: params.memberId },
      data: {
        designation: data.designation,
        role: data.role,
        termStart: data.termStart ? new Date(data.termStart) : null,
        termEnd: data.termEnd ? new Date(data.termEnd) : null,
        isActive: data.isActive,
      },
    })

    return NextResponse.json(member)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update committee member' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string, memberId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'committees', 'update')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.committeeMember.delete({
      where: { id: params.memberId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove committee member' }, { status: 500 })
  }
}
