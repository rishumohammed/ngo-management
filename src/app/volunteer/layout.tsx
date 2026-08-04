import type { Metadata } from 'next'
import VolunteerLayout from '@/components/layout/VolunteerLayout'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: { default: 'Volunteer Portal', template: '%s | FMF Volunteer Portal' },
}

import { prisma } from '@/lib/prisma'

export default async function VolunteerSectionLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  const logoSetting = await prisma.orgSetting.findUnique({
    where: { key: 'org_logo' }
  })
  const logo = logoSetting?.value || undefined

  return <VolunteerLayout session={session} logo={logo}>{children}</VolunteerLayout>
}
