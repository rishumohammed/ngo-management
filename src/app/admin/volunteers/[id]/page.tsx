import { Metadata } from 'next'
import VolunteerDetailClient from './VolunteerDetailClient'

export const metadata: Metadata = {
  title: 'Volunteer Profile & Pipeline',
}

export default function VolunteerDetailPage({ params }: { params: { id: string } }) {
  return <VolunteerDetailClient id={params.id} />
}
