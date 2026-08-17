'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box, Button, Typography, Chip, Grid, Alert, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Card, CardContent, CardHeader, Divider, AvatarGroup,
  Avatar, Tooltip, LinearProgress, Switch, FormControlLabel, Stack, IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import GroupWorkIcon from '@mui/icons-material/GroupWork'
import PeopleIcon from '@mui/icons-material/People'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CategoryIcon from '@mui/icons-material/Category'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { can } from '@/lib/permissions'
import { isTermExpiringSoon, isTermExpired } from '@/lib/utils'

type Committee = any
const emptyForm = { name: '', type: 'DEPARTMENT', purpose: '' }

export default function DepartmentsClient() {
  const router = useRouter()
  const { data: session } = useSession()
  const role = session?.user?.role || ''
  const canCreate = can(role, 'committees', 'create')

  const [departments, setDepartments] = useState<Committee[]>([])
  const [loading, setLoading] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchDepartments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/committees?includeArchived=${showArchived}`)
      const data = await res.json()
      
      const filteredData = (data || []).filter((c: any) => c.type === 'DEPARTMENT')
      setDepartments(filteredData)
    } finally { setLoading(false) }
  }, [showArchived])

  useEffect(() => { fetchDepartments() }, [fetchDepartments])

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
      setDialogOpen(false); fetchDepartments()
    } finally { setSaving(false) }
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => router.push('/admin/committees')}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: -0.5 }}>
            Departments
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Specialized wings and functional departments.
          </Typography>
        </Box>
        <Box flexGrow={1} />
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControlLabel
            control={<Switch checked={showArchived} onChange={e => setShowArchived(e.target.checked)} size="small" />}
            label={<Typography variant="body2">Show Archived</Typography>}
          />
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setFormData(emptyForm)
                setFormError('')
                setDialogOpen(true)
              }}
            >
              Add Department
            </Button>
          )}
        </Stack>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2.5}>
        {departments.map((c: Committee) => {
          const expiringMembers = c.members?.filter((m: { termEnd: string | null }) => isTermExpiringSoon(m.termEnd ? new Date(m.termEnd) : null))
          const expiredMembers = c.members?.filter((m: { termEnd: string | null }) => isTermExpired(m.termEnd ? new Date(m.termEnd) : null))

          return (
            <Grid item xs={12} sm={6} lg={4} key={c.id}>
              <Card sx={{ height: '100%', opacity: c.isArchived ? 0.6 : 1 }}>
                <CardHeader
                  avatar={<Avatar sx={{ bgcolor: 'info.main' }}><CategoryIcon /></Avatar>}
                  title={c.name}
                  subheader={
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                      <Chip label="Department" size="small" variant="outlined" color="info" />
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
                      <Chip label={`${expiringMembers.length} expiring`} size="small" color="warning" />
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
        {!loading && departments.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
              <CategoryIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
              <Typography>No departments found. Create one to get started.</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Create Department Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Department</DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Name *" fullWidth value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <TextField label="Purpose / Description" fullWidth multiline rows={3} value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
