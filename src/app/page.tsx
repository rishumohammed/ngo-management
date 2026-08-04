import React from 'react';
import { Container, Typography, Box, Paper, Button, Grid } from '@mui/material';
import Link from 'next/link';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function HomePage() {
  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1" color="primary.main" gutterBottom fontWeight="bold">
          Free Mind Foundation
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Trust & Volunteer Management System
        </Typography>
      </Box>

      {/* Support / Donate Banner */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 5,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          borderRadius: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography variant="h6" fontWeight="bold">
            Support Our Mental Wellness Mission
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Make a direct tax-exempt contribution to empower our initiatives.
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<VolunteerActivismIcon />}
          endIcon={<OpenInNewIcon fontSize="small" />}
          href="https://pages.razorpay.com/freemindfoundation"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            bgcolor: '#ffffff',
            color: '#0284c7',
            fontWeight: 'bold',
            px: 3,
            '&:hover': {
              bgcolor: '#f1f5f9'
            },
            whiteSpace: 'nowrap'
          }}
        >
          Donate Now
        </Button>
      </Paper>

      <Grid container spacing={4}>
        {/* Volunteer Access */}
        <Grid item xs={12} md={6}>
          <Paper elevation={4} sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'background.paper', borderRadius: 3 }}>
            <Typography variant="h5" gutterBottom color="primary" fontWeight="600">
              Volunteer Hub
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3, flexGrow: 1 }}>
              Offer your skills to make a difference, or log in to your existing volunteer portal.
            </Typography>
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button variant="contained" color="secondary" component={Link} href="/register/volunteer" fullWidth>
                Apply to Volunteer
              </Button>
              <Button variant="outlined" component={Link} href="/volunteer" fullWidth>
                Go to Volunteer Portal
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Public Registrations */}
        <Grid item xs={12} md={6}>
          <Paper elevation={4} sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'background.paper', borderRadius: 3 }}>
            <Typography variant="h5" gutterBottom color="primary" fontWeight="600">
              Become a Member
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3, flexGrow: 1 }}>
              Join the Free Mind Foundation to support our mission for preventive mental wellness.
            </Typography>
            <Button variant="contained" color="secondary" component={Link} href="/register/member" fullWidth sx={{ mt: 'auto' }}>
              Register as Member
            </Button>
          </Paper>
        </Grid>

      </Grid>
    </Container>
  );
}
