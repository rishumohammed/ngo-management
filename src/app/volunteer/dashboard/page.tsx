import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Volunteer Dashboard' }

export default function VolunteerDashboardPage() {
  redirect('/volunteer/events')
}
