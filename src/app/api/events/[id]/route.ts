import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'events', 'read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        assignments: {
          include: { volunteer: true }
        }
      }
    })

    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(event)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}
