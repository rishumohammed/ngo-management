import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await prisma.orgSetting.findMany()
  const obj: Record<string, string> = {}
  settings.forEach((s) => { obj[s.key] = s.value })
  return NextResponse.json(obj)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(session.user.role, 'settings', 'update'))
    return NextResponse.json({ error: 'Forbidden — Super Admin only' }, { status: 403 })

  const body: Record<string, string> = await req.json()

  // Upsert all provided settings
  const ops = Object.entries(body).map(([key, value]) =>
    prisma.orgSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    })
  )
  await prisma.$transaction(ops)

  await logAudit({
    userId: session.user.id,
    userName: session.user.name || undefined,
    action: 'UPDATE',
    entity: 'Settings',
    entityName: 'Organization Settings',
    diff: { after: body },
  })

  return NextResponse.json({ success: true })
}
