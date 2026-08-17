import { prisma } from '@/lib/prisma'
import HomeClient from './HomeClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let orgLogo = ''
  let orgName = 'Free Mind Foundation'
  let stats = { members: 0, volunteers: 0, events: 0 }
  try {
    const settings = await prisma.orgSetting.findMany({
      where: {
        key: {
          in: ['org_logo', 'org_name'],
        },
      },
    })
    settings.forEach((setting) => {
      if (setting.key === 'org_logo') orgLogo = setting.value
      else if (setting.key === 'org_name') orgName = setting.value
    })
  } catch (error) {
    console.error('Failed to fetch org settings for home page:', error)
  }

  try {
    const [memberCount, volunteerCount, eventCount] = await Promise.all([
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.volunteer.count({ where: { currentStage: 'APPROVED', isSuspended: false } }),
      prisma.event.count({ where: { status: 'COMPLETED' } })
    ])
    stats = { members: memberCount, volunteers: volunteerCount, events: eventCount }
  } catch (error) {
    console.error('Failed to fetch stats for home page:', error)
  }

  return <HomeClient orgLogo={orgLogo} orgName={orgName} stats={stats} />
}
