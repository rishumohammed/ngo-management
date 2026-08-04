import { Metadata } from 'next'
import VolunteerEventsClient from './VolunteerEventsClient'

export const metadata: Metadata = { title: 'My Events' }

export default function VolunteerEventsPage() {
  return <VolunteerEventsClient />
}
