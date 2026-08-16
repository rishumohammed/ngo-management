'use client'

import React from 'react'
import Link from 'next/link'
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  Stack,
} from '@mui/material'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import SecurityIcon from '@mui/icons-material/Security'

export default function HomeClient({ orgLogo, orgName = 'Free Mind Foundation' }: { orgLogo?: string; orgName?: string }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#F4F7FA',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* ── Top Header ── */}
      <Box
        component="header"
        sx={{
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E1E6EB',
          py: 2,
          px: { xs: 2, md: 4 },
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {orgLogo ? (
                <Box
                  component="img"
                  src={orgLogo}
                  alt={`${orgName} Logo`}
                  onError={(e: any) => {
                    e.currentTarget.style.display = 'none'
                  }}
                  sx={{
                    height: 40,
                    width: 'auto',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <VolunteerActivismIcon sx={{ fontSize: 32, color: '#12446A' }} />
              )}
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight={800}
                  sx={{
                    color: '#12446A',
                    letterSpacing: '0.02em',
                    lineHeight: 1.1,
                    fontSize: { xs: '0.95rem', sm: '1.1rem' },
                  }}
                >
                  {orgName.toUpperCase()}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Trust & Operations Management System
                </Typography>
              </Box>
            </Box>

            <Button
              variant="outlined"
              size="small"
              component={Link}
              href="/auth/login"
              startIcon={<AdminPanelSettingsIcon />}
              sx={{
                borderRadius: '8px',
                borderColor: '#12446A',
                color: '#12446A',
                fontWeight: 600,
                px: 2,
                '&:hover': {
                  borderColor: '#0A2B45',
                  bgcolor: 'rgba(18, 68, 106, 0.04)',
                },
              }}
            >
              Portal Login
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ── Main Hub Content ── */}
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 }, flexGrow: 1 }}>
        {/* Title Banner */}
        <Box
          sx={{
            textAlign: 'center',
            mb: { xs: 4, sm: 5 },
          }}
        >
          {/* Pill Badge */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.25,
              px: 2,
              py: 0.75,
              bgcolor: '#FFFFFF',
              border: '1px solid #E1E8F0',
              borderRadius: '9999px',
              boxShadow: '0 2px 8px rgba(18, 68, 106, 0.04)',
              mb: 2.5,
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: '#22C55E',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: '#12446A',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontSize: '0.725rem',
              }}
            >
              Trust Management & Community Services
            </Typography>
          </Box>

          {/* Main Title */}
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.75rem', sm: '2.35rem', md: '2.65rem' },
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              color: '#12446A',
              mb: 1.5,
            }}
          >
            Management & Registration Portal
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body1"
            sx={{
              color: '#52657A',
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              lineHeight: 1.6,
              maxWidth: '600px',
              mx: 'auto',
              fontWeight: 400,
            }}
          >
            Official gateway for volunteer onboarding, member registration, and operational management for Free Mind Foundation.
          </Typography>
        </Box>

        {/* Portal Cards Grid (2 Cards: Volunteer Hub & Member Registration) */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Card 1: Volunteer Hub */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                border: '1px solid #E1E6EB',
                bgcolor: '#FFFFFF',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#12446A',
                  boxShadow: '0 8px 24px rgba(18, 68, 106, 0.08)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: 3.5, flexGrow: 1 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: '#E7F0F7',
                    color: '#12446A',
                    mb: 2,
                    borderRadius: 2.5,
                  }}
                >
                  {orgLogo ? (
                    <Box
                      component="img"
                      src={orgLogo}
                      alt="Logo"
                      sx={{ height: 24, width: 'auto', objectFit: 'contain' }}
                    />
                  ) : (
                    <VolunteerActivismIcon />
                  )}
                </Avatar>
                <Typography variant="h6" fontWeight={700} color="#12446A" gutterBottom>
                  Volunteer Hub
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  Apply as a mental wellness volunteer or access your active volunteer workspace.
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 3.5, pt: 0, flexDirection: 'column', gap: 1.5 }}>
                <Button
                  variant="contained"
                  fullWidth
                  component={Link}
                  href="/register/volunteer"
                  sx={{
                    bgcolor: '#12446A',
                    color: '#FFFFFF',
                    borderRadius: 2,
                    py: 1.1,
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#0A2B45' },
                  }}
                >
                  Apply to Volunteer
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  component={Link}
                  href="/auth/login"
                  endIcon={<ArrowForwardIcon fontSize="small" />}
                  sx={{
                    borderColor: '#E1E6EB',
                    color: '#12446A',
                    borderRadius: 2,
                    py: 1,
                    fontWeight: 600,
                    '&:hover': { borderColor: '#12446A', bgcolor: '#F4F7FA' },
                  }}
                >
                  Volunteer Portal Login
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Card 2: Member Registration */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                border: '1px solid #E1E6EB',
                bgcolor: '#FFFFFF',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#2E7D32',
                  boxShadow: '0 8px 24px rgba(46, 125, 50, 0.08)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: 3.5, flexGrow: 1 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: '#E8F5E9',
                    color: '#2E7D32',
                    mb: 2,
                    borderRadius: 2.5,
                  }}
                >
                  <HowToRegIcon />
                </Avatar>
                <Typography variant="h6" fontWeight={700} color="#12446A" gutterBottom>
                  Member Registration
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  Join the Free Mind Foundation trust as an official registered member and supporter.
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 3.5, pt: 0, flexDirection: 'column', gap: 1.5 }}>
                <Button
                  variant="contained"
                  fullWidth
                  component={Link}
                  href="/register/member"
                  sx={{
                    bgcolor: '#2E7D32',
                    color: '#FFFFFF',
                    borderRadius: 2,
                    py: 1.1,
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#1B5E20' },
                  }}
                >
                  Register as Member
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        {/* Support / 80G Donation Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3,
            bgcolor: '#12446A',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            boxShadow: '0 4px 16px rgba(18, 68, 106, 0.15)',
          }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              {orgLogo ? (
                <Box
                  component="img"
                  src={orgLogo}
                  alt="Logo"
                  sx={{ height: 20, width: 'auto', objectFit: 'contain' }}
                />
              ) : (
                <VolunteerActivismIcon sx={{ fontSize: 20, color: '#4ADE80' }} />
              )}
              <Typography variant="subtitle1" fontWeight={700}>
                Support {orgName}
              </Typography>
              <Chip
                label="80G Tax Exempt"
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: '#FFFFFF',
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              />
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Direct contribution via Razorpay with instant 80G tax receipt generation.
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="medium"
            endIcon={<OpenInNewIcon fontSize="small" />}
            href="https://pages.razorpay.com/freemindfoundation"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              bgcolor: '#FFFFFF',
              color: '#12446A',
              fontWeight: 700,
              px: 3,
              py: 1,
              borderRadius: 2,
              whiteSpace: 'nowrap',
              '&:hover': {
                bgcolor: '#F1F5F9',
              },
            }}
          >
            Donate Now
          </Button>
        </Paper>
      </Container>

      {/* ── Minimalist Clean Footer ── */}
      <Box
        component="footer"
        sx={{
          bgcolor: '#FFFFFF',
          borderTop: '1px solid #E1E6EB',
          py: 2.5,
          px: 2,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} Free Mind Foundation. Trust & Operations Management System.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Typography
                component={Link}
                href="/register/volunteer"
                variant="caption"
                sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                Volunteer Registration
              </Typography>
              <Typography
                component={Link}
                href="/register/member"
                variant="caption"
                sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                Member Registration
              </Typography>
              <Typography
                component={Link}
                href="/auth/login"
                variant="caption"
                sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                Portal Login
              </Typography>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
