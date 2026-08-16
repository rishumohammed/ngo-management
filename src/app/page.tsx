import { prisma } from '@/lib/prisma'
import HomeClient from './HomeClient'

export default async function HomePage() {
  let orgLogo = ''
  let orgName = 'Free Mind Foundation'
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

  return <HomeClient orgLogo={orgLogo} orgName={orgName} />
}
