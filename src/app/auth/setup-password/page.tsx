import { prisma } from '@/lib/prisma'
import SetupPasswordClient from './SetupPasswordClient'

export default async function SetupPasswordPage() {
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
    console.error('Failed to fetch org settings for setup password page:', error)
  }

  return <SetupPasswordClient orgLogo={orgLogo} orgName={orgName} />
}
