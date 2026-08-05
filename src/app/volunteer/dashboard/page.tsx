import { Metadata } from 'next'
import VolunteerDashboardClient from './VolunteerDashboardClient'

export const metadata: Metadata = { title: 'Home | Volunteer Portal' }

export default function VolunteerDashboardPage() {
  return <VolunteerDashboardClient />
}
