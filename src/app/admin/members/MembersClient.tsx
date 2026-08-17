'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box,
  Button,
  Typography,
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
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import PersonIcon from '@mui/icons-material/Person'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import { can } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { downloadCSV } from '@/lib/csv'
import { DEFAULT_INDIAN_STATES } from '@/lib/constants'

const MEMBERSHIP_TYPE_LABELS: Record<string, string> = {
  GENERAL: 'General',
  LIFE: 'Life',
  HONORARY: 'Honorary',
  PATRON: 'Patron',
}

const STATUS_COLORS: Record<string, 'success' | 'default' | 'error'> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  DECEASED: 'error',
}

interface Member {
  id: string
  memberNumber: string
  name: string
  phone: string | null
  email: string | null
  city: string | null
  state: string | null
  joinDate: string
  membershipType: string
  status: string
  notes: string | null
}

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  joinDate: new Date().toISOString().split('T')[0],
  membershipType: 'GENERAL',
  status: 'ACTIVE',
  notes: '',
}

export default function MembersClient() {
  const { data: session } = useSession()
  const role = session?.user?.role || ''

  const canCreate = can(role, 'members', 'create')
  const canUpdate = can(role, 'members', 'update')
  const canDelete = can(role, 'members', 'delete')

  const [members, setMembers] = useState<Member[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingMember, setDeletingMember] = useState<Member | null>(null)
  
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [upgradingMember, setUpgradingMember] = useState<Member | null>(null)
  const [upgrading, setUpgrading] = useState(false)

  const [statesList, setStatesList] = useState<string[]>(DEFAULT_INDIAN_STATES)

  useEffect(() => {
    fetch('/api/public/form-options')
      .then(res => res.json())
      .then(data => {
        if (data?.states && Array.isArray(data.states) && data.states.length > 0) {
          setStatesList(data.states)
        }
      })
      .catch(() => {})
  }, [])

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        pageSize: String(pageSize),
        search,
        status: statusFilter,
        membershipType: typeFilter,
      })
      const res = await fetch(`/api/members?${params}`)
      const data = await res.json()
      setMembers(data.members || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, statusFilter, typeFilter])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const openAddDialog = () => {
    setEditingMember(null)
    setFormData(emptyForm)
    setFormError('')
    setDialogOpen(true)
  }

  const openEditDialog = (member: Member) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      phone: member.phone || '',
      email: member.email || '',
      address: '',
      city: member.city || '',
      state: member.state || '',
      joinDate: member.joinDate.split('T')[0],
      membershipType: member.membershipType,
      status: member.status,
      notes: member.notes || '',
    })
    setFormError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) { setFormError('Name is required'); return }
    setSaving(true)
    setFormError('')
    try {
      const url = editingMember ? `/api/members/${editingMember.id}` : '/api/members'
      const method = editingMember ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const err = await res.json()
        setFormError(err.error || 'Failed to save')
        return
      }
      setDialogOpen(false)
      fetchMembers()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingMember) return
    const res = await fetch(`/api/members/${deletingMember.id}`, { method: 'DELETE' })
    if (res.ok) {
      setDeleteDialogOpen(false)
      fetchMembers()
    }
  }

  const handleUpgrade = async () => {
    if (!upgradingMember) return
    setUpgrading(true)
    try {
      const res = await fetch(`/api/members/${upgradingMember.id}/upgrade`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to upgrade to volunteer')
        return
      }
      setUpgradeDialogOpen(false)
      alert(`Successfully added ${upgradingMember.name} to the Volunteer pipeline!`)
    } catch (e) {
      alert('Error upgrading to volunteer')
    } finally {
      setUpgrading(false)
    }
  }

  const columns: GridColDef[] = [
    { field: 'memberNumber', headerName: 'Member #', minWidth: 120, flex: 0.8 },
    { field: 'name', headerName: 'Name', flex: 1.2, minWidth: 160 },
    { field: 'phone', headerName: 'Phone', minWidth: 130, flex: 0.9, valueGetter: (v) => v || '—' },
    { field: 'email', headerName: 'Email', flex: 1.2, minWidth: 180, valueGetter: (v) => v || '—' },
    { field: 'city', headerName: 'City', minWidth: 120, flex: 0.8, valueGetter: (v) => v || '—' },
    {
      field: 'membershipType',
      headerName: 'Type',
      minWidth: 120,
      flex: 0.8,
      align: 'center',
      headerAlign: 'center',
      renderCell: (p: GridRenderCellParams) => (
        <Chip label={MEMBERSHIP_TYPE_LABELS[p.value] || p.value} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 120,
      flex: 0.8,
      align: 'center',
      headerAlign: 'center',
      renderCell: (p: GridRenderCellParams) => (
        <Chip label={p.value} size="small" color={STATUS_COLORS[p.value] || 'default'} sx={{ fontWeight: 600, minWidth: 80 }} />
      ),
    },
    {
      field: 'joinDate',
      headerName: 'Join Date',
      minWidth: 120,
      flex: 0.8,
      valueGetter: (v) => formatDate(v),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      minWidth: 100,
      flex: 0.7,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', width: '100%' }}>
          {canUpdate && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => openEditDialog(p.row as Member)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canUpdate && (
            <Tooltip title="Upgrade to Volunteer">
              <IconButton size="small" color="primary" onClick={() => { setUpgradingMember(p.row as Member); setUpgradeDialogOpen(true) }}>
                <VolunteerActivismIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => { setDeletingMember(p.row as Member); setDeleteDialogOpen(true) }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ]

  return (
    <Box>
      {/* Header */}
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
            Members Directory
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Manage organization members, types, contact information, and membership status.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            onClick={() => downloadCSV(members, 'Members_Export')}
            disabled={members.length === 0}
          >
            Export CSV
          </Button>
          {canCreate && (
            <Button
              id="add-member-btn"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openAddDialog}
            >
              Add Member
            </Button>
          )}
        </Stack>
      </Box>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          placeholder="Search name, email, phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
            <MenuItem value="DECEASED">Deceased</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Membership Type</InputLabel>
          <Select
            label="Membership Type"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="GENERAL">General</MenuItem>
            <MenuItem value="LIFE">Life</MenuItem>
            <MenuItem value="HONORARY">Honorary</MenuItem>
            <MenuItem value="PATRON">Patron</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* DataGrid */}
      <DataGrid
        rows={members}
        columns={columns}
        rowCount={total}
        loading={loading}
        paginationMode="server"
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={(m) => { setPage(m.page); setPageSize(m.pageSize) }}
        pageSizeOptions={[10, 25, 50, 100]}
        disableRowSelectionOnClick
        autoHeight
        sx={{ bgcolor: 'background.paper' }}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          {editingMember ? 'Edit Member' : 'Add New Member'}
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
                label="Phone"
                fullWidth
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="City"
                fullWidth
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={statesList}
                value={formData.state || null}
                onChange={(_, newValue) => setFormData({ ...formData, state: newValue || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="State / UT"
                    placeholder="Select state"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Join Date *"
                type="date"
                fullWidth
                value={formData.joinDate}
                onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Membership Type</InputLabel>
                <Select
                  label="Membership Type"
                  value={formData.membershipType}
                  onChange={(e) => setFormData({ ...formData, membershipType: e.target.value })}
                >
                  <MenuItem value="GENERAL">General</MenuItem>
                  <MenuItem value="LIFE">Life</MenuItem>
                  <MenuItem value="HONORARY">Honorary</MenuItem>
                  <MenuItem value="PATRON">Patron</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {editingMember && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                    <MenuItem value="DECEASED">Deceased</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button
            id="save-member-btn"
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : editingMember ? 'Save Changes' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs">
        <DialogTitle>Delete Member?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deletingMember?.name}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upgrade Confirm Dialog */}
      <Dialog open={upgradeDialogOpen} onClose={() => !upgrading && setUpgradeDialogOpen(false)} maxWidth="xs">
        <DialogTitle>Upgrade to Volunteer?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to upgrade <strong>{upgradingMember?.name}</strong> to a Volunteer? 
            They will be added to the Volunteer pipeline in the <strong>APPLICATION</strong> stage.
            <br/><br/>
            (Their original Member record will remain intact).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialogOpen(false)} disabled={upgrading}>Cancel</Button>
          <Button color="primary" variant="contained" onClick={handleUpgrade} disabled={upgrading}>
            {upgrading ? <CircularProgress size={20} color="inherit" /> : 'Confirm Upgrade'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
