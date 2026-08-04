import type { Metadata } from 'next'
import AdminLayout from '@/components/layout/AdminLayout'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | FMF Admin' },
}

import { prisma } from '@/lib/prisma'

export default async function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  const logoSetting = await prisma.orgSetting.findUnique({
    where: { key: 'org_logo' }
  })
  const logo = logoSetting?.value || undefined

  return <AdminLayout session={session} logo={logo}>{children}</AdminLayout>
}
