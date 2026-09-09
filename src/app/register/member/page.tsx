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
  Autocomplete,
  Chip
} from '@mui/material';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import HomeIcon from '@mui/icons-material/Home';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { DEFAULT_INDIAN_STATES } from '@/lib/constants';

export default function MemberRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    state: '',
    gender: '',
    education: ''
  });

  const [options, setOptions] = useState<{ states: string[], districts: Record<string, string[]>, genders: string[], educations: string[], orgLogo: string, orgName: string }>({
    states: DEFAULT_INDIAN_STATES,
    districts: {},
    genders: ['Male', 'Female', 'Other'],
    educations: [],
    orgLogo: '',
    orgName: 'Free Mind Foundation'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpMessage, setOtpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/public/form-options')
      .then(res => res.json())
      .then(data => {
        setOptions(prev => ({
          ...prev,
          states: (data?.states && Array.isArray(data.states) && data.states.length > 0) ? data.states : prev.states,
          districts: data?.districts || {},
          genders: data?.genders || ['Male', 'Female', 'Other'],
          educations: data?.educations || [],
          orgLogo: data?.orgLogo || '',
          orgName: data?.orgName || 'Free Mind Foundation'
        }));
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSendOtp = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setOtpMessage({ type: 'error', text: 'Please enter a valid email address first.' });
      return;
    }
    setOtpSending(true);
    setOtpMessage(null);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, purpose: 'MEMBER_REGISTRATION' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        setOtpMessage({ type: 'success', text: data.message || 'Verification OTP sent to your email.' });
      } else {
        setOtpMessage({ type: 'error', text: data.error || data.warning || 'Failed to send OTP.' });
      }
    } catch (err) {
      setOtpMessage({ type: 'error', text: 'Error sending OTP. Please check your network connection.' });
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      setOtpMessage({ type: 'error', text: 'Please enter the 6-digit OTP code.' });
      return;
    }
    setOtpVerifying(true);
    setOtpMessage(null);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: otpCode, purpose: 'MEMBER_REGISTRATION' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpVerified(true);
        setOtpMessage({ type: 'success', text: 'Email verified successfully!' });
      } else {
        setOtpMessage({ type: 'error', text: data.error || 'Invalid verification code.' });
      }
    } catch (err) {
      setOtpMessage({ type: 'error', text: 'Error verifying OTP.' });
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.email && !otpVerified) {
      setError('Please verify your email address using the OTP code before submitting registration.');
      return;
    }

    setLoading(true);

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
            Welcome to {options.orgName}!
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
      <Paper sx={{ overflow: 'hidden', borderRadius: 3, boxShadow: 4 }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            py: 5,
            px: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'white',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {options.orgLogo ? (
            <Box
              sx={{
                bgcolor: 'white',
                p: 1.5,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 90,
                height: 90,
                mb: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <Box
                component="img"
                src={options.orgLogo}
                alt="Logo"
                sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                p: 2,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <VolunteerActivismIcon sx={{ fontSize: 48, color: 'white' }} />
            </Box>
          )}
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Member Registration
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.9, maxWidth: 600 }}>
            Join {options.orgName} and support our mission for preventive mental wellness.
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 3, md: 5 } }}>

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

            <Box sx={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <TextField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    handleChange(e);
                    if (otpVerified || otpSent) {
                      setOtpVerified(false);
                      setOtpSent(false);
                      setOtpCode('');
                      setOtpMessage(null);
                    }
                  }}
                  fullWidth
                  disabled={otpVerified}
                  helperText={otpVerified ? 'Email verified ✓' : 'Enter your email to receive a 6-digit verification OTP'}
                />
                {formData.email && formData.email.includes('@') && !otpVerified && (
                  <Button
                    variant="outlined"
                    onClick={handleSendOtp}
                    disabled={otpSending}
                    sx={{ height: 56, minWidth: 140, whitespace: 'nowrap' }}
                  >
                    {otpSending ? <CircularProgress size={20} /> : (otpSent ? 'Resend OTP' : 'Send OTP')}
                  </Button>
                )}
                {otpVerified && (
                  <Chip
                    icon={<CheckCircleOutlineIcon />}
                    label="Verified"
                    color="success"
                    sx={{ height: 48, px: 1, fontWeight: 'bold' }}
                  />
                )}
              </Box>

              {otpSent && !otpVerified && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f0f9ff', borderColor: '#0284c7', borderRadius: 2, mt: 0.5 }}>
                  <Typography variant="subtitle2" color="primary.dark" sx={{ mb: 1, fontWeight: 600 }}>
                    Enter 6-Digit OTP Code Sent to {formData.email}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      label="6-Digit OTP"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="e.g. 123456"
                      inputProps={{ maxLength: 6 }}
                      sx={{ width: 180, bgcolor: 'white' }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleVerifyOtp}
                      disabled={otpVerifying || otpCode.length < 6}
                      size="medium"
                    >
                      {otpVerifying ? <CircularProgress size={20} color="inherit" /> : 'Verify OTP'}
                    </Button>
                  </Box>
                </Paper>
              )}

              {otpMessage && (
                <Alert severity={otpMessage.type} sx={{ mt: 0.5 }}>
                  {otpMessage.text}
                </Alert>
              )}
            </Box>

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

            <Autocomplete
              options={options.states}
              value={formData.state || null}
              onChange={(_, newValue) => {
                setFormData(prev => ({ ...prev, state: newValue || '', district: '' }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="State / UT"
                  name="state"
                  fullWidth
                  placeholder="Select state"
                />
              )}
            />

            <Autocomplete
              options={formData.state && options.districts[formData.state] ? options.districts[formData.state] : []}
              value={formData.district || null}
              onChange={(_, newValue) => {
                setFormData(prev => ({ ...prev, district: newValue || '' }));
              }}
              disabled={!formData.state}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="District"
                  name="district"
                  fullWidth
                  placeholder={formData.state ? "Select district" : "Select state first"}
                />
              )}
            />
            
            <Autocomplete
              options={options.genders}
              value={formData.gender || null}
              onChange={(_, newValue) => setFormData(prev => ({ ...prev, gender: newValue || '' }))}
              renderInput={(params) => (
                <TextField {...params} label="Gender" required />
              )}
            />

            <Autocomplete
              options={options.educations}
              value={formData.education || null}
              onChange={(_, newValue) => setFormData(prev => ({ ...prev, education: newValue || '' }))}
              renderInput={(params) => (
                <TextField {...params} label="Education Level" required />
              )}
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
        </Box>
      </Paper>
    </Container>
  );
}
