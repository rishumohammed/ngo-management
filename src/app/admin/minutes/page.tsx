import { Metadata } from 'next'
import MinutesClient from './MinutesClient'

export const metadata: Metadata = { title: 'Meeting Minutes' }

export default function MinutesPage() {
  return <MinutesClient />
}
