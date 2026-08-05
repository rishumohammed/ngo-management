'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box, Button, Typography, Chip, IconButton, Tooltip, Grid, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Stack, Card, CardContent, CardActions, Divider, LinearProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArticleIcon from '@mui/icons-material/Article'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import Link from 'next/link'
import { can } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  DRAFT: 'default',
  UNDER_REVIEW: 'warning',
  FINALIZED: 'success',
}

const MEETING_TYPES = ['BOARD', 'COMMITTEE', 'GENERAL_BODY', 'AD_HOC']
const STATUS_FLOW: Record<string, string> = { DRAFT: 'UNDER_REVIEW', UNDER_REVIEW: 'FINALIZED' }
const STATUS_LABELS: Record<string, string> = { DRAFT: 'Draft', UNDER_REVIEW: 'Under Review', FINALIZED: 'Finalized' }

const emptyForm = {
  meetingType: 'BOARD', title: '', date: new Date().toISOString().split('T')[0],
  location: '', onlineLink: '',
}


type Minute = any

export default function MinutesClient() {
  const { data: session } = useSession()
  const role = session?.user?.role || ''
  const canCreate = can(role, 'minutes', 'create')
  const canUpdate = can(role, 'minutes', 'update')

  const [minutes, setMinutes] = useState<Minute[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchMinutes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: statusFilter, meetingType: typeFilter })
      const res = await fetch(`/api/minutes?${params}`)
      const data = await res.json()
      setMinutes(data.minutes || [])
    } finally { setLoading(false) }
  }, [statusFilter, typeFilter])

  useEffect(() => { fetchMinutes() }, [fetchMinutes])

  const handleSave = async () => {
    if (!formData.title || !formData.date) { setFormError('Title and date are required'); return }
    setSaving(true); setFormError('')
    try {
      const res = await fetch('/api/minutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) { const e = await res.json(); setFormError(e.error || 'Failed'); return }
      setDialogOpen(false); fetchMinutes()
    } finally { setSaving(false) }
  }

  const advanceStatus = async (minute: Minute) => {
    const nextStatus = STATUS_FLOW[minute.status]
    if (!nextStatus) return
    await fetch('/api/minutes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: minute.id, status: nextStatus }),
    })
    fetchMinutes()
  }

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
            Meeting Minutes
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Record, review, and finalize proceedings, resolutions, and action items from board & committee meetings.
          </Typography>
        </Box>
        {canCreate && (
          <Button
            id="add-minutes-btn"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setFormData(emptyForm)
              setFormError('')
              setDialogOpen(true)
            }}
          >
            New Minutes
          </Button>
        )}
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="DRAFT">Draft</MenuItem>
            <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
            <MenuItem value="FINALIZED">Finalized</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Meeting Type</InputLabel>
          <Select label="Meeting Type" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <MenuItem value="">All Types</MenuItem>
            {MEETING_TYPES.map(t => <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2.5}>
        {minutes.map((minute: Minute) => (
          <Grid item xs={12} sm={6} lg={4} key={minute.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Chip label={minute.meetingType.replace('_', ' ')} size="small" variant="outlined" />
                  <Chip
                    label={STATUS_LABELS[minute.status]}
                    size="small"
                    color={STATUS_COLORS[minute.status]}
                  />
                </Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5, lineHeight: 1.3 }}>
                  {minute.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(minute.date)}{minute.location ? ` · ${minute.location}` : ''}
                </Typography>
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`${minute._count?.attendees || 0} attendees`} size="small" />
                  <Chip label={`${minute._count?.agendaItems || 0} agenda items`} size="small" />
                  {minute.actionItems?.length > 0 && (
                    <Chip label={`${minute.actionItems.length} open actions`} size="small" color="warning" />
                  )}
                </Box>
              </CardContent>
              <Divider />
              <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button size="small" component={Link} href={`/admin/minutes/${minute.id}`}>
                  View Details
                </Button>
                {canUpdate && minute.status !== 'FINALIZED' && (
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => advanceStatus(minute)}
                  >
                    {minute.status === 'DRAFT' ? 'Submit for Review' : 'Finalize'}
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
        {!loading && minutes.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              <ArticleIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
              <Typography>No meeting minutes found.</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Add Minutes Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Meeting Minutes</DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Meeting Title *" fullWidth value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Meeting Type</InputLabel>
                <Select label="Meeting Type" value={formData.meetingType} onChange={e => setFormData({ ...formData, meetingType: e.target.value })}>
                  {MEETING_TYPES.map(t => <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Date *" type="date" fullWidth value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Location / Venue" fullWidth value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Online Meeting Link" fullWidth value={formData.onlineLink} onChange={e => setFormData({ ...formData, onlineLink: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button id="save-minutes-btn" variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Create Draft'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
