'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Box, Button, Card, CardContent, TextField, Typography, Alert,
  CircularProgress, InputAdornment, IconButton,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import FavoriteIcon from '@mui/icons-material/Favorite'

function SetupPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) { setError('Invalid or missing invite token.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/auth/login'), 2000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to set password.')
      }
    } finally { setLoading(false) }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0F3354',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', mb: 2, border: '2px solid rgba(255,255,255,0.3)' }}>
            <FavoriteIcon sx={{ fontSize: 28, color: 'white' }} />
          </Box>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>Free Mind Foundation</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>Set up your volunteer account</Typography>
        </Box>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {success ? (
              <Alert severity="success">Password set! Redirecting to login...</Alert>
            ) : (
              <>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Create Password</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <form onSubmit={handleSubmit}>
                  <TextField
                    label="New Password"
                    type={showPw ? 'text' : 'password'}
                    fullWidth
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPw(!showPw)} size="small">
                            {showPw ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText="At least 8 characters"
                  />
                  <TextField
                    label="Confirm Password"
                    type="password"
                    fullWidth
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    sx={{ mb: 3 }}
                  />
                  <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Set Password & Activate Account'}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>}>
      <SetupPasswordContent />
    </Suspense>
  )
}
