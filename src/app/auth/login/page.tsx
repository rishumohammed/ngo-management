'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  IconButton,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import FavoriteIcon from '@mui/icons-material/Favorite'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')

  const [portal, setPortal] = useState<'admin' | 'volunteer'>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const trimmedEmail = email.trim()
    const providerId = portal === 'admin' ? 'admin-credentials' : 'volunteer-credentials'
    let targetCallback = callbackUrl || (portal === 'admin' ? '/admin/dashboard' : '/volunteer/dashboard')
    if (targetCallback === '/admin' || targetCallback === '/admin/') {
      targetCallback = '/admin/dashboard'
    } else if (targetCallback === '/volunteer' || targetCallback === '/volunteer/') {
      targetCallback = '/volunteer/dashboard'
    }

    const result = await signIn(providerId, {
      email: trimmedEmail,
      password,
      redirect: false,
      callbackUrl: targetCallback,
    })

    setLoading(false)

    if (result?.error) {
      setError('Invalid email or password. Please verify your credentials or contact an administrator.')
    } else {
      // Check session to confirm appropriate portal destination
      try {
        const res = await fetch('/api/auth/session')
        const sess = await res.json()
        if (sess?.user?.isVolunteer || sess?.user?.role === 'VOLUNTEER') {
          router.push('/volunteer/dashboard')
        } else if (sess?.user?.role) {
          router.push('/admin/dashboard')
        } else {
          router.push(targetCallback)
        }
      } catch {
        router.push(targetCallback)
      }
      router.refresh()
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #00897B 0%, #004D40 40%, #1B5E20 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        {/* Logo / Brand */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              mb: 2,
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          >
            <FavoriteIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
            Free Mind Foundation
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
            Trust Management System
          </Typography>
        </Box>

        {/* Login Card */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, color: 'text.primary', fontWeight: 600 }}>
              Sign In
            </Typography>

            {/* Portal Toggle */}
            <ToggleButtonGroup
              value={portal}
              exclusive
              onChange={(_, val) => { if (val) { setPortal(val); setError('') } }}
              fullWidth
              sx={{ mb: 3 }}
              size="small"
            >
              <ToggleButton value="admin" sx={{ textTransform: 'none', gap: 1 }}>
                <AdminPanelSettingsIcon fontSize="small" />
                Admin Portal
              </ToggleButton>
              <ToggleButton value="volunteer" sx={{ textTransform: 'none', gap: 1 }}>
                <VolunteerActivismIcon fontSize="small" />
                Volunteer Portal
              </ToggleButton>
            </ToggleButtonGroup>

            <Divider sx={{ mb: 3 }} />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                id="login-email"
                label="Email address"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                id="login-password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                sx={{ mb: 3 }}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                id="login-submit"
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ py: 1.25, fontWeight: 600 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Typography
          variant="caption"
          sx={{ display: 'block', textAlign: 'center', mt: 2, color: 'rgba(255,255,255,0.6)' }}
        >
          Internal use only — authorized personnel only
        </Typography>
      </Box>
    </Box>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>}>
      <LoginContent />
    </Suspense>
  )
}
