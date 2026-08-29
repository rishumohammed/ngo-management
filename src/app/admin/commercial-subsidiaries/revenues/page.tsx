import { Suspense } from 'react'
import CommercialRevenuesClient from '@/app/admin/commercial-subsidiaries/revenues/CommercialRevenuesClient'
import { CircularProgress, Box } from '@mui/material'

export const metadata = {
  title: 'Subsidiary Revenue & Profit Distributions | Free Mind Foundation',
  description: 'Manage commercial subsidiary revenue distributions, profit shares, and financial ledgers',
}

export default function CommercialRevenuesPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
          <CircularProgress />
        </Box>
      }
    >
      <CommercialRevenuesClient />
    </Suspense>
  )
}
