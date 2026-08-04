import { Metadata } from 'next'
import EventDetailClient from './EventDetailClient'

export const metadata: Metadata = { title: 'Event Details' }

export default function EventDetailPage({ params }: { params: { id: string } }) {
  return <EventDetailClient id={params.id} />
}
