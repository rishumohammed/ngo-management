import { Suspense } from 'react'
import CommercialSubsidiariesClient from '@/app/admin/commercial-subsidiaries/CommercialSubsidiariesClient'
import { CircularProgress, Box } from '@mui/material'

export const metadata = {
  title: 'Commercial Subsidiaries & Enterprises | Free Mind Foundation',
  description: 'Manage commercial subsidiaries, social enterprises, and commercial revenue distributions',
}

export default function CommercialSubsidiariesPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
          <CircularProgress />
        </Box>
      }
    >
      <CommercialSubsidiariesClient />
    </Suspense>
  )
}
