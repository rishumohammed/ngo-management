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
  Snackbar,
  Typography,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
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
  const canUpdate = can(role, 'volunteers', 'update')
  const canDelete = can(role, 'volunteers', 'delete')

  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Add Dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [statesList, setStatesList] = useState<string[]>(DEFAULT_INDIAN_STATES)
  const [pipelineStages, setPipelineStages] = useState<PipelineStageConfig[]>(DEFAULT_PIPELINE_STAGES)

  // Suspend Dialog
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [volunteerToSuspend, setVolunteerToSuspend] = useState<Volunteer | null>(null)
  const [suspensionReason, setSuspensionReason] = useState('')
  const [suspending, setSuspending] = useState(false)

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [volunteerToDelete, setVolunteerToDelete] = useState<Volunteer | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Reset Account Dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [volunteerToReset, setVolunteerToReset] = useState<Volunteer | null>(null)
  const [resetCustomPassword, setResetCustomPassword] = useState('')
  const [resetSendEmail, setResetSendEmail] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [resetSuccessData, setResetSuccessData] = useState<{ email: string; password?: string; inviteUrl?: string } | null>(null)

  // Toast
  const [toastMessage, setToastMessage] = useState('')

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
        status: statusFilter,
      })
      const res = await fetch(`/api/volunteers?${params}`)
      const data = await res.json()
      setVolunteers(data.volunteers || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, stageFilter, statusFilter])

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
      setToastMessage('Volunteer application added successfully!')
      fetchVolunteers()
    } finally {
      setSaving(false)
    }
  }

  // Handle Suspend / Reactivate
  const handleToggleSuspend = async (volunteer: Volunteer) => {
    if (!volunteer.isSuspended) {
      setVolunteerToSuspend(volunteer)
      setSuspensionReason('')
      setSuspendDialogOpen(true)
    } else {
      // Direct Unsuspend
      setLoading(true)
      try {
        const res = await fetch(`/api/volunteers/${volunteer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'REACTIVATE' }),
        })
        if (!res.ok) {
          const err = await res.json()
          setToastMessage(err.error || 'Failed to reactivate volunteer')
          return
        }
        setToastMessage(`Volunteer ${volunteer.name} reactivated successfully!`)
        fetchVolunteers()
      } finally {
        setLoading(false)
      }
    }
  }

  const handleConfirmSuspend = async () => {
    if (!volunteerToSuspend) return
    setSuspending(true)
    try {
      const res = await fetch(`/api/volunteers/${volunteerToSuspend.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUSPEND',
          reason: suspensionReason || 'Suspended by admin',
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setToastMessage(err.error || 'Failed to suspend volunteer')
        return
      }
      setSuspendDialogOpen(false)
      setVolunteerToSuspend(null)
      setToastMessage(`Volunteer ${volunteerToSuspend.name} has been suspended`)
      fetchVolunteers()
    } finally {
      setSuspending(false)
    }
  }

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!volunteerToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/volunteers/${volunteerToDelete.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        setToastMessage(err.error || 'Failed to delete volunteer')
        return
      }
      setDeleteDialogOpen(false)
      setVolunteerToDelete(null)
      setToastMessage(`Volunteer ${volunteerToDelete.name} deleted successfully`)
      fetchVolunteers()
    } finally {
      setDeleting(false)
    }
  }

  const handleConfirmReset = async () => {
    if (!volunteerToReset) return
    setResetting(true)
    try {
      const res = await fetch(`/api/volunteers/${volunteerToReset.id}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET_ACCOUNT',
          password: resetCustomPassword || undefined,
          sendEmail: resetSendEmail,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setToastMessage(data.error || 'Failed to reset volunteer account')
        return
      }
      setResetDialogOpen(false)
      if (data.credentials) {
        setResetSuccessData({
          email: data.credentials.email,
          password: data.credentials.password,
          inviteUrl: data.inviteUrl,
        })
      }
      setToastMessage(data.message || `Account for ${volunteerToReset.name} reset successfully!`)
      fetchVolunteers()
    } finally {
      setResetting(false)
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
          onClick={(e) => e.stopPropagation()}
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
      headerName: 'Status / Stage',
      width: 210,
      renderCell: (p: GridRenderCellParams) => {
        if (p.row.isSuspended) {
          return (
            <Tooltip title={p.row.suspensionReason ? `Suspended: ${p.row.suspensionReason}` : 'Volunteer is currently suspended'}>
              <Chip
                label="Suspended"
                size="small"
                sx={{
                  fontWeight: 700,
                  bgcolor: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #FDE68A',
                }}
              />
            </Tooltip>
          )
        }
        return (
          <Chip
            label={dynamicStageLabels[p.value] || p.value}
            size="small"
            color={STAGE_STATUS_COLORS[p.value] || 'default'}
            sx={{ fontWeight: 600 }}
          />
        )
      },
    },
    {
      field: 'createdAt',
      headerName: 'Applied',
      width: 130,
      valueGetter: (v) => formatDate(v),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
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

          {canUpdate && (
            <>
              <Tooltip title="Reset Account & Credentials">
                <IconButton
                  size="small"
                  color="info"
                  onClick={() => {
                    setVolunteerToReset(p.row)
                    setResetCustomPassword('')
                    setResetSendEmail(true)
                    setResetDialogOpen(true)
                  }}
                >
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title={p.row.isSuspended ? 'Reactivate Volunteer' : 'Suspend Volunteer'}>
                <IconButton
                  size="small"
                  color={p.row.isSuspended ? 'success' : 'warning'}
                  onClick={() => handleToggleSuspend(p.row)}
                >
                  {p.row.isSuspended ? (
                    <CheckCircleOutlineIcon fontSize="small" />
                  ) : (
                    <BlockIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </>
          )}

          {canDelete && (
            <Tooltip title="Delete Volunteer">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  setVolunteerToDelete(p.row)
                  setDeleteDialogOpen(true)
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
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
          placeholder="Search name, email, phone..."
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

        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(0)
            }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">Active Volunteers</MenuItem>
            <MenuItem value="SUSPENDED">Suspended Volunteers</MenuItem>
          </Select>
        </FormControl>

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

      {/* Suspend Volunteer Dialog */}
      <Dialog open={suspendDialogOpen} onClose={() => setSuspendDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#B45309' }}>
          <BlockIcon color="warning" /> Suspend Volunteer
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Suspending <strong>{volunteerToSuspend?.name}</strong> will disable their login access to the volunteer portal and pause their participation.
          </Typography>
          <TextField
            label="Suspension Reason"
            fullWidth
            multiline
            rows={3}
            value={suspensionReason}
            onChange={(e) => setSuspensionReason(e.target.value)}
            placeholder="e.g. Inactive for extended period / Policy violation"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSuspendDialogOpen(false)} disabled={suspending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleConfirmSuspend}
            disabled={suspending}
          >
            {suspending ? <CircularProgress size={20} color="inherit" /> : 'Confirm Suspension'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Volunteer Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <WarningAmberIcon color="error" /> Delete Volunteer
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action is permanent and cannot be undone!
          </Alert>
          <Typography variant="body2">
            Are you sure you want to permanently delete <strong>{volunteerToDelete?.name}</strong>? This will remove all associated records including logged hours, pipeline verification stages, event assignments, and their login account.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Account Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'info.main' }}>
          <RestartAltIcon color="info" /> Reset Volunteer Account
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Resetting the account will generate a new secure password, activate or re-link portal access, and clear any suspension.
          </Alert>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Target Volunteer: <strong>{volunteerToReset?.name}</strong> ({volunteerToReset?.email})
          </Typography>

          <TextField
            label="Custom Password (Optional)"
            fullWidth
            placeholder="Leave blank to auto-generate a strong password"
            value={resetCustomPassword}
            onChange={(e) => setResetCustomPassword(e.target.value)}
            helperText="If blank, a secure random password will automatically be generated."
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={resetSendEmail}
                onChange={(e) => setResetSendEmail(e.target.checked)}
                color="primary"
              />
            }
            label="Send login instructions and credentials email to volunteer"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResetDialogOpen(false)} disabled={resetting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="info"
            startIcon={<RestartAltIcon />}
            onClick={handleConfirmReset}
            disabled={resetting}
          >
            {resetting ? <CircularProgress size={20} color="inherit" /> : 'Confirm & Reset Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generated Credentials Success Modal */}
      <Dialog open={!!resetSuccessData} onClose={() => setResetSuccessData(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
          <CheckCircleIcon color="success" /> Account Reset & Credentials Generated
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="success" sx={{ mb: 2 }}>
            Volunteer credentials have been updated successfully. You can share these credentials directly:
          </Alert>

          <Stack spacing={2} sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>Portal Login URL</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <TextField
                  size="small"
                  fullWidth
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/login`}
                  InputProps={{ readOnly: true }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/login`)
                    setToastMessage('Copied Login URL')
                  }}
                >
                  Copy
                </Button>
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>Email Address</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <TextField
                  size="small"
                  fullWidth
                  value={resetSuccessData?.email || ''}
                  InputProps={{ readOnly: true }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(resetSuccessData?.email || '')
                    setToastMessage('Copied Email')
                  }}
                >
                  Copy
                </Button>
              </Box>
            </Box>

            {resetSuccessData?.password && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>Direct Password</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={resetSuccessData.password}
                    InputProps={{ readOnly: true }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(resetSuccessData.password!)
                      setToastMessage('Copied Password')
                    }}
                  >
                    Copy
                  </Button>
                </Box>
              </Box>
            )}

            {resetSuccessData?.inviteUrl && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>Invite Setup Link</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={resetSuccessData.inviteUrl}
                    InputProps={{ readOnly: true }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(resetSuccessData.inviteUrl!)
                      setToastMessage('Copied Setup Link')
                    }}
                  >
                    Copy
                  </Button>
                </Box>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={() => setResetSuccessData(null)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Snackbar */}
      <Snackbar
        open={!!toastMessage}
        autoHideDuration={4000}
        onClose={() => setToastMessage('')}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
