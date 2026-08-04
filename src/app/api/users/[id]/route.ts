import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Prevent deactivating oneself
    if (session.user.id === params.id) {
      return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 })
    }

    const data = await req.json()
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        role: data.role,
        isActive: data.isActive,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    })

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
