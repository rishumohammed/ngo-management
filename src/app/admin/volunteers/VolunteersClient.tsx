'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  Grid,
  Alert,
  CircularProgress,
  Stack,
  Autocomplete,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import { can } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { downloadCSV } from '@/lib/csv'
import { DEFAULT_INDIAN_STATES, DEFAULT_PIPELINE_STAGES, PipelineStageConfig } from '@/lib/constants'

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
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  skills: '',
  interests: '',
  availability: '',
  motivation: '',
}

export default function VolunteersClient() {
  const router = useRouter()
  const { data: session } = useSession()
  const role = session?.user?.role || ''
  const canCreate = can(role, 'volunteers', 'create')

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
  const [statesList, setStatesList] = useState<string[]>(DEFAULT_INDIAN_STATES)
  const [pipelineStages, setPipelineStages] = useState<PipelineStageConfig[]>(DEFAULT_PIPELINE_STAGES)

  useEffect(() => {
    fetch('/api/public/form-options')
      .then((res) => res.json())
      .then((data) => {
        if (data?.states && Array.isArray(data.states) && data.states.length > 0) {
          setStatesList(data.states)
        }
        if (data?.pipelineStages && Array.isArray(data.pipelineStages) && data.pipelineStages.length > 0) {
          setPipelineStages(data.pipelineStages)
        }
      })
      .catch(() => {})
  }, [])

  const dynamicStageLabels: Record<string, string> = { ...STAGE_LABELS }
  pipelineStages.forEach((s) => {
    dynamicStageLabels[s.key] = s.label
  })

  const fetchVolunteers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        pageSize: String(pageSize),
        search,
        stage: stageFilter,
      })
      const res = await fetch(`/api/volunteers?${params}`)
      const data = await res.json()
      setVolunteers(data.volunteers || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, stageFilter])

  useEffect(() => {
    fetchVolunteers()
  }, [fetchVolunteers])

  const handleAddSubmit = async () => {
    if (!formData.name || !formData.email) {
      setFormError('Name and email are required')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const res = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          skills: formData.skills ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
          interests: formData.interests ? formData.interests.split(',').map((s) => s.trim()).filter(Boolean) : [],
        }),
      })
      if (!res.ok) {
        const e = await res.json()
        setFormError(e.error || 'Failed to submit application')
        return
      }
      setAddDialogOpen(false)
      fetchVolunteers()
    } finally {
      setSaving(false)
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 170,
      renderCell: (p: GridRenderCellParams) => (
        <Box
          component={Link}
          href={`/admin/volunteers/${p.row.id}`}
          sx={{
            fontWeight: 600,
            color: '#12446A',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {p.value}
        </Box>
      ),
    },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 190 },
    { field: 'phone', headerName: 'Phone', width: 140, valueGetter: (v) => v || '—' },
    {
      field: 'currentStage',
      headerName: 'Pipeline Stage',
      width: 200,
      renderCell: (p: GridRenderCellParams) => (
        <Chip
          label={dynamicStageLabels[p.value] || p.value}
          size="small"
          color={STAGE_STATUS_COLORS[p.value] || 'default'}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Applied',
      width: 130,
      valueGetter: (v) => formatDate(v),
    },
    {
      field: 'actions',
      headerName: '',
      width: 90,
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Tooltip title="View Profile & Credentials">
          <IconButton
            size="small"
            component={Link}
            href={`/admin/volunteers/${p.row.id}`}
            color="primary"
          >
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
            <Button
              id="add-volunteer-btn"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setFormData(emptyForm)
                setFormError('')
                setAddDialogOpen(true)
              }}
            >
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
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel>Pipeline Stage</InputLabel>
          <Select
            label="Pipeline Stage"
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value)
              setPage(0)
            }}
          >
            <MenuItem value="">All Stages</MenuItem>
            {pipelineStages.map((s) => (
              <MenuItem key={s.key} value={s.key}>
                {s.label} {!s.enabled ? '(Disabled)' : ''}
              </MenuItem>
            ))}
            <MenuItem value="REJECTED">Rejected</MenuItem>
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
        onPaginationModelChange={(m) => {
          setPage(m.page)
          setPageSize(m.pageSize)
        }}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        autoHeight
        onRowClick={(params) => router.push(`/admin/volunteers/${params.id}`)}
        sx={{
          bgcolor: 'background.paper',
          cursor: 'pointer',
          '& .MuiDataGrid-row:hover': {
            bgcolor: '#F8FAFC',
          },
        }}
      />

      {/* Add Application Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VolunteerActivismIcon color="primary" /> New Volunteer Application
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Full Name *"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email *"
                type="email"
                fullWidth
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                fullWidth
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="City"
                fullWidth
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <Autocomplete
                options={statesList}
                value={formData.state || null}
                onChange={(_, newValue) => setFormData({ ...formData, state: newValue || '' })}
                renderInput={(params) => (
                  <TextField {...params} label="State / UT" placeholder="Select state" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Skills (comma-separated)"
                fullWidth
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Interests (comma-separated)"
                fullWidth
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Availability"
                fullWidth
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Motivation"
                fullWidth
                multiline
                rows={3}
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            id="save-volunteer-btn"
            variant="contained"
            onClick={handleAddSubmit}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Submit Application'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
