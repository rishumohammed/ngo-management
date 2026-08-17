import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content } = await req.json()
    if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

    const addendum = await prisma.meetingAddendum.create({
      data: {
        minuteId: params.id,
        content,
        addedBy: session.user.name || 'Unknown'
      }
    })

    return NextResponse.json(addendum)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
