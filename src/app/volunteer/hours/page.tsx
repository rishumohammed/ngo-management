import { Metadata } from 'next'
import HoursClient from './HoursClient'

export const metadata: Metadata = { title: 'Hours Log' }

export default function HoursPage() {
  return <HoursClient />
}
