'use client'

import React from 'react'
import { Container, Box, Typography, Button, Paper } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'

export default function NotFound() {
  return (
    <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
      <Paper sx={{ p: 5, borderRadius: 3 }}>
        <Typography variant="h2" fontWeight="bold" color="primary.main" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" fontWeight="600" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<HomeIcon />}
          href="/"
        >
          Return to Home
        </Button>
      </Paper>
    </Container>
  )
}
