import { Metadata } from 'next'
import MinuteDetailClient from './MinuteDetailClient'

export const metadata: Metadata = { title: 'Minute Details' }

export default function MinuteDetailPage({ params }: { params: { id: string } }) {
  return <MinuteDetailClient id={params.id} />
}
