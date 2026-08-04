import { Metadata } from 'next'
import CommitteesClient from './CommitteesClient'

export const metadata: Metadata = { title: 'Committees' }

export default function CommitteesPage() {
  return <CommitteesClient />
}
