import { Metadata } from 'next'
import VolunteersClient from './VolunteersClient'

export const metadata: Metadata = { title: 'Volunteers' }

export default function VolunteersPage() {
  return <VolunteersClient />
}
