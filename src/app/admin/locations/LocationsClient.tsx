'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box, Typography, Button, Grid, Card, CardContent, Divider,
  Alert, CircularProgress, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, List, ListItem,
  ListItemText, ListItemSecondaryAction, Breadcrumbs, Link,
  Paper, Tooltip, Chip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import MapIcon from '@mui/icons-material/Map'
import LocationCityIcon from '@mui/icons-material/LocationCity'
import PeopleIcon from '@mui/icons-material/People'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import { can } from '@/lib/permissions'
import { DEFAULT_INDIAN_STATES } from '@/lib/constants'

export default function LocationsClient() {
  const { data: session } = useSession()
  const canEdit = can(session?.user?.role || '', 'settings', 'update')

  const [states, setStates] = useState<string[]>([])
  const [districtsMap, setDistrictsMap] = useState<Record<string, string[]>>({})
  const [stateCounts, setStateCounts] = useState<Record<string, { members: number; volunteers: number }>>({})
  const [districtCounts, setDistrictCounts] = useState<Record<string, { members: number; volunteers: number }>>({})
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [fullSettings, setFullSettings] = useState<any>(null)

  // Navigation state
  const [selectedState, setSelectedState] = useState<string | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add_state' | 'edit_state' | 'add_district' | 'edit_district'>('add_state')
  const [dialogValue, setDialogValue] = useState('')
  const [dialogOldValue, setDialogOldValue] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then((r) => r.json()),
      fetch('/api/locations/counts').then((r) => r.json()),
    ]).then(([settingsData, countsData]) => {
      setFullSettings(settingsData)
      setStates(JSON.parse(settingsData.form_states || JSON.stringify(DEFAULT_INDIAN_STATES)))
      setDistrictsMap(JSON.parse(settingsData.form_districts || '{}'))
      if (countsData.stateCounts) setStateCounts(countsData.stateCounts)
      if (countsData.districtCounts) setDistrictCounts(countsData.districtCounts)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  const handleSaveToServer = async (newStates: string[], newDistricts: Record<string, string[]>) => {
    setSaving(true)
    setMsg(null)
    try {
      const payload = {
        ...fullSettings,
        form_states: JSON.stringify(newStates),
        form_districts: JSON.stringify(newDistricts)
      }
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setFullSettings(payload)
        setStates(newStates)
        setDistrictsMap(newDistricts)
        setMsg({ type: 'success', text: 'Locations updated successfully.' })
      } else {
        setMsg({ type: 'error', text: 'Failed to save settings.' })
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Error saving settings.' })
    } finally {
      setSaving(false)
      setDialogOpen(false)
      setTimeout(() => setMsg(null), 3000)
    }
  }

  const handleOpenDialog = (mode: typeof dialogMode, oldVal: string = '') => {
    setDialogMode(mode)
    setDialogOldValue(oldVal)
    setDialogValue(mode.startsWith('add') ? '' : oldVal)
    setDialogOpen(true)
  }

  const handleDialogSubmit = () => {
    const val = dialogValue.trim()
    if (!val) return

    let newStates = [...states]
    let newDistricts = { ...districtsMap }

    if (dialogMode === 'add_state') {
      if (newStates.includes(val)) return setMsg({ type: 'error', text: 'State already exists.' })
      newStates.push(val)
      newStates.sort()
    } else if (dialogMode === 'edit_state') {
      if (newStates.includes(val) && val !== dialogOldValue) return setMsg({ type: 'error', text: 'State already exists.' })
      newStates = newStates.map(s => s === dialogOldValue ? val : s)
      // Migrate districts
      if (newDistricts[dialogOldValue]) {
        newDistricts[val] = newDistricts[dialogOldValue]
        delete newDistricts[dialogOldValue]
      }
      if (selectedState === dialogOldValue) setSelectedState(val)
    } else if (dialogMode === 'add_district') {
      if (!selectedState) return
      const ds = newDistricts[selectedState] || []
      if (ds.includes(val)) return setMsg({ type: 'error', text: 'District already exists.' })
      newDistricts[selectedState] = [...ds, val].sort()
    } else if (dialogMode === 'edit_district') {
      if (!selectedState) return
      const ds = newDistricts[selectedState] || []
      if (ds.includes(val) && val !== dialogOldValue) return setMsg({ type: 'error', text: 'District already exists.' })
      newDistricts[selectedState] = ds.map(d => d === dialogOldValue ? val : d)
    }

    handleSaveToServer(newStates, newDistricts)
  }

  const handleDeleteState = (st: string) => {
    if (!confirm(`Are you sure you want to delete ${st}? All its districts will also be removed.`)) return
    const newStates = states.filter(s => s !== st)
    const newDistricts = { ...districtsMap }
    delete newDistricts[st]
    handleSaveToServer(newStates, newDistricts)
  }

  const handleDeleteDistrict = (dist: string) => {
    if (!selectedState) return
    if (!confirm(`Are you sure you want to delete ${dist}?`)) return
    const newDistricts = { ...districtsMap }
    newDistricts[selectedState] = (newDistricts[selectedState] || []).filter(d => d !== dist)
    handleSaveToServer(states, newDistricts)
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
            <Link component="button" variant="h5" underline="hover" color={selectedState ? "inherit" : "text.primary"} onClick={() => setSelectedState(null)} sx={{ fontWeight: 700 }}>
              State Master
            </Link>
            {selectedState && (
              <Typography variant="h5" color="text.primary" sx={{ fontWeight: 700 }}>
                {selectedState}
              </Typography>
            )}
          </Breadcrumbs>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {selectedState ? `Manage districts, members & volunteers in ${selectedState}` : 'Manage states, districts, and regional network counts'}
          </Typography>
        </Box>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog(selectedState ? 'add_district' : 'add_state')}
            disabled={saving}
          >
            {selectedState ? 'Add District' : 'Add State'}
          </Button>
        )}
      </Box>

      {msg && <Alert severity={msg.type} sx={{ mb: 3 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

      {!selectedState ? (
        // STATES LIST
        <Grid container spacing={3}>
          {states.map(st => {
            const distCount = (districtsMap[st] || []).length
            const stMembers = stateCounts[st]?.members || 0
            const stVolunteers = stateCounts[st]?.volunteers || 0

            return (
              <Grid item xs={12} sm={6} md={4} key={st}>
                <Card
                  sx={{
                    height: '100%',
                    transition: '0.2s',
                    cursor: 'pointer',
                    borderRadius: 3,
                    border: '1px solid #E2E8F0',
                    '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
                  }}
                  onClick={() => setSelectedState(st)}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ p: 1.25, bgcolor: 'primary.50', borderRadius: 2, color: 'primary.main', display: 'flex' }}>
                          <MapIcon />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#12446A' }}>{st}</Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>{distCount} District{distCount !== 1 && 's'}</Typography>
                        </Box>
                      </Box>
                      {canEdit && (
                        <Box onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Edit State">
                            <IconButton size="small" onClick={() => handleOpenDialog('edit_state', st)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete State">
                            <IconButton size="small" color="error" onClick={() => handleDeleteState(st)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Member & Volunteer Count Chips */}
                    <Box display="flex" gap={1.25} flexWrap="wrap">
                      <Chip
                        icon={<PeopleIcon sx={{ fontSize: '1rem !important' }} />}
                        label={`Members: ${stMembers}`}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 700, fontSize: '0.75rem', px: 0.5 }}
                      />
                      <Chip
                        icon={<VolunteerActivismIcon sx={{ fontSize: '1rem !important' }} />}
                        label={`Volunteers: ${stVolunteers}`}
                        size="small"
                        color="success"
                        sx={{ fontWeight: 700, fontSize: '0.75rem', px: 0.5 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      ) : (
        // DISTRICTS LIST
        <Paper variant="outlined" sx={{ borderRadius: 3 }}>
          <List>
            {(districtsMap[selectedState] || []).map((dist, idx, arr) => {
              const distKey = `${selectedState}___${dist}`
              const dMembers = districtCounts[distKey]?.members || 0
              const dVolunteers = districtCounts[distKey]?.volunteers || 0

              return (
                <Box key={dist}>
                  <ListItem
                    sx={{
                      py: 2,
                      px: 3,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}
                      onClick={() => window.location.href = `/admin/network/${encodeURIComponent(selectedState!)}/${encodeURIComponent(dist)}`}
                    >
                      <Box sx={{ p: 1, bgcolor: 'info.50', borderRadius: 1.5, color: 'info.main', display: 'flex' }}>
                        <LocationCityIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700} color="#12446A">
                          {dist}
                        </Typography>
                        <Box display="flex" gap={1} sx={{ mt: 0.75 }}>
                          <Chip icon={<PeopleIcon sx={{ fontSize: '0.9rem !important' }} />} label={`Members: ${dMembers}`} size="small" color="primary" sx={{ height: 24, fontSize: '0.72rem', fontWeight: 700 }} />
                          <Chip icon={<VolunteerActivismIcon sx={{ fontSize: '0.9rem !important' }} />} label={`Volunteers: ${dVolunteers}`} size="small" color="success" sx={{ height: 24, fontSize: '0.72rem', fontWeight: 700 }} />
                        </Box>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        endIcon={<NavigateNextIcon fontSize="small" />}
                        onClick={() => window.location.href = `/admin/network/${encodeURIComponent(selectedState!)}/${encodeURIComponent(dist)}`}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        View District Members & Volunteers
                      </Button>

                      {canEdit && (
                        <>
                          <IconButton size="small" onClick={() => handleOpenDialog('edit_district', dist)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteDistrict(dist)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </ListItem>
                  {idx < arr.length - 1 && <Divider />}
                </Box>
              )
            })}
            {(districtsMap[selectedState] || []).length === 0 && (
              <ListItem sx={{ py: 4, justifyContent: 'center' }}>
                <Typography color="text.secondary">No districts configured for this state.</Typography>
              </ListItem>
            )}
          </List>
        </Paper>
      )}

      {/* DIALOG */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'add_state' && 'Add New State / UT'}
          {dialogMode === 'edit_state' && 'Rename State / UT'}
          {dialogMode === 'add_district' && `Add District to ${selectedState}`}
          {dialogMode === 'edit_district' && 'Rename District'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={dialogValue}
            onChange={e => setDialogValue(e.target.value)}
            disabled={saving}
            onKeyDown={e => e.key === 'Enter' && handleDialogSubmit()}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleDialogSubmit} disabled={saving || !dialogValue.trim()}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
