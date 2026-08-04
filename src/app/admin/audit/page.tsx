import { Metadata } from 'next'
import AuditClient from './AuditClient'

export const metadata: Metadata = { title: 'Audit Log' }

export default function AuditPage() {
  return <AuditClient />
}
