'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';

export default function VolunteerRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    availability: '',
    motivation: ''
  });
  
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  
  const [options, setOptions] = useState<{ availabilities: string[], skills: string[], interests: string[] }>({
    availabilities: [],
    skills: [],
    interests: []
  });
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/public/volunteer-form-options')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setOptions(data);
        setOptionsLoading(false);
      })
      .catch(() => setOptionsLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    setFormData({
      ...formData,
      [name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      skills,
      interests
    };

    try {
      const response = await fetch('/api/public/register/volunteer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
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
            Application Submitted Successfully!
          </Alert>
          <Typography variant="h5" gutterBottom>
            Thank You for Volunteering
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your application is now pending review. We will contact you regarding the next steps in our onboarding process.
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
          Volunteer Registration
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Become a volunteer at Free Mind Foundation. Help us make a difference in mental wellness.
        </Typography>

        {optionsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
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
            />

            <TextField
              required
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
              label="City"
              name="city"
              value={formData.city}
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
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
              fullWidth
            />
            
            <FormControl fullWidth>
              <InputLabel>Availability</InputLabel>
              <Select
                name="availability"
                value={formData.availability}
                label="Availability"
                onChange={handleChange as any}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {options.availabilities.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Skills Array Input */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Autocomplete
                multiple
                options={options.skills}
                value={skills}
                onChange={(_, newValue) => setSkills(newValue)}
                renderTags={(value: readonly string[], getTagProps) =>
                  value.map((option: string, index: number) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip variant="outlined" color="primary" label={option} key={key} {...tagProps} />;
                  })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Skills" placeholder="Select skills" />
                )}
              />
            </Box>

            {/* Interests Array Input */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Autocomplete
                multiple
                options={options.interests}
                value={interests}
                onChange={(_, newValue) => setInterests(newValue)}
                renderTags={(value: readonly string[], getTagProps) =>
                  value.map((option: string, index: number) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return <Chip variant="outlined" color="secondary" label={option} key={key} {...tagProps} />;
                  })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Interests" placeholder="Select interests" />
                )}
              />
            </Box>

            <TextField
              label="Motivation"
              name="motivation"
              value={formData.motivation}
              onChange={handleChange}
              placeholder="Why do you want to volunteer with us?"
              InputLabelProps={{ shrink: true }}
              fullWidth
              multiline
              rows={3}
              sx={{ gridColumn: '1 / -1' }}
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit Application'}
            </Button>
          </Box>
        </form>
          </>
        )}
      </Paper>
    </Container>
  );
}
