'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box, Button, Typography, Chip, Grid, Alert, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Card, CardContent, CardHeader, Avatar, LinearProgress,
  Stack, ToggleButtonGroup, ToggleButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EventIcon from '@mui/icons-material/Event'
import ListIcon from '@mui/icons-material/List'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import Link from 'next/link'
import { can } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import dayjs from 'dayjs'

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  PLANNED: 'primary',
  ONGOING: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'error',
}
const EVENT_TYPES = ['WORKSHOP', 'SEMINAR', 'OUTREACH', 'FUNDRAISER', 'TRAINING', 'MEETING', 'OTHER']


type Event = any

const emptyForm = {
  name: '', type: 'OTHER', description: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '', location: '', onlineLink: '', status: 'PLANNED',
}

export default function EventsClient() {
  const { data: session } = useSession()
  const role = session?.user?.role || ''
  const canCreate = can(role, 'events', 'create')

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: statusFilter, pageSize: '100' })
      const res = await fetch(`/api/events?${params}`)
      const data = await res.json()
      setEvents(data.events || [])
    } finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const handleSave = async () => {
    if (!formData.name || !formData.startDate) { setFormError('Name and start date are required'); return }
    setSaving(true); setFormError('')
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) { const e = await res.json(); setFormError(e.error || 'Failed'); return }
      setDialogOpen(false); fetchEvents()
    } finally { setSaving(false) }
  }

  // Group events by month for calendar-like view
  const grouped = events.reduce((acc: Record<string, Event[]>, ev: Event) => {
    const key = dayjs(ev.startDate).format('MMMM YYYY')
    if (!acc[key]) acc[key] = []
    acc[key].push(ev)
    return acc
  }, {})

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: -0.5 }}>
            Events & Activities
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Plan, organize, and monitor NGO outreach events, workshops, and volunteer assignments.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => { if (v) setViewMode(v) }}
            size="small"
          >
            <ToggleButton value="list"><ListIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="calendar"><CalendarMonthIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
          {canCreate && (
            <Button
              id="add-event-btn"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setFormData(emptyForm)
                setFormError('')
                setDialogOpen(true)
              }}
            >
              Add Event
            </Button>
          )}
        </Stack>
      </Box>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
        {['', 'PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED'].map(s => (
          <Chip
            key={s}
            label={s || 'All'}
            onClick={() => setStatusFilter(s)}
            color={statusFilter === s ? 'primary' : 'default'}
            variant={statusFilter === s ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {viewMode === 'list' && (
        <Grid container spacing={2}>
          {events.map((event: Event) => (
            <Grid item xs={12} sm={6} lg={4} key={event.id}>
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><EventIcon /></Avatar>}
                  title={event.name}
                  subheader={formatDate(event.startDate) + (event.location ? ` · ${event.location}` : '')}
                  action={<Chip label={event.status} size="small" color={STATUS_COLORS[event.status]} />}
                />
                <CardContent sx={{ pt: 0 }}>
                  {event.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {event.description.slice(0, 100)}{event.description.length > 100 ? '...' : ''}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                    <Chip label={event.type} size="small" variant="outlined" />
                    {event.committee && <Chip label={event.committee.name} size="small" />}
                    <Chip label={`${event.assignments?.length || 0} volunteers`} size="small" />
                  </Stack>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button size="small" component={Link} href={`/admin/events/${event.id}`}>
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {viewMode === 'calendar' && (
        <Box>
          {Object.entries(grouped).map(([month, evts]) => (
            <Box key={month} sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5, color: 'primary.dark' }}>
                {month}
              </Typography>
              <Stack spacing={1}>
                {(evts as Event[]).map((ev: Event) => (
                  <Box
                    key={ev.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1.5,
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderLeft: '4px solid',
                      borderLeftColor: `${ev.status === 'COMPLETED' ? 'success.main' : ev.status === 'CANCELLED' ? 'error.main' : 'primary.main'}`,
                    }}
                  >
                    <Box sx={{ minWidth: 60, textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight={700} color="primary.main">
                        {dayjs(ev.startDate).format('D')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(ev.startDate).format('ddd')}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" fontWeight={600}>{ev.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ev.location || ev.onlineLink || ev.type}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      <Chip label={ev.status} size="small" color={STATUS_COLORS[ev.status]} />
                      <Button size="small" component={Link} href={`/admin/events/${ev.id}`}>
                        View Details
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          ))}
        </Box>
      )}

      {!loading && events.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <EventIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
          <Typography>No events found. Add one to get started.</Typography>
        </Box>
      )}

      {/* Add Event Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Event</DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField label="Event Name *" fullWidth value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select label="Type" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  {EVENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  <MenuItem value="PLANNED">Planned</MenuItem>
                  <MenuItem value="ONGOING">Ongoing</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField label="Start Date *" type="date" fullWidth value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}><TextField label="End Date" type="date" fullWidth value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField label="Location" fullWidth value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Online Meeting Link" fullWidth value={formData.onlineLink} onChange={e => setFormData({ ...formData, onlineLink: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Description" fullWidth multiline rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button id="save-event-btn" variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Add Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
