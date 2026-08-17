import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'committees', 'read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const committee = await prisma.committee.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: { member: true, volunteer: true }
        }
      }
    })

    if (!committee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(committee)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch committee' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'committees', 'update')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const data = await req.json()
    const committee = await prisma.committee.update({
      where: { id: params.id },
      data: {
        name: data.name,
        type: data.type,
        purpose: data.purpose,
        isArchived: data.isArchived,
      }
    })

    return NextResponse.json(committee)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update committee' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'committees', 'delete')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if committee has members
    const committee = await prisma.committee.findUnique({
      where: { id: params.id },
      include: { _count: { select: { members: true } } }
    })

    if (!committee) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 })
    }

    if (committee._count.members > 0) {
      return NextResponse.json({ error: 'Cannot delete a committee that has members. Please remove the members first.' }, { status: 400 })
    }

    await prisma.committee.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete committee' }, { status: 500 })
  }
}
