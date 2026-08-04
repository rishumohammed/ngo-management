import React from 'react';
import { Container, Typography, Box, Paper, Button, Grid } from '@mui/material';
import Link from 'next/link';

export default function HomePage() {
  return (
    <Container maxWidth="md" sx={{ mt: 10 }}>
      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Typography variant="h3" component="h1" color="primary.main" gutterBottom>
          Free Mind Foundation
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Trust Management System
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Volunteer Access */}
        <Grid item xs={12} md={6}>
          <Paper elevation={4} sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'background.paper', borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom color="primary">
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
          <Paper elevation={4} sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'background.paper', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Become a Member
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3, flexGrow: 1 }}>
              Join the Free Mind Foundation to support our mission for preventive mental wellness.
            </Typography>
            <Button variant="contained" color="secondary" component={Link} href="/register/member" fullWidth>
              Register as Member
            </Button>
          </Paper>
        </Grid>

      </Grid>
    </Container>
  );
}
