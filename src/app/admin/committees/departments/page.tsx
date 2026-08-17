import { Metadata } from 'next'
import DepartmentsClient from './DepartmentsClient'

export const metadata: Metadata = {
  title: 'Departments',
}

export default function DepartmentsPage() {
  return <DepartmentsClient />
}
