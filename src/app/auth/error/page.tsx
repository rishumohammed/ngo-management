'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Container, Paper, Typography, Button, Box, Alert } from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import Link from 'next/link'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  let message = 'An authentication error occurred. Please try again.'
  if (error === 'CredentialsSignin') {
    message = 'Sign in failed. Check the details you provided are correct.'
  } else if (error === 'SessionRequired') {
    message = 'Please sign in to access this page.'
  } else if (error === 'AccessDenied') {
    message = 'You do not have permission to access this resource.'
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 10, mb: 6 }}>
      <Paper elevation={4} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />
        </Box>
        <Typography variant="h5" color="error.main" gutterBottom fontWeight="bold">
          Authentication Error
        </Typography>
        <Alert severity="error" sx={{ my: 3, textAlign: 'left' }}>
          {message}
        </Alert>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" component={Link} href="/auth/login">
            Go to Login
          </Button>
          <Button variant="outlined" component={Link} href="/">
            Home
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 4, textAlign: 'center' }}>Loading...</Box>}>
      <ErrorContent />
    </Suspense>
  )
}
