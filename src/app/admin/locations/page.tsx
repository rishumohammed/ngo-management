import { Metadata } from 'next'
import LocationsClient from './LocationsClient'

export const metadata: Metadata = { title: 'Locations Master' }

export default function LocationsPage() {
  return <LocationsClient />
}
