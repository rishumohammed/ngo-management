'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Grid, Card, CardActionArea, Avatar, LinearProgress, IconButton, Dialog, DialogTitle, DialogContent, Alert, TextField, DialogActions, Button, CircularProgress, Chip
} from '@mui/material'
import MapIcon from '@mui/icons-material/Map'
import LocationCityIcon from '@mui/icons-material/LocationCity'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import GroupWorkIcon from '@mui/icons-material/GroupWork'
import PeopleIcon from '@mui/icons-material/People'
import { useRouter } from 'next/navigation'

const emptyForm = { name: '', type: 'GENERAL_GOVERNANCE', purpose: '' }

export default function StateNetworkClient({ state }: { state: string }) {
  const router = useRouter()
  const [districts, setDistricts] = useState<string[]>([])
  const [committees, setCommittees] = useState<any[]>([])
  const [districtCounts, setDistrictCounts] = useState<Record<string, { members: number; volunteers: number }>>({})
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSave = async () => {
    const finalName = `${formData.type === 'GENERAL_GOVERNANCE' ? 'General Governance' : 'Regional Network'} - ${state}`
    setSaving(true); setFormError('')
    try {
      const res = await fetch('/api/committees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, name: finalName, state }),
      })
      if (!res.ok) { const e = await res.json(); setFormError(e.error || 'Failed'); return }
      
      const newCommittee = await res.json()
      setDialogOpen(false)
      router.push(`/admin/committees/${newCommittee.id}`)
    } finally { setSaving(false) }
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resOpt, resC, resCounts] = await Promise.all([
        fetch(`/api/public/form-options`),
        fetch(`/api/committees?includeArchived=false`),
        fetch(`/api/locations/counts`)
      ])
      const dataOpt = await resOpt.json()
      const dataC = await resC.json()
      const dataCounts = await resCounts.json()
      setDistricts(dataOpt.districts?.[state] || [])
      setCommittees(dataC.filter((c: any) => c.state === state) || [])
      if (dataCounts.districtCounts) setDistrictCounts(dataCounts.districtCounts)
    } finally { setLoading(false) }
  }, [state])

  useEffect(() => { fetchData() }, [fetchData])

  const genGov = committees.find(c => c.type === 'GENERAL_GOVERNANCE')
  const regNet = committees.find(c => c.type === 'REGIONAL_NETWORK')

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => router.push('/admin/committees')}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
          <MapIcon />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: -0.5 }}>
            {state}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            State Network Overview
          </Typography>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.dark' }}>
        State Level Governance
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%' }}>
            <CardActionArea 
              sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              onClick={() => {
                if (genGov) router.push(`/admin/committees/${genGov.id}`)
                else { setFormData({ ...emptyForm, type: 'GENERAL_GOVERNANCE' }); setDialogOpen(true); }
              }}
            >
              <Box display="flex" alignItems="center" gap={2} width="100%">
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AccountBalanceIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>General Governance</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {genGov ? 'Manage state head & members' : 'Not configured - Click to create'}
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%' }}>
            <CardActionArea 
              sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              onClick={() => {
                if (regNet) router.push(`/admin/committees/${regNet.id}`)
                else { setFormData({ ...emptyForm, type: 'REGIONAL_NETWORK' }); setDialogOpen(true); }
              }}
            >
              <Box display="flex" alignItems="center" gap={2} width="100%">
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <GroupWorkIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Regional Network</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {regNet ? 'Manage network committee' : 'Not configured - Click to create'}
                  </Typography>
                </Box>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.dark' }}>
        Districts ({districts.length})
      </Typography>
      <Grid container spacing={3}>
        {districts.map(district => {
          const distKey = `${state}___${district}`
          const dMembers = districtCounts[distKey]?.members || 0
          const dVolunteers = districtCounts[distKey]?.volunteers || 0

          return (
            <Grid item xs={12} sm={6} md={4} key={district}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea 
                  sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between' }}
                  onClick={() => router.push(`/admin/network/${encodeURIComponent(state)}/${encodeURIComponent(district)}`)}
                >
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <LocationCityIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700} color="#12446A">{district}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        District Network Node
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 2 }}>
                    <Chip label={`Members: ${dMembers}`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                    <Chip label={`Volunteers: ${dVolunteers}`} size="small" color="success" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          )
        })}
      </Grid>
      
      {!loading && districts.length === 0 && (
        <Typography color="text.secondary">No districts found for this state.</Typography>
      )}

      {/* Create Modal for State Committees */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Create {formData.type === 'GENERAL_GOVERNANCE' ? 'General Governance' : 'Regional Network'} for {state}
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              This will initialize the {formData.type === 'GENERAL_GOVERNANCE' ? 'General Governance board' : 'Regional Network committee'}. You can assign the Head of State and other members on the next page.
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
