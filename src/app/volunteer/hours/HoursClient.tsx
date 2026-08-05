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
    setLoading(true)
    try {
      const res = await fetch(`/api/volunteers/${volunteerId || 'me'}/hours`)
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [volunteerId])

  const totalHours = logs.reduce((sum: number, l: HoursLog) => sum + (l.hours || 0), 0)

  const handleSave = async () => {
    if (!formData.activity || !formData.hours) { setFormError('Activity and hours are required'); return }
    setSaving(true); setFormError('')
    try {
      const res = await fetch(`/api/volunteers/${volunteerId || 'me'}/hours`, {
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      ) : logs.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          <AccessTimeIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
          <Typography variant="body1">No hours logged yet.</Typography>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => { setFormData(emptyForm); setFormError(''); setDialogOpen(true) }}>
            Log Your First Contribution
          </Button>
        </Card>
      ) : (
        <Stack spacing={2}>
          {logs.map((log: HoursLog) => (
            <Card key={log.id}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 2 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>{log.activity}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(log.date)} {log.event?.name ? ` • Event: ${log.event.name}` : ''}
                  </Typography>
                  {log.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {log.notes}
                    </Typography>
                  )}
                </Box>
                <Chip
                  label={`${log.hours} hr${log.hours !== 1 ? 's' : ''}`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

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
                placeholder="e.g. Field distribution, workshop assistance, content writing..."
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
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Hours'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
