'use client'

import React from 'react'
import Link from 'next/link'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  Paper,
  Stack,
  useTheme
} from '@mui/material'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import CampaignIcon from '@mui/icons-material/Campaign'
import SchoolIcon from '@mui/icons-material/School'
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom'
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import PsychologyIcon from '@mui/icons-material/Psychology'
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement'
import ChildCareIcon from '@mui/icons-material/ChildCare'
import Diversity3Icon from '@mui/icons-material/Diversity3'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import BadgeIcon from '@mui/icons-material/Badge'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

const PILLARS = [
  {
    icon: <CampaignIcon sx={{ fontSize: 32, color: '#12446A' }} />,
    title: 'Community Programs',
    desc: 'Educating people across all social strata through interactive workshops, awareness campaigns, and open dialogue on mental health.',
  },
  {
    icon: <SchoolIcon sx={{ fontSize: 32, color: '#12446A' }} />,
    title: 'School & College Outreach',
    desc: 'Promoting mental awareness in young minds through proactive counselling, peer mentorship, and education to combat anxiety and stress.',
  },
  {
    icon: <FamilyRestroomIcon sx={{ fontSize: 32, color: '#12446A' }} />,
    title: 'Family Support Sessions',
    desc: 'Guiding families to understand and prevent emotional well-being lapses, communicating with empathy, and building supportive homes.',
  },
  {
    icon: <VolunteerActivismIcon sx={{ fontSize: 32, color: '#12446A' }} />,
    title: 'Volunteer Engagement',
    desc: 'Empowering compassionate individuals as preventive mental wellness ambassadors through training, structure, and field participation.',
  },
  {
    icon: <EmojiEmotionsIcon sx={{ fontSize: 32, color: '#12446A' }} />,
    title: 'Early Childhood Emotional Learning',
    desc: 'Proactive focus on toddlers and young minds to nurture emotional regulation, healthy expression, and resilience from early stages.',
  },
  {
    icon: <EventAvailableIcon sx={{ fontSize: 32, color: '#12446A' }} />,
    title: 'Public Events & Campaigns',
    desc: 'Organizing awareness talks, community walks, and cultural events that normalize mental health discussions and remove societal stigma.',
  },
]

const LIFECYCLES = [
  {
    badge: 'Stage 01',
    title: 'Mental Health of Pre-Born & Expecting Parents',
    desc: 'Sensitizing expecting parents to understand emotional changes, mitigate perinatal anxiety, and foster a nurturing, mentally healthy family ecosystem.',
    icon: <Diversity3Icon sx={{ fontSize: 36, color: '#12446A' }} />,
  },
  {
    badge: 'Stage 02',
    title: 'Mental Health of Toddlers & Early Childhood',
    desc: 'Supporting toddlers with emotional developmental milestones, helping parents decode stress cues, and building joyful, secure bonds.',
    icon: <ChildCareIcon sx={{ fontSize: 36, color: '#12446A' }} />,
  },
  {
    badge: 'Stage 03',
    title: 'Mental Health of Young Children & Youth',
    desc: 'Equipping youth and students with tools for emotional regulation, coping mechanisms, positive self-esteem, and peer support systems.',
    icon: <PsychologyIcon sx={{ fontSize: 36, color: '#12446A' }} />,
  },
]

const TRUSTEES = [
  {
    name: 'Nishad Ali Shahnaz',
    role: 'Chairman',
    bio: 'Guiding the foundation’s vision towards scalable preventive wellness and public healthcare advocacy.',
    initials: 'NS',
  },
  {
    name: 'Rishu Mohammed',
    role: 'Secretary',
    bio: 'Overseeing operations, technology adoption, community outreach, and volunteer mobilization programs.',
    initials: 'RM',
  },
  {
    name: 'Anupal K',
    role: 'Treasurer',
    bio: 'Ensuring financial integrity, regulatory 80G governance, and transparent resource stewardship.',
    initials: 'AK',
  },
]

