'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { MembershipType } from '@prisma/client';

export default function MemberRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    membershipType: 'GENERAL'
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
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            Registration Successful!
          </Alert>
          <Typography variant="h5" gutterBottom>
            Welcome to the Free Mind Foundation
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your membership application has been received. Our team will contact you shortly if necessary.
          </Typography>
          <Button variant="contained" href="/">
            Return to Home
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary.main" align="center">
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

            <TextField
              select
              label="Membership Type"
              name="membershipType"
              value={formData.membershipType}
              onChange={handleChange}
              fullWidth
              sx={{ gridColumn: { sm: '1 / -1' } }}
            >
              <MenuItem value="GENERAL">General Member</MenuItem>
              <MenuItem value="LIFE">Life Member</MenuItem>
              <MenuItem value="HONORARY">Honorary Member</MenuItem>
              <MenuItem value="PATRON">Patron</MenuItem>
            </TextField>
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
