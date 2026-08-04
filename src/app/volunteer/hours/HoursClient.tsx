'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box, Button, Typography, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Card, CardContent, Alert, CircularProgress, Grid, Stack, Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { formatDate } from '@/lib/utils'


type HoursLog = any

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  activity: '',
  hours: '',
  notes: '',
}

export default function HoursClient() {
  const { data: session } = useSession()
  const volunteerId = session?.user?.volunteerId

  const [logs, setLogs] = useState<HoursLog[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchLogs = async () => {
    if (!volunteerId) return
    setLoading(true)
    const res = await fetch(`/api/volunteers/${volunteerId}/hours`)
    const data = await res.json()
    setLogs(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [volunteerId])

  const totalHours = logs.reduce((sum: number, l: HoursLog) => sum + (l.hours || 0), 0)

  const handleSave = async () => {
    if (!formData.activity || !formData.hours) { setFormError('Activity and hours are required'); return }
    setSaving(true); setFormError('')
    try {
      const res = await fetch(`/api/volunteers/${volunteerId}/hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, hours: parseFloat(formData.hours) }),
      })
      if (!res.ok) { const e = await res.json(); setFormError(e.error || 'Failed'); return }
      setDialogOpen(false); fetchLogs()
    } finally { setSaving(false) }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Hours Log</Typography>
          <Typography variant="body2" color="text.secondary">
            {totalHours} total hours contributed
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setFormData(emptyForm); setFormError(''); setDialogOpen(true) }}>
          Log Hours
        </Button>
      </Box>

      {/* Summary Card */}
      <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccessTimeIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            <Box>
              <Typography variant="h3" fontWeight={700}>{totalHours.toFixed(1)}</Typography>
              <Typography variant="body1" sx={{ opacity: 0.85 }}>Total Hours Volunteered</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Stack spacing={1.5}>
        {logs.map((log: HoursLog) => (
          <Card key={log.id}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body1" fontWeight={600}>{log.activity}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(log.date)}{log.event ? ` · ${log.event.name}` : ''}
                  </Typography>
                  {log.notes && <Typography variant="caption" color="text.secondary" display="block">{log.notes}</Typography>}
                </Box>
                <Chip label={`${log.hours}h`} color="primary" />
              </Box>
            </CardContent>
          </Card>
        ))}
        {!loading && logs.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <AccessTimeIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
            <Typography>No hours logged yet. Start contributing!</Typography>
          </Box>
        )}
      </Stack>

      {/* Log Hours Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Log Volunteer Hours</DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField label="Date" type="date" fullWidth value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField label="Activity *" fullWidth value={formData.activity} onChange={e => setFormData({ ...formData, activity: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Hours *" type="number" fullWidth value={formData.hours} onChange={e => setFormData({ ...formData, hours: e.target.value })} inputProps={{ min: 0.5, step: 0.5 }} /></Grid>
            <Grid item xs={12}><TextField label="Notes" fullWidth multiline rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
