'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box, Button, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton, Tooltip,
  InputAdornment, Grid, Alert, CircularProgress, Stack, Stepper, Step, StepLabel,
  StepContent, Drawer, Divider, Avatar, LinearProgress,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import { can } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { downloadCSV } from '@/lib/csv'

const PIPELINE_STAGES = ['APPLICATION', 'DOCUMENT_VERIFICATION', 'INTERVIEW', 'TRAINING', 'APPROVED']
const STAGE_LABELS: Record<string, string> = {
  APPLICATION: 'Application',
  DOCUMENT_VERIFICATION: 'Document Verification',
  INTERVIEW: 'Interview',
  TRAINING: 'Training',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}
const STAGE_STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  PENDING: 'default',
  IN_PROGRESS: 'primary',
  PASSED: 'success',
  FAILED: 'error',
  APPROVED: 'success',
  REJECTED: 'error',
}


type Volunteer = any

const emptyForm = {
  name: '', email: '', phone: '', address: '', city: '', state: '',
  skills: '', interests: '', availability: '', motivation: '',
}

export default function VolunteersClient() {
  const { data: session } = useSession()
  const role = session?.user?.role || ''
  const canCreate = can(role, 'volunteers', 'create')
  const canUpdate = can(role, 'volunteers', 'update')

  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null)
  const [stageNotes, setStageNotes] = useState('')
  const [stageConductedBy, setStageConductedBy] = useState('')
  const [stageAdvancing, setStageAdvancing] = useState(false)

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const fetchVolunteers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page + 1), pageSize: String(pageSize), search, stage: stageFilter })
      const res = await fetch(`/api/volunteers?${params}`)
      const data = await res.json()
      setVolunteers(data.volunteers || [])
      setTotal(data.total || 0)
    } finally { setLoading(false) }
  }, [page, pageSize, search, stageFilter])

  useEffect(() => { fetchVolunteers() }, [fetchVolunteers])

  const openDetail = async (volunteer: Volunteer) => {
    const res = await fetch(`/api/volunteers/${volunteer.id}`)
    const data = await res.json()
    setSelectedVolunteer(data)
    setStageNotes('')
    setStageConductedBy('')
    setDetailOpen(true)
  }

  const handleAddSubmit = async () => {
    if (!formData.name || !formData.email) { setFormError('Name and email are required'); return }
    setSaving(true); setFormError('')
    try {
      const res = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
          interests: formData.interests ? formData.interests.split(',').map(s => s.trim()) : [],
        }),
      })
      if (!res.ok) { const e = await res.json(); setFormError(e.error || 'Failed'); return }
      setAddDialogOpen(false)
      fetchVolunteers()
    } finally { setSaving(false) }
  }

  const handleAdvanceStage = async (pass: boolean) => {
    if (!selectedVolunteer) return
    const stage = selectedVolunteer.currentStage
    setStageAdvancing(true)
    try {
      const res = await fetch(`/api/volunteers/${selectedVolunteer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage,
          status: pass ? 'PASSED' : 'FAILED',
          notes: stageNotes,
          conductedBy: stageConductedBy,
          conductedAt: new Date().toISOString(),
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setSelectedVolunteer(updated)
        fetchVolunteers()
      }
    } finally { setStageAdvancing(false) }
  }

  const handleReject = async () => {
    if (!selectedVolunteer) return
    setStageAdvancing(true)
    try {
      await fetch(`/api/volunteers/${selectedVolunteer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'REJECTED',
          status: 'FAILED',
          rejectionReason: rejectReason,
        }),
      })
      const updated = await fetch(`/api/volunteers/${selectedVolunteer.id}`).then(r => r.json())
      setSelectedVolunteer(updated)
      setRejectDialogOpen(false)
      fetchVolunteers()
    } finally { setStageAdvancing(false) }
  }

  const stageIndex = selectedVolunteer
    ? PIPELINE_STAGES.indexOf(selectedVolunteer.currentStage)
    : -1

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
    { field: 'phone', headerName: 'Phone', width: 130, valueGetter: (v) => v || '—' },
    {
      field: 'currentStage',
      headerName: 'Pipeline Stage',
      width: 200,
      renderCell: (p: GridRenderCellParams) => (
        <Chip
          label={STAGE_LABELS[p.value] || p.value}
          size="small"
          color={STAGE_STATUS_COLORS[p.value] || 'default'}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Applied',
      width: 120,
      valueGetter: (v) => formatDate(v),
    },
    {
      field: 'actions',
      headerName: '',
      width: 80,
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Tooltip title="View Details">
          <IconButton size="small" onClick={() => openDetail(p.row)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ]

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            onClick={() => downloadCSV(volunteers, 'Volunteers_Export')}
            disabled={volunteers.length === 0}
          >
            Export CSV
          </Button>
          {canCreate && (
            <Button id="add-volunteer-btn" variant="contained" startIcon={<AddIcon />} onClick={() => { setFormData(emptyForm); setFormError(''); setAddDialogOpen(true) }}>
              Add Application
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          placeholder="Search name, email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          sx={{ minWidth: 240 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Pipeline Stage</InputLabel>
          <Select label="Pipeline Stage" value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); setPage(0) }}>
            <MenuItem value="">All Stages</MenuItem>
            {Object.entries(STAGE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      <DataGrid
        rows={volunteers}
        columns={columns}
        rowCount={total}
        loading={loading}
        paginationMode="server"
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={(m) => { setPage(m.page); setPageSize(m.pageSize) }}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        autoHeight
        sx={{ bgcolor: 'background.paper' }}
      />

      {/* Add Application Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VolunteerActivismIcon color="primary" /> New Volunteer Application
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField label="Full Name *" fullWidth value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Email *" type="email" fullWidth value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Phone" fullWidth value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Address" fullWidth multiline rows={2} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="City" fullWidth value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="State" fullWidth value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Skills (comma-separated)" fullWidth value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Interests (comma-separated)" fullWidth value={formData.interests} onChange={e => setFormData({ ...formData, interests: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Availability" fullWidth value={formData.availability} onChange={e => setFormData({ ...formData, availability: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Motivation" fullWidth multiline rows={3} value={formData.motivation} onChange={e => setFormData({ ...formData, motivation: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button id="save-volunteer-btn" variant="contained" onClick={handleAddSubmit} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Submit Application'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Volunteer Detail Drawer */}
      <Drawer anchor="right" open={detailOpen} onClose={() => setDetailOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 520 }, p: 3 } }}>
        {selectedVolunteer && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, fontSize: '1.25rem' }}>
                {selectedVolunteer.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>{selectedVolunteer.name}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedVolunteer.email}</Typography>
              </Box>
              <Box sx={{ ml: 'auto' }}>
                <Chip
                  label={STAGE_LABELS[selectedVolunteer.currentStage]}
                  color={STAGE_STATUS_COLORS[selectedVolunteer.currentStage]}
                  size="small"
                />
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Pipeline Stepper */}
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Onboarding Pipeline</Typography>
            <Stepper activeStep={selectedVolunteer.currentStage === 'REJECTED' ? -1 : stageIndex} orientation="vertical">
              {PIPELINE_STAGES.map((s, idx) => {
                const stageRecord = selectedVolunteer.stages?.find((sr: { stage: string }) => sr.stage === s)
                const isCompleted = stageIndex > idx || selectedVolunteer.currentStage === 'APPROVED'
                return (
                  <Step key={s} completed={isCompleted}>
                    <StepLabel
                      StepIconProps={{ icon: isCompleted ? <CheckCircleIcon color="success" fontSize="small" /> : idx + 1 }}
                    >
                      <Typography variant="body2" fontWeight={isCompleted || stageIndex === idx ? 600 : 400}>
                        {STAGE_LABELS[s]}
                      </Typography>
                      {stageRecord && (
                        <Chip label={stageRecord.status} size="small" color={STAGE_STATUS_COLORS[stageRecord.status]} sx={{ ml: 1, fontSize: '0.65rem', height: 16 }} />
                      )}
                    </StepLabel>
                    <StepContent>
                      {stageRecord?.notes && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                          {stageRecord.notes}
                        </Typography>
                      )}
                    </StepContent>
                  </Step>
                )
              })}
            </Stepper>

            {/* Stage Action Panel */}
            {canUpdate && selectedVolunteer.currentStage !== 'APPROVED' && selectedVolunteer.currentStage !== 'REJECTED' && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                  Advance: {STAGE_LABELS[selectedVolunteer.currentStage]}
                </Typography>
                <TextField
                  label="Notes"
                  fullWidth
                  multiline
                  rows={2}
                  value={stageNotes}
                  onChange={e => setStageNotes(e.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <TextField
                  label="Conducted by"
                  fullWidth
                  value={stageConductedBy}
                  onChange={e => setStageConductedBy(e.target.value)}
                  sx={{ mb: 2 }}
                />
                {stageAdvancing && <LinearProgress sx={{ mb: 1.5 }} />}
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<ArrowForwardIcon />}
                    onClick={() => handleAdvanceStage(true)}
                    disabled={stageAdvancing}
                    size="small"
                  >
                    {selectedVolunteer.currentStage === 'TRAINING' ? 'Approve Volunteer' : 'Pass & Next Stage'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => { setRejectReason(''); setRejectDialogOpen(true) }}
                    disabled={stageAdvancing}
                    size="small"
                  >
                    Reject
                  </Button>
                </Stack>
              </Box>
            )}

            {selectedVolunteer.currentStage === 'APPROVED' && (
              <Alert severity="success" sx={{ mt: 3 }} icon={<CheckCircleIcon />}>
                Volunteer approved! Login account created and invite email sent.
              </Alert>
            )}
            {selectedVolunteer.currentStage === 'REJECTED' && (
              <Alert severity="error" sx={{ mt: 3 }}>
                Rejected: {selectedVolunteer.rejectionReason || 'No reason provided'}
              </Alert>
            )}
          </Box>
        )}
      </Drawer>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Volunteer?</DialogTitle>
        <DialogContent>
          <TextField
            label="Rejection Reason"
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleReject}>Confirm Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
