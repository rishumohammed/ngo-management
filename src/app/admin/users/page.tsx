import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UsersClient from './UsersClient'

export const metadata: Metadata = { title: 'User Management' }

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/admin/dashboard')
  }

  return <UsersClient />
}
