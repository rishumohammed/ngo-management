'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box, Button, Typography, Chip, Grid, Alert, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Card, CardContent, CardHeader, Divider, Avatar, CardActionArea,
  LinearProgress, Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import GroupWorkIcon from '@mui/icons-material/GroupWork'
import PeopleIcon from '@mui/icons-material/People'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import SecurityIcon from '@mui/icons-material/Security'
import CategoryIcon from '@mui/icons-material/Category'
import MapIcon from '@mui/icons-material/Map'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { can } from '@/lib/permissions'

type Committee = any
const emptyForm = { name: '', type: 'GOVERNING_BOARD', purpose: '' }

export default function CommitteesClient() {
  const router = useRouter()
  const { data: session } = useSession()
  const role = session?.user?.role || ''
  const canCreate = can(role, 'committees', 'create')

  const [committees, setCommittees] = useState<Committee[]>([])
  const [districtsMap, setDistrictsMap] = useState<Record<string, string[]>>({})
  const [statesList, setStatesList] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resC, resOpt] = await Promise.all([
        fetch(`/api/committees?includeArchived=false`),
        fetch(`/api/public/form-options`)
      ])
      const dataC = await resC.json()
      const dataOpt = await resOpt.json()
      setCommittees(dataC || [])
      setDistrictsMap(dataOpt.districts || {})
      setStatesList(dataOpt.states || [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async () => {
    let finalName = formData.name
    if (formData.type === 'GOVERNING_BOARD') finalName = 'Governing Board'
    if (formData.type === 'EXECUTIVE_TEAM') finalName = 'Executive Team'
    
    if (!finalName) { setFormError('Name is required'); return }
    setSaving(true); setFormError('')
    try {
      const res = await fetch('/api/committees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, name: finalName }),
      })
      if (!res.ok) { const e = await res.json(); setFormError(e.error || 'Failed'); return }
      
      const newCommittee = await res.json()
      setDialogOpen(false)
      // Redirect to the newly created committee
      router.push(`/admin/committees/${newCommittee.id}`)
    } finally { setSaving(false) }
  }

  const governingBoard = committees.find(c => c.type === 'GOVERNING_BOARD')
  const executiveTeam = committees.find(c => c.type === 'EXECUTIVE_TEAM')
  const departments = committees.filter(c => c.type === 'DEPARTMENT')

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: -0.5 }}>
          Organization Structure
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Top-down view of central leadership, departments, and regional networks.
        </Typography>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.dark' }}>
        Central Governance
      </Typography>
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {/* Governing Board */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardActionArea 
              sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}
              onClick={() => {
                if (governingBoard) {
                  router.push(`/admin/committees/${governingBoard.id}`)
                } else if (canCreate) {
                  setFormData({ ...emptyForm, type: 'GOVERNING_BOARD' })
                  setDialogOpen(true)
                }
              }}
            >
              <Avatar sx={{ bgcolor: 'primary.main', mb: 2, width: 56, height: 56 }}>
                <AccountBalanceIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" fontWeight={600}>Governing Board</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                The highest decision-making body of the organization.
              </Typography>
              <Box flexGrow={1} />
              {governingBoard ? (
                <Chip icon={<PeopleIcon />} label={`${governingBoard.members?.length || 0} Members`} size="small" color="primary" variant="outlined" />
              ) : (
                <Chip icon={<AddIcon />} label="Create Now" size="small" color="warning" />
              )}
            </CardActionArea>
          </Card>
        </Grid>

        {/* Executive Team */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardActionArea 
              sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}
              onClick={() => {
                if (executiveTeam) {
                  router.push(`/admin/committees/${executiveTeam.id}`)
                } else if (canCreate) {
                  setFormData({ ...emptyForm, type: 'EXECUTIVE_TEAM' })
                  setDialogOpen(true)
                }
              }}
            >
              <Avatar sx={{ bgcolor: 'secondary.main', mb: 2, width: 56, height: 56 }}>
                <SecurityIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" fontWeight={600}>Executive Team</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                The core leadership team managing daily operations.
              </Typography>
              <Box flexGrow={1} />
              {executiveTeam ? (
                <Chip icon={<PeopleIcon />} label={`${executiveTeam.members?.length || 0} Members`} size="small" color="secondary" variant="outlined" />
              ) : (
                <Chip icon={<AddIcon />} label="Create Now" size="small" color="warning" />
              )}
            </CardActionArea>
          </Card>
        </Grid>

        {/* Departments */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardActionArea 
              sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}
              onClick={() => router.push(`/admin/committees/departments`)}
            >
              <Avatar sx={{ bgcolor: 'info.main', mb: 2, width: 56, height: 56 }}>
                <CategoryIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" fontWeight={600}>Departments</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                Specialized wings and functional departments.
              </Typography>
              <Box flexGrow={1} />
              <Chip icon={<GroupWorkIcon />} label={`${departments.length} Active`} size="small" color="info" variant="outlined" />
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.dark' }}>
        Regional Network (States)
      </Typography>
      {statesList.length === 0 && !loading && (
        <Alert severity="info">No states have been configured yet. Configure districts in Settings to enable the regional network.</Alert>
      )}
      <Grid container spacing={3}>
        {statesList.map(state => (
          <Grid item xs={12} sm={6} md={4} key={state}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea 
                sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                onClick={() => router.push(`/admin/network/${encodeURIComponent(state)}`)}
              >
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <MapIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>{state}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {districtsMap[state]?.length || 0} Districts
                    </Typography>
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Modal for Missing Core Committees */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Create {formData.type === 'GOVERNING_BOARD' ? 'Governing Board' : 'Executive Team'}
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              This will initialize the central {formData.type === 'GOVERNING_BOARD' ? 'board' : 'team'}. You can assign members on the next page.
            </Typography>
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
