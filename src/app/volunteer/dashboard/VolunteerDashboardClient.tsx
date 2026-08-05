'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Grid, Card, CardContent, CardHeader, Button, Chip,
  Avatar, CircularProgress, Stack, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert,
} from '@mui/material'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import EventIcon from '@mui/icons-material/Event'
import PersonIcon from '@mui/icons-material/Person'
import AddIcon from '@mui/icons-material/Add'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import { formatDate } from '@/lib/utils'

export default function VolunteerDashboardClient() {
  const { data: session } = useSession()
  const router = useRouter()
  const volunteerId = session?.user?.volunteerId

  const [profile, setProfile] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [hoursLogs, setHoursLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Log Hours Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    activity: '',
    hours: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [profRes, eventsRes, hoursRes] = await Promise.all([
        fetch(`/api/volunteers/${volunteerId || 'me'}`).then(r => r.json()).catch(() => null),
        fetch('/api/events?pageSize=10').then(r => r.json()).catch(() => ({ events: [] })),
        fetch(`/api/volunteers/${volunteerId || 'me'}/hours`).then(r => r.json()).catch(() => []),
      ])

      if (profRes && !profRes.error) {
        setProfile(profRes)
      }
      setEvents(Array.isArray(eventsRes?.events) ? eventsRes.events : [])
      setHoursLogs(Array.isArray(hoursRes) ? hoursRes : [])
    } finally {
      setLoading(false)
    }
  }, [volunteerId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalHours = hoursLogs.reduce((sum, item) => sum + (Number(item.hours) || 0), 0)
  const upcomingEvents = events.filter(e => e.status === 'PLANNED' || e.status === 'ONGOING' || new Date(e.startDate) >= new Date())

  const handleSaveHours = async () => {
    if (!formData.activity || !formData.hours) {
      setFormError('Activity description and hours are required')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const res = await fetch(`/api/volunteers/${volunteerId || 'me'}/hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, hours: parseFloat(formData.hours) }),
      })
      if (!res.ok) {
        const e = await res.json()
        setFormError(e.error || 'Failed to save hours')
        return
      }
      setDialogOpen(false)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        activity: '',
        hours: '',
        notes: '',
      })
      setSuccessMsg('Hours logged successfully!')
      setTimeout(() => setSuccessMsg(''), 4000)
      loadData()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  const volunteerName = profile?.name || session?.user?.name || 'Volunteer'
  const isApproved = profile?.currentStage === 'APPROVED'

  return (
    <Box sx={{ pb: 6 }}>
      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      {/* Welcome Banner */}
      <Card
        sx={{
          mb: 4,
          p: { xs: 2.5, md: 3.5 },
          bgcolor: '#12446A',
          color: 'white',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(18, 68, 106, 0.15)',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
              <Avatar
                sx={{
                  width: { xs: 52, md: 64 },
                  height: { xs: 52, md: 64 },
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', md: '1.6rem' },
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                }}
              >
                {volunteerName.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ color: 'white', letterSpacing: -0.5 }}>
                  Welcome back, {volunteerName}!
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mt: 0.25 }}>
                  {session?.user?.email}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.95)', maxWidth: 640 }}>
              Thank you for dedicating your time and energy to empowering communities with Free Mind Foundation.
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" gap={1}>
              <Chip
                icon={<CheckCircleOutlineIcon style={{ color: 'white' }} />}
                label={`Stage: ${profile?.currentStage || 'APPROVED'}`}
                sx={{
                  bgcolor: isApproved ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 600,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              />
              {profile?.city && (
                <Chip
                  icon={<LocationOnIcon style={{ color: 'white' }} />}
                  label={`${profile.city}${profile?.state ? `, ${profile.state}` : ''}`}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                  }}
                />
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              sx={{
                bgcolor: 'white',
                color: 'primary.dark',
                fontWeight: 700,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                px: 2.5,
                py: 1,
              }}
            >
              Log Hours
            </Button>
            <Button
              variant="outlined"
              startIcon={<EventIcon />}
              onClick={() => router.push('/volunteer/events')}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.7)',
                color: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255, 255, 255, 0.1)' },
                px: 2,
                py: 1,
              }}
            >
              View Events
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Metrics Row */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48, color: 'primary.dark' }}>
                <AccessTimeIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700} color="primary.dark">
                  {totalHours} <Typography component="span" variant="body2" color="text.secondary">hrs</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Hours Contributed
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.light', width: 48, height: 48, color: 'secondary.dark' }}>
                <EventIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {upcomingEvents.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upcoming / Assigned Events
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#e8f5e9', width: 48, height: 48, color: '#2e7d32' }}>
                <VolunteerActivismIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {hoursLogs.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed Activities
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#e0f2f1', width: 48, height: 48, color: '#00695c' }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem', textTransform: 'capitalize' }}>
                  {profile?.currentStage ? profile.currentStage.replace(/_/g, ' ') : 'Active'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Volunteer Status
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column: Upcoming Events & Recent Hours */}
        <Grid item xs={12} lg={8}>
          {/* Upcoming Events Card */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardHeader
              title="My Assigned & Upcoming Events"
              titleTypographyProps={{ variant: 'h6', fontWeight: 700 }}
              action={
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push('/volunteer/events')}
                >
                  View All
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 2.5 }}>
              {upcomingEvents.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <EventIcon sx={{ fontSize: 44, opacity: 0.3, mb: 1 }} />
                  <Typography variant="body2">No upcoming event assignments found.</Typography>
                  <Button
                    size="small"
                    variant="text"
                    sx={{ mt: 1 }}
                    onClick={() => router.push('/volunteer/events')}
                  >
                    Check Events Page
                  </Button>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {upcomingEvents.slice(0, 3).map((event) => (
                    <Box
                      key={event.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: 1.5,
                        transition: 'border-color 0.2s',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {event.name}
                          </Typography>
                          <Chip label={event.type} size="small" variant="outlined" />
                        </Box>
                        <Stack direction="row" spacing={2} sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarTodayIcon sx={{ fontSize: 14 }} />
                            <span>{formatDate(event.startDate)}</span>
                          </Box>
                          {event.location && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOnIcon sx={{ fontSize: 14 }} />
                              <span>{event.location}</span>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                      <Chip
                        label={event.status}
                        size="small"
                        color={event.status === 'PLANNED' ? 'info' : event.status === 'ONGOING' ? 'success' : 'default'}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Recent Hours Log Card */}
          <Card sx={{ borderRadius: 2 }}>
            <CardHeader
              title="Recent Volunteer Hours"
              titleTypographyProps={{ variant: 'h6', fontWeight: 700 }}
              action={
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push('/volunteer/hours')}
                >
                  View All Logs
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 2.5 }}>
              {hoursLogs.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <AccessTimeIcon sx={{ fontSize: 44, opacity: 0.3, mb: 1 }} />
                  <Typography variant="body2">No volunteer hours logged yet.</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    sx={{ mt: 1.5 }}
                    onClick={() => setDialogOpen(true)}
                  >
                    Log Hours Now
                  </Button>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {hoursLogs.slice(0, 4).map((log) => (
                    <Box
                      key={log.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: 'action.hover',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {log.activity}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(log.date)} {log.event?.name ? `• ${log.event.name}` : ''}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${log.hours} hr${log.hours !== 1 ? 's' : ''}`}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Profile Summary & Quick Info */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardHeader
              title="My Volunteer Profile"
              titleTypographyProps={{ variant: 'h6', fontWeight: 700 }}
              action={
                <Button
                  size="small"
                  onClick={() => router.push('/volunteer/profile')}
                >
                  Edit
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontWeight: 700 }}>
                  {volunteerName.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {volunteerName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {profile?.email || session?.user?.email}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Stack spacing={1.25}>
                {profile?.phone && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Phone:</Typography>
                    <Typography variant="body2" fontWeight={500}>{profile.phone}</Typography>
                  </Box>
                )}
                {profile?.city && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Location:</Typography>
                    <Typography variant="body2" fontWeight={500}>{profile.city}{profile.state ? `, ${profile.state}` : ''}</Typography>
                  </Box>
                )}
                {profile?.availability && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Availability:</Typography>
                    <Typography variant="body2" fontWeight={500}>{profile.availability}</Typography>
                  </Box>
                )}
              </Stack>

              {profile?.skills && Array.isArray(profile.skills) && profile.skills.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                    Skills & Areas
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {profile.skills.map((skill: string) => (
                      <Chip key={skill} label={skill} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Foundation Info Card */}
          <Card sx={{ borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} color="#166534" sx={{ mb: 1 }}>
                FMF Volunteer Community
              </Typography>
              <Typography variant="body2" color="#14532d" sx={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                Need assistance with your assignments or have feedback? Reach out directly to the volunteer coordinator or visit our events section for new initiative briefings.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  mt: 2,
                  color: '#166534',
                  borderColor: '#86efac',
                  '&:hover': { borderColor: '#166534', bgcolor: '#dcfce7' },
                }}
                onClick={() => router.push('/volunteer/profile')}
              >
                Manage Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Log Hours Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Volunteer Hours</DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date *"
                type="date"
                fullWidth
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Hours Contributed *"
                type="number"
                inputProps={{ step: '0.5', min: '0.5', max: '24' }}
                fullWidth
                value={formData.hours}
                onChange={e => setFormData({ ...formData, hours: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Activity / Task Description *"
                fullWidth
                placeholder="e.g. Community outreach, workshop assistance, food distribution..."
                value={formData.activity}
                onChange={e => setFormData({ ...formData, activity: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes / Reflection (Optional)"
                fullWidth
                multiline
                rows={2}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveHours} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Hours'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
