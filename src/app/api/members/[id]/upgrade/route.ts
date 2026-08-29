import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'members', 'update')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const member = await prisma.member.findUnique({
      where: { id: params.id }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Check if a volunteer with the same email already exists to prevent duplicate emails
    if (member.email) {
      const existing = await prisma.volunteer.findUnique({ where: { email: member.email } })
      if (existing) {
        return NextResponse.json({ error: 'A volunteer with this email already exists' }, { status: 400 })
      }
    }

    const volunteer = await prisma.volunteer.create({
      data: {
        name: member.name,
        email: member.email || `${member.id}@placeholder.fmf.org`, // email is required for Volunteer
        phone: member.phone,
        address: member.address,
        city: member.city,
        state: member.state,
        district: member.district,
        gender: member.gender,
        education: member.education,
        currentStage: 'APPLICATION',
        motivation: `Upgraded from Member (${member.memberNumber})`
      }
    })

    // Reassign committee memberships to new volunteer record if any
    await prisma.committeeMember.updateMany({
      where: { memberId: member.id },
      data: { memberId: null, volunteerId: volunteer.id }
    }).catch(() => {})

    // Reassign meeting attendees to avoid foreign key errors
    await prisma.meetingAttendee.updateMany({
      where: { memberId: member.id },
      data: { memberId: null }
    }).catch(() => {})

    // Remove member record from Members table so it moves completely to Volunteers
    await prisma.member.delete({
      where: { id: member.id }
    })

    await logAudit({
      userId: session.user.id,
      userName: session.user.name || undefined,
      action: 'UPDATE',
      entity: 'Member',
      entityId: member.id,
      entityName: member.name,
      diff: { after: { action: 'UPGRADED_AND_MOVED_TO_VOLUNTEER', newVolunteerId: volunteer.id } }
    })

    return NextResponse.json({ success: true, volunteer, moved: true })
  } catch (error) {
    console.error('Upgrade error:', error)
    return NextResponse.json({ error: 'Failed to upgrade to volunteer' }, { status: 500 })
  }
}
