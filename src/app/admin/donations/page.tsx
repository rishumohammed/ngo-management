import { Metadata } from 'next'
import DonationsClient from './DonationsClient'

export const metadata: Metadata = { title: 'Donations & 80G' }

export default function DonationsPage() {
  return <DonationsClient />
}
