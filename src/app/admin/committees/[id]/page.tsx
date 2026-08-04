import { Metadata } from 'next'
import CommitteeDetailClient from './CommitteeDetailClient'

export const metadata: Metadata = { title: 'Committee Details' }

export default function CommitteeDetailPage({ params }: { params: { id: string } }) {
  return <CommitteeDetailClient id={params.id} />
}
