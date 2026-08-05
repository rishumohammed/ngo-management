import type { Metadata } from 'next'
import AdminLayout from '@/components/layout/AdminLayout'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | FMF Admin' },
}

export default async function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/login')
  }

  let logo: string | undefined = undefined
  try {
    const logoSetting = await prisma.orgSetting.findUnique({
      where: { key: 'org_logo' }
    })
    logo = logoSetting?.value || undefined
  } catch (err) {
    // Non-fatal if setting table is loading
  }

  return <AdminLayout session={session} logo={logo}>{children}</AdminLayout>
}
