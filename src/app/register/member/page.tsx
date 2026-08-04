'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import HomeIcon from '@mui/icons-material/Home';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function MemberRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/public/register/member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(result.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
        <Paper
          elevation={4}
          sx={{
            p: { xs: 3, sm: 5 },
            textAlign: 'center',
            borderRadius: 3,
            borderTop: '5px solid #0284c7'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 64, color: 'success.main' }} />
          </Box>

          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary.main">
            Welcome to Free Mind Foundation!
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
            Thank you for registering as a member. Your membership application has been successfully received. Together, we can make a lasting impact on preventive mental wellness and community empowerment.
          </Typography>

          <Paper
            variant="outlined"
            sx={{
              p: 3,
              mb: 4,
              bgcolor: 'rgba(2, 132, 199, 0.04)',
              borderColor: 'primary.light',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight="600" color="primary.dark">
              Support Our Mission
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Your valuable contribution helps us expand our mental health awareness programs, workshops, and community initiatives.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<VolunteerActivismIcon />}
              endIcon={<OpenInNewIcon fontSize="small" />}
              href="https://pages.razorpay.com/freemindfoundation"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                py: 1.5,
                px: 4,
                fontWeight: 'bold',
                fontSize: '1rem',
                boxShadow: 3
              }}
            >
              Donate Now
            </Button>
          </Paper>

          <Button
            variant="outlined"
            color="inherit"
            startIcon={<HomeIcon />}
            href="/"
            sx={{ minWidth: 160 }}
          >
            Return to Home
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary.main" align="center" fontWeight="bold">
          Member Registration
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Join the Free Mind Foundation and support our mission for preventive mental wellness.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <TextField
              required
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              sx={{ gridColumn: '1 / -1' }}
            />

            <TextField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
            />

            <TextField
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
            />

            <TextField
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
              sx={{ gridColumn: '1 / -1' }}
            />

            <TextField
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              fullWidth
            />

            <TextField
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
              fullWidth
            />
          </Box>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ minWidth: 200, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Register Now'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}
