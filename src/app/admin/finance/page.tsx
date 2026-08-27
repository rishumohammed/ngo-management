import { Suspense } from 'react'
import { Metadata } from 'next'
import { Box, CircularProgress } from '@mui/material'
import FinanceClient from './FinanceClient'

export const metadata: Metadata = { title: 'Finance & Accounts — FMF Management' }

export default function FinancePage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
      <FinanceClient />
    </Suspense>
  )
}
