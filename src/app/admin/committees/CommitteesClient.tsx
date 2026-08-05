'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box, Button, Typography, Chip, Grid, Alert, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Card, CardContent, CardHeader, Divider, AvatarGroup,
  Avatar, Tooltip, LinearProgress, Switch, FormControlLabel, Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import GroupWorkIcon from '@mui/icons-material/GroupWork'
import PeopleIcon from '@mui/icons-material/People'
import Link from 'next/link'
import { can } from '@/lib/permissions'
import { isTermExpiringSoon, isTermExpired } from '@/lib/utils'


type Committee = any

const emptyForm = { name: '', type: 'COMMITTEE', purpose: '' }

export default function CommitteesClient() {
  const { data: session } = useSession()
  const role = session?.user?.role || ''
  const canCreate = can(role, 'committees', 'create')

  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchCommittees = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/committees?includeArchived=${showArchived}`)
      const data = await res.json()
      setCommittees(data || [])
    } finally { setLoading(false) }
  }, [showArchived])

  useEffect(() => { fetchCommittees() }, [fetchCommittees])

  const handleSave = async () => {
    if (!formData.name) { setFormError('Name is required'); return }
    setSaving(true); setFormError('')
    try {
      const res = await fetch('/api/committees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) { const e = await res.json(); setFormError(e.error || 'Failed'); return }
      setDialogOpen(false); fetchCommittees()
    } finally { setSaving(false) }
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
            Committees & Governance
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Manage organizational committees, board structure, member roles, and active tenures.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControlLabel
            control={<Switch checked={showArchived} onChange={e => setShowArchived(e.target.checked)} size="small" />}
            label={<Typography variant="body2">Show Archived</Typography>}
          />
          {canCreate && (
            <Button
              id="add-committee-btn"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setFormData(emptyForm)
                setFormError('')
                setDialogOpen(true)
              }}
            >
              Create Committee
            </Button>
          )}
        </Stack>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2.5}>
        {committees.map((c: Committee) => {
          const expiringMembers = c.members?.filter((m: { termEnd: string | null }) => isTermExpiringSoon(m.termEnd ? new Date(m.termEnd) : null))
          const expiredMembers = c.members?.filter((m: { termEnd: string | null }) => isTermExpired(m.termEnd ? new Date(m.termEnd) : null))

          return (
            <Grid item xs={12} sm={6} lg={4} key={c.id}>
              <Card sx={{ height: '100%', opacity: c.isArchived ? 0.6 : 1 }}>
                <CardHeader
                  avatar={<Avatar sx={{ bgcolor: c.type === 'DEPARTMENT' ? 'secondary.main' : 'primary.main' }}><GroupWorkIcon /></Avatar>}
                  title={c.name}
                  subheader={
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                      <Chip label={c.type} size="small" variant="outlined" />
                      {c.isArchived && <Chip label="Archived" size="small" />}
                    </Box>
                  }
                />
                <CardContent sx={{ pt: 0 }}>
                  {c.purpose && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {c.purpose}
                    </Typography>
                  )}
                  <Divider sx={{ mb: 1.5 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">{c.members?.length || 0} members</Typography>
                    {expiringMembers?.length > 0 && (
                      <Chip label={`${expiringMembers.length} expiring soon`} size="small" color="warning" />
                    )}
                    {expiredMembers?.length > 0 && (
                      <Chip label={`${expiredMembers.length} expired`} size="small" color="error" />
                    )}
                  </Box>
                  <AvatarGroup max={6} sx={{ justifyContent: 'flex-start' }}>
                    {c.members?.slice(0, 6).map((m: { id: string; member?: { name: string }; volunteer?: { name: string }; designation?: string }) => {
                      const name = m.member?.name || m.volunteer?.name || ''
                      return (
                        <Tooltip key={m.id} title={`${name}${m.designation ? ` — ${m.designation}` : ''}`}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.light' }}>
                            {name.charAt(0)}
                          </Avatar>
                        </Tooltip>
                      )
                    })}
                  </AvatarGroup>
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                    <Chip label={`${c._count?.meetings || 0} meetings`} size="small" />
                    <Chip label={`${c._count?.events || 0} events`} size="small" />
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button size="small" component={Link} href={`/admin/committees/${c.id}`}>
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
        {!loading && committees.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              <GroupWorkIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
              <Typography>No committees found. Create one to get started.</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Create Committee Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create Committee / Department</DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                <MenuItem value="COMMITTEE">Committee</MenuItem>
                <MenuItem value="DEPARTMENT">Department</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Name *" fullWidth value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <TextField label="Purpose / Description" fullWidth multiline rows={3} value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button id="save-committee-btn" variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