export default function HomePage() {
  const theme = useTheme()

  return (
    <Box sx={{ bgcolor: '#FAFBFD', color: '#15202B', minHeight: '100vh' }}>
      
      {/* ── Top Navigation Bar ── */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(225, 230, 235, 0.8)',
          py: 1.5,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Brand Logo & Name */}
            <Box
              component={Link}
              href="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <Box
                component="img"
                src="/uploads/1785395589566-453926861-fmf.png"
                alt="Free Mind Foundation Logo"
                onError={(e: any) => {
                  e.currentTarget.style.display = 'none'
                }}
                sx={{
                  height: 42,
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight={800}
                  sx={{
                    letterSpacing: '0.02em',
                    color: '#12446A',
                    lineHeight: 1.1,
                    textTransform: 'uppercase',
                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                  }}
                >
                  Free Mind Foundation
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#5C6B74',
                    letterSpacing: '0.05em',
                    fontSize: '0.68rem',
                    fontWeight: 500,
                  }}
                >
                  Preventive Mental Wellness Trust
                </Typography>
              </Box>
            </Box>

            {/* Desktop Navigation Links */}
            <Stack
              direction="row"
              spacing={3}
              sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}
            >
              <Button component={Link} href="#pillars" color="inherit" sx={{ fontWeight: 500 }}>
                Programs
              </Button>
              <Button component={Link} href="#lifecycle" color="inherit" sx={{ fontWeight: 500 }}>
                What We Do
              </Button>
              <Button component={Link} href="#impact" color="inherit" sx={{ fontWeight: 500 }}>
                How We Change Lives
              </Button>
              <Button component={Link} href="#leadership" color="inherit" sx={{ fontWeight: 500 }}>
                Leadership
              </Button>
              <Button component={Link} href="#portals" color="inherit" sx={{ fontWeight: 500 }}>
                Portals
              </Button>
            </Stack>

            {/* Header Action Buttons */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="outlined"
                color="primary"
                size="small"
                component={Link}
                href="/auth/login"
                sx={{
                  borderRadius: '20px',
                  px: 2,
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  borderColor: '#12446A',
                }}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<VolunteerActivismIcon fontSize="small" />}
                href="https://pages.razorpay.com/freemindfoundation"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  bgcolor: '#12446A',
                  color: '#ffffff',
                  borderRadius: '20px',
                  px: 2.5,
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  '&:hover': {
                    bgcolor: '#0A2B45',
                  },
                }}
              >
                Donate
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* ── Hero Section ── */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 6, md: 10 },
          pb: { xs: 8, md: 12 },
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F1F6FA 100%)',
          borderBottom: '1px solid #E1E6EB',
        }}
      >
        {/* Subtle Background Glow Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(18, 68, 106, 0.06) 0%, rgba(255, 255, 255, 0) 70%)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-15%',
            left: '-10%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(67, 160, 71, 0.05) 0%, rgba(255, 255, 255, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            {/* Left Hero Text Content */}
            <Grid item xs={12} md={7}>
              <Chip
                icon={<PsychologyIcon sx={{ fontSize: '1rem !important', color: '#12446A' }} />}
                label="Mindful Society & Preventive Wellness"
                size="small"
                sx={{
                  bgcolor: 'rgba(18, 68, 106, 0.08)',
                  color: '#12446A',
                  fontWeight: 600,
                  mb: 2.5,
                  px: 1,
                  py: 0.5,
                  borderRadius: '16px',
                }}
              />

              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontSize: { xs: '2.35rem', sm: '3.1rem', md: '3.65rem' },
                  fontWeight: 800,
                  lineHeight: 1.15,
                  color: '#12446A',
                  letterSpacing: '-0.02em',
                  mb: 2.5,
                }}
              >
                Freeing Minds <br />
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #12446A 0%, #3D688C 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Through Awareness
                </Box>
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: '#475569',
                  fontSize: { xs: '1rem', md: '1.15rem' },
                  lineHeight: 1.7,
                  mb: 4,
                  maxWidth: '560px',
                }}
              >
                We believe mental well-being starts with awareness of ourselves, of others, and how mental health shapes society. Join our community-first mission for empathy, resilience, and early emotional care.
              </Typography>

              {/* Primary Call to Actions */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<VolunteerActivismIcon />}
                  href="https://pages.razorpay.com/freemindfoundation"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    bgcolor: '#12446A',
                    color: '#FFFFFF',
                    px: 3.5,
                    py: 1.4,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: '10px',
                    boxShadow: '0 8px 20px rgba(18, 68, 106, 0.25)',
                    '&:hover': {
                      bgcolor: '#0A2B45',
                    },
                  }}
                >
                  Donate Now
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  component={Link}
                  href="/register/volunteer"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    borderColor: '#12446A',
                    color: '#12446A',
                    px: 3,
                    py: 1.4,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: '10px',
                    '&:hover': {
                      borderColor: '#0A2B45',
                      bgcolor: 'rgba(18, 68, 106, 0.04)',
                    },
                  }}
                >
                  Join as Volunteer
                </Button>
              </Stack>

              {/* Trust Indicators Bar */}
              <Stack
                direction="row"
                spacing={{ xs: 2.5, sm: 4 }}
                alignItems="center"
                divider={<Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center' }} />}
              >
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#12446A">
                    80G
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tax Exemptions
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#12446A">
                    36+
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    States & UTs Covered
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#12446A">
                    100%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Non-Profit Trust
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            {/* Right Hero Interactive Showcase Card */}
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, sm: 4 },
                  borderRadius: 4,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E1E6EB',
                  boxShadow: '0 12px 36px rgba(18, 68, 106, 0.08)',
                  position: 'relative',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      bgcolor: 'rgba(18, 68, 106, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#12446A',
                    }}
                  >
                    <SelfImprovementIcon sx={{ fontSize: 26 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} color="#12446A">
                      Management & Action Hub
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Empowering mental health across communities
                    </Typography>
                  </Box>
                </Box>

                <Stack spacing={2}>
                  {/* Quick Option 1: Volunteer */}
                  <Paper
                    variant="outlined"
                    component={Link}
                    href="/register/volunteer"
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#12446A',
                        bgcolor: '#F4F7FA',
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: '#E7F0F7', color: '#12446A', width: 38, height: 38 }}>
                        <VolunteerActivismIcon sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          Volunteer Registration
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Become a certified wellness advocate
                        </Typography>
                      </Box>
                    </Box>
                    <ArrowForwardIcon fontSize="small" sx={{ color: '#5C6B74' }} />
                  </Paper>

                  {/* Quick Option 2: Member */}
                  <Paper
                    variant="outlined"
                    component={Link}
                    href="/register/member"
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#12446A',
                        bgcolor: '#F4F7FA',
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', width: 38, height: 38 }}>
                        <HowToRegIcon sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          Member Registration
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Join our permanent membership network
                        </Typography>
                      </Box>
                    </Box>
                    <ArrowForwardIcon fontSize="small" sx={{ color: '#5C6B74' }} />
                  </Paper>

                  {/* Quick Option 3: Volunteer Workspace */}
                  <Paper
                    variant="outlined"
                    component={Link}
                    href="/volunteer/dashboard"
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#12446A',
                        bgcolor: '#F4F7FA',
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: '#EDE7F6', color: '#512DA8', width: 38, height: 38 }}>
                        <BadgeIcon sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          Volunteer Portal
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Access events, attendance & hours
                        </Typography>
                      </Box>
                    </Box>
                    <ArrowForwardIcon fontSize="small" sx={{ color: '#5C6B74' }} />
                  </Paper>

                  {/* Quick Option 4: Admin Workspace */}
                  <Paper
                    variant="outlined"
                    component={Link}
                    href="/admin/dashboard"
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#12446A',
                        bgcolor: '#F4F7FA',
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: '#FFF3E0', color: '#E65100', width: 38, height: 38 }}>
                        <AdminPanelSettingsIcon sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          Admin & Trust Console
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          80G receipts, donations & governance
                        </Typography>
                      </Box>
                    </Box>
                    <ArrowForwardIcon fontSize="small" sx={{ color: '#5C6B74' }} />
                  </Paper>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Core Programs & Pillars Section ── */}
      <Box id="pillars" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FAFBFD' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Chip
              label="Our Core Pillars"
              size="small"
              sx={{
                bgcolor: 'rgba(18, 68, 106, 0.08)',
                color: '#12446A',
                fontWeight: 600,
                mb: 1.5,
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.85rem', md: '2.5rem' },
                fontWeight: 800,
                color: '#12446A',
                letterSpacing: '-0.01em',
                mb: 1.5,
              }}
            >
              Holistic Mental Wellness Initiatives
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '640px', mx: 'auto' }}>
              Structured, proactive community engagement designed to foster early detection, dialogue, and compassionate assistance.
            </Typography>
          </Box>

          <Grid container spacing={3.5}>
            {PILLARS.map((pillar, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    p: 2,
                    borderRadius: 3.5,
                    border: '1px solid #E1E6EB',
                    bgcolor: '#FFFFFF',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 12px 28px rgba(18, 68, 106, 0.08)',
                      borderColor: '#B0C0CC',
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 3,
                        bgcolor: '#F0F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2.5,
                      }}
                    >
                      {pillar.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={700} color="#12446A" gutterBottom>
                      {pillar.title}
                    </Typography>
                    <Typography variant="body2" color="#5C6B74" sx={{ lineHeight: 1.6 }}>
                      {pillar.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── What We Do / Lifecycle Focus Section ── */}
      <Box
        id="lifecycle"
        sx={{
          py: { xs: 8, md: 12 },
          bgcolor: '#FFFFFF',
          borderTop: '1px solid #E1E6EB',
          borderBottom: '1px solid #E1E6EB',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.85rem', md: '2.5rem' },
                fontWeight: 800,
                color: '#12446A',
                mb: 1.5,
              }}
            >
              What We Do
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '680px', mx: 'auto' }}>
              We promote mental health awareness across all age groups throughout society, empowering individuals with lifelong psychological resilience.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {LIFECYCLES.map((item, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    height: '100%',
                    p: { xs: 3, sm: 4 },
                    borderRadius: 4,
                    border: '1px solid #E1E6EB',
                    bgcolor: '#FAFBFD',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: '#FFFFFF',
                      borderColor: '#12446A',
                      boxShadow: '0 8px 24px rgba(18, 68, 106, 0.08)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: '12px',
                        bgcolor: 'rgba(18, 68, 106, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Chip label={item.badge} size="small" sx={{ fontWeight: 700, color: '#12446A', bgcolor: '#E7F0F7' }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="#12446A" sx={{ mb: 1.5, minHeight: '48px' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="#5C6B74" sx={{ lineHeight: 1.7, flexGrow: 1 }}>
                    {item.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── How We Change Lives (Impact & Safe Spaces) ── */}
      <Box
        id="impact"
        sx={{
          py: { xs: 8, md: 12 },
          background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
          borderBottom: '1px solid #E1E6EB',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            {/* Left Graphic Element */}
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  p: { xs: 4, sm: 6 },
                  borderRadius: 4,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E1E6EB',
                  boxShadow: '0 8px 24px rgba(18, 68, 106, 0.06)',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    bgcolor: 'rgba(18, 68, 106, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    color: '#12446A',
                  }}
                >
                  <SelfImprovementIcon sx={{ fontSize: 52 }} />
                </Box>
                <Typography variant="h5" fontWeight={700} color="#12446A" gutterBottom>
                  Mindfulness & Empathy
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Creating quiet, supportive environments where individuals find calm, professional peer guidance, and hope.
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Chip icon={<CheckCircleOutlineIcon fontSize="small" />} label="Zero Judgement" size="small" variant="outlined" color="primary" />
                  <Chip icon={<ShieldOutlinedIcon fontSize="small" />} label="100% Confidential" size="small" variant="outlined" color="primary" />
                </Stack>
              </Box>
            </Grid>

            {/* Right Text Content */}
            <Grid item xs={12} md={7}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '1.85rem', md: '2.5rem' },
                  fontWeight: 800,
                  color: '#12446A',
                  mb: 3,
                }}
              >
                How We Change Lives
              </Typography>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} color="#12446A" gutterBottom>
                  Creating Safe Spaces
                </Typography>
                <Typography variant="body1" color="#5C6B74" sx={{ lineHeight: 1.7 }}>
                  We foster open, non-judgemental community circles where everyone can speak about mental health freely. We break cultural stigma and build a culture of understanding, empathy, and early assistance.
                </Typography>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} color="#12446A" gutterBottom>
                  Spreading Awareness, Building Hope
                </Typography>
                <Typography variant="body1" color="#5C6B74" sx={{ lineHeight: 1.7 }}>
                  Through educational workshops and social drives, we enable families and institutions to spot signs of emotional distress early, connecting people with proper care before challenges turn acute.
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<VolunteerActivismIcon />}
                  href="https://pages.razorpay.com/freemindfoundation"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    bgcolor: '#12446A',
                    px: 3.5,
                    py: 1.2,
                    fontWeight: 600,
                    borderRadius: '8px',
                    '&:hover': { bgcolor: '#0A2B45' },
                  }}
                >
                  Donate Now
                </Button>
                <Button
                  variant="outlined"
                  component={Link}
                  href="/register/volunteer"
                  sx={{
                    borderColor: '#12446A',
                    color: '#12446A',
                    px: 3,
                    py: 1.2,
                    fontWeight: 600,
                    borderRadius: '8px',
                  }}
                >
                  Join as Volunteer
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Leadership & Trustees Section ── */}
      <Box id="leadership" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FFFFFF', borderBottom: '1px solid #E1E6EB' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Chip
              label="Trustees & Governance"
              size="small"
              sx={{
                bgcolor: 'rgba(18, 68, 106, 0.08)',
                color: '#12446A',
                fontWeight: 600,
                mb: 1.5,
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.85rem', md: '2.5rem' },
                fontWeight: 800,
                color: '#12446A',
                mb: 1.5,
              }}
            >
              Trustees & Leadership
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
              Dedicated governance steering Free Mind Foundation’s public advocacy and institutional accountability.
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {TRUSTEES.map((trustee, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    textAlign: 'center',
                    borderRadius: 3.5,
                    border: '1px solid #E1E6EB',
                    bgcolor: '#FAFBFD',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: '#FFFFFF',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(18, 68, 106, 0.08)',
                      borderColor: '#12446A',
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 72,
                      height: 72,
                      bgcolor: '#12446A',
                      color: '#FFFFFF',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      mx: 'auto',
                      mb: 2.5,
                      boxShadow: '0 4px 12px rgba(18, 68, 106, 0.2)',
                    }}
                  >
                    {trustee.initials}
                  </Avatar>
                  <Typography variant="h6" fontWeight={700} color="#12446A" gutterBottom>
                    {trustee.name}
                  </Typography>
                  <Chip
                    label={trustee.role}
                    size="small"
                    sx={{
                      mb: 2,
                      bgcolor: '#E7F0F7',
                      color: '#12446A',
                      fontWeight: 600,
                    }}
                  />
                  <Typography variant="body2" color="#5C6B74" sx={{ lineHeight: 1.6 }}>
                    {trustee.bio}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Management Portals Quick Access Section ── */}
      <Box id="portals" sx={{ py: { xs: 8, md: 10 }, bgcolor: '#FAFBFD' }}>
        <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 6 },
              borderRadius: 4,
              bgcolor: '#12446A',
              color: '#FFFFFF',
              background: 'linear-gradient(135deg, #12446A 0%, #0A2B45 100%)',
              boxShadow: '0 12px 36px rgba(18, 68, 106, 0.2)',
            }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={7}>
                <Typography variant="h4" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '1.6rem', md: '2rem' } }}>
                  FMF Management & Volunteer Portal
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.7, mb: 3 }}>
                  Trust members, administrators, and active volunteers can access their dedicated portals to manage donations, generate 80G tax receipts, log volunteer hours, and schedule community outreach events.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant="contained"
                    component={Link}
                    href="/auth/login"
                    startIcon={<AdminPanelSettingsIcon />}
                    sx={{
                      bgcolor: '#FFFFFF',
                      color: '#12446A',
                      fontWeight: 700,
                      px: 3,
                      py: 1.2,
                      borderRadius: '8px',
                      '&:hover': { bgcolor: '#F1F5F9' },
                    }}
                  >
                    Log In to Management
                  </Button>
                  <Button
                    variant="outlined"
                    component={Link}
                    href="/register/volunteer"
                    sx={{
                      borderColor: '#FFFFFF',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      px: 3,
                      py: 1.2,
                      borderRadius: '8px',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)', borderColor: '#FFFFFF' },
                    }}
                  >
                    Register New Volunteer
                  </Button>
                </Stack>
              </Grid>

              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(8px)',
                    p: 3,
                    borderRadius: 3,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, opacity: 0.95 }}>
                    80G Tax-Exempt Contributions
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85, mb: 2.5, fontSize: '0.85rem' }}>
                    All donations to Free Mind Foundation are tax-exempt under Section 80G of the Indian Income Tax Act. Instant official receipts are generated and delivered to your registered email.
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<VolunteerActivismIcon />}
                    endIcon={<OpenInNewIcon fontSize="small" />}
                    href="https://pages.razorpay.com/freemindfoundation"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      bgcolor: '#43A047',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      py: 1.2,
                      borderRadius: '8px',
                      '&:hover': { bgcolor: '#2E7D32' },
                    }}
                  >
                    Donate via Razorpay
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>

      {/* ── Modern Minimalist Footer ── */}
      <Box
        component="footer"
        sx={{
          bgcolor: '#0B1E2E',
          color: '#E1E6EB',
          pt: 8,
          pb: 4,
          borderTop: '1px solid #1E3A52',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={5} sx={{ mb: 6 }}>
            {/* Trust Identity */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" fontWeight={800} color="#FFFFFF" gutterBottom sx={{ letterSpacing: '0.02em' }}>
                FREE MIND FOUNDATION
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7, mb: 3 }}>
                A registered charitable trust dedicated to preventive mental health awareness, emotional resilience, and community empowerment across society.
              </Typography>
              <Chip
                label="PAN & 80G Registered Trust"
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                }}
              />
            </Grid>

            {/* Quick Links */}
            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle2" fontWeight={700} color="#FFFFFF" gutterBottom sx={{ mb: 2 }}>
                Programs
              </Typography>
              <Stack spacing={1.2}>
                <Typography component={Link} href="#pillars" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#FFFFFF' } }}>
                  Community Drives
                </Typography>
                <Typography component={Link} href="#pillars" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#FFFFFF' } }}>
                  Youth Outreach
                </Typography>
                <Typography component={Link} href="#lifecycle" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#FFFFFF' } }}>
                  Early Childhood
                </Typography>
                <Typography component={Link} href="#impact" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#FFFFFF' } }}>
                  Safe Spaces
                </Typography>
              </Stack>
            </Grid>

            {/* Portals & Forms */}
            <Grid item xs={6} sm={3} md={3}>
              <Typography variant="subtitle2" fontWeight={700} color="#FFFFFF" gutterBottom sx={{ mb: 2 }}>
                Portals & Register
              </Typography>
              <Stack spacing={1.2}>
                <Typography component={Link} href="/register/volunteer" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#FFFFFF' } }}>
                  Volunteer Registration
                </Typography>
                <Typography component={Link} href="/register/member" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#FFFFFF' } }}>
                  Member Registration
                </Typography>
                <Typography component={Link} href="/volunteer" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#FFFFFF' } }}>
                  Volunteer Portal
                </Typography>
                <Typography component={Link} href="/auth/login" variant="body2" sx={{ color: '#94A3B8', textDecoration: 'none', '&:hover': { color: '#FFFFFF' } }}>
                  Admin Sign In
                </Typography>
              </Stack>
            </Grid>

            {/* Contact Details */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" fontWeight={700} color="#FFFFFF" gutterBottom sx={{ mb: 2 }}>
                Contact Information
              </Typography>
              <Stack spacing={1.8}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <LocationOnIcon sx={{ fontSize: 18, color: '#38BDF8', mt: 0.3 }} />
                  <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                    Free Mind Foundation, Registered Trust Office, India
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <EmailIcon sx={{ fontSize: 18, color: '#38BDF8' }} />
                  <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                    contact@freemindfoundation.org.in
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <VolunteerActivismIcon sx={{ fontSize: 18, color: '#4ADE80' }} />
                  <Typography
                    component="a"
                    href="https://pages.razorpay.com/freemindfoundation"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="body2"
                    sx={{ color: '#38BDF8', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    Direct 80G Donation Link
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              © {new Date().getFullYear()} Free Mind Foundation. All rights reserved.
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Internal Management & Public Engagement System
            </Typography>
          </Box>
        </Container>
      </Box>

    </Box>
  )
}
