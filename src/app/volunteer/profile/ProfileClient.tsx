'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box, Typography, TextField, Button, Card, CardContent, CardHeader,
  Avatar, Grid, Chip, Alert, CircularProgress, Divider, Stack, Autocomplete,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import PersonIcon from '@mui/icons-material/Person'
import { DEFAULT_INDIAN_STATES } from '@/lib/constants'

type VolunteerProfile = any

export default function ProfileClient() {
  const { data: session } = useSession()
  const volunteerId = session?.user?.volunteerId

  const [profile, setProfile] = useState<VolunteerProfile | null>(null)
  const [statesList, setStatesList] = useState<string[]>(DEFAULT_INDIAN_STATES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', state: '', availability: '', motivation: '' })

  useEffect(() => {
    fetch('/api/public/form-options')
      .then(res => res.json())
      .then(data => {
        if (data?.states && Array.isArray(data.states) && data.states.length > 0) {
          setStatesList(data.states)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch(`/api/volunteers/${volunteerId || 'me'}`)
      .then(r => r.json())
      .then(d => {
        if (d && !d.error) {
          setProfile(d)
          setForm({
            name: d.name || '',
            phone: d.phone || '',
            address: d.address || '',
            city: d.city || '',
            state: d.state || '',
            availability: d.availability || '',
            motivation: d.motivation || '',
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [volunteerId])

  const handleSave = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/volunteers/${volunteerId || 'me'}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setMsg(res.ok ? { type: 'success', text: 'Profile updated.' } : { type: 'error', text: 'Update failed.' })
    } finally {
      setSaving(false)
    }
    setTimeout(() => setMsg(null), 4000)
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>My Profile</Typography>

      {/* Profile Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
              {profile?.name?.[0] || 'V'}
            </Avatar>
            <Box>
              <Typography variant="h6">{profile?.name}</Typography>
              <Typography variant="body2" color="text.secondary">{profile?.email}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                <Chip label={`Stage: ${profile?.currentStage || 'APPLICATION'}`} size="small" color={profile?.currentStage === 'APPROVED' ? 'success' : 'default'} />
                {profile?.availability && <Chip label={profile.availability} size="small" variant="outlined" />}
              </Stack>
            </Box>
          </Box>

          {profile?.skills && Array.isArray(profile.skills) && profile.skills.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Skills</Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {profile.skills.map((s: string) => <Chip key={s} label={s} size="small" variant="outlined" />)}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader title="Edit Profile" avatar={<PersonIcon color="primary" />} />
        <Divider />
        <CardContent>
          {msg && <Alert severity={msg.type} sx={{ mb: 2 }}>{msg.text}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField label="Full Name" fullWidth value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Phone" fullWidth value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="City" fullWidth value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={statesList}
                value={form.state || null}
                onChange={(_, newValue) => setForm({ ...form, state: newValue || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="State / UT"
                    placeholder="Select state"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}><TextField label="Address" fullWidth value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Availability" fullWidth value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Motivation" fullWidth multiline rows={3} value={form.motivation} onChange={e => setForm({ ...form, motivation: e.target.value })} /></Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
              {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
