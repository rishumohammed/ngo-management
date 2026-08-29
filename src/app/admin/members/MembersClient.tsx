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
  Divider,
  Avatar,
  Card,
  CardContent,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import PersonIcon from '@mui/icons-material/Person'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import BadgeIcon from '@mui/icons-material/Badge'
import StickyNote2Icon from '@mui/icons-material/StickyNote2'

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
  address: string | null
  city: string | null
  district: string | null
  state: string | null
  gender: string | null
  education: string | null
  joinDate: string
  membershipType: string
  status: string
  notes: string | null
  createdAt?: string
  updatedAt?: string
}

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  district: '',
  state: '',
  gender: '',
  education: '',
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

  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingMember, setViewingMember] = useState<Member | null>(null)

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

  const openViewDialog = (member: Member) => {
    setViewingMember(member)
    setViewDialogOpen(true)
  }

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
      address: member.address || '',
      city: member.city || '',
      district: member.district || '',
      state: member.state || '',
      gender: member.gender || '',
      education: member.education || '',
      joinDate: member.joinDate ? member.joinDate.split('T')[0] : new Date().toISOString().split('T')[0],
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
      fetchMembers()
      alert(`Successfully upgraded ${upgradingMember.name} to a Volunteer! The record has been moved to the Volunteer pipeline.`)
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
      minWidth: 130,
      flex: 0.9,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', width: '100%' }}>
          <Tooltip title="View Details">
            <IconButton size="small" color="info" onClick={() => openViewDialog(p.row as Member)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
          placeholder="Search name, phone, member #..."
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

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ p: 3, pb: 2, bgcolor: '#F8FAFC' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(0,137,123,0.2)'
                }}
              >
                {viewingMember?.name?.charAt(0).toUpperCase() || 'M'}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                  {viewingMember?.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
                  <Chip
                    label={`ID: ${viewingMember?.memberNumber}`}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      bgcolor: '#E2E8F0',
                      color: '#334155',
                      fontSize: '0.75rem'
                    }}
                  />
                  <Chip
                    label={viewingMember?.status || 'ACTIVE'}
                    size="small"
                    color={STATUS_COLORS[viewingMember?.status || 'ACTIVE'] || 'default'}
                    sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                  />
                  <Chip
                    label={`${MEMBERSHIP_TYPE_LABELS[viewingMember?.membershipType || 'GENERAL'] || viewingMember?.membershipType} Member`}
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3, bgcolor: '#FFFFFF' }}>
          {viewingMember && (
            <Grid container spacing={2.5}>
              {/* Card 1: Personal & Contact Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2.5, height: '100%', borderColor: '#E2E8F0' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main' }}>
                      <PersonIcon fontSize="small" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Contact & Personal Details
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                          PHONE NUMBER
                        </Typography>
                        {viewingMember.phone ? (
                          <Box
                            component="a"
                            href={`tel:${viewingMember.phone}`}
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 1,
                              color: 'primary.main',
                              textDecoration: 'none',
                              fontWeight: 600,
                              fontSize: '0.95rem',
                              mt: 0.25,
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            <PhoneIcon fontSize="inherit" />
                            {viewingMember.phone}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ mt: 0.25 }}>Not provided</Typography>
                        )}
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                          EMAIL ADDRESS
                        </Typography>
                        {viewingMember.email ? (
                          <Box
                            component="a"
                            href={`mailto:${viewingMember.email}`}
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 1,
                              color: 'primary.main',
                              textDecoration: 'none',
                              fontWeight: 600,
                              fontSize: '0.95rem',
                              mt: 0.25,
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            <EmailIcon fontSize="inherit" />
                            {viewingMember.email}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ mt: 0.25 }}>Not provided</Typography>
                        )}
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                          GENDER
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                          {viewingMember.gender || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Not specified</span>}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                          EDUCATION
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                          {viewingMember.education || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Not specified</span>}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Card 2: Membership & Governance */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2.5, height: '100%', borderColor: '#E2E8F0' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main' }}>
                      <BadgeIcon fontSize="small" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Membership Info
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                          MEMBER NUMBER
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
                          {viewingMember.memberNumber}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                          MEMBERSHIP TIER
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                          {MEMBERSHIP_TYPE_LABELS[viewingMember.membershipType] || viewingMember.membershipType}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                          JOIN DATE
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                          <CalendarTodayIcon fontSize="inherit" color="action" />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatDate(viewingMember.joinDate)}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                          STATUS
                        </Typography>
                        <Chip
                          label={viewingMember.status}
                          size="small"
                          color={STATUS_COLORS[viewingMember.status] || 'default'}
                          sx={{ fontWeight: 700, mt: 0.5 }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Card 3: Address & Location Details */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: '#E2E8F0' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, color: 'primary.main' }}>
                      <LocationOnIcon fontSize="small" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Address & Location
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                          STREET ADDRESS
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25 }}>
                          {viewingMember.address || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Not provided</span>}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                          CITY / DISTRICT / STATE
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                          {[viewingMember.city, viewingMember.district, viewingMember.state].filter(Boolean).join(', ') || (
                            <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Not provided</span>
                          )}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Card 4: Notes (if present) */}
              {viewingMember.notes && (
                <Grid item xs={12}>
                  <Box sx={{ bgcolor: '#FFFBEB', border: '1px solid #FDE68A', p: 2, borderRadius: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: '#D97706' }}>
                      <StickyNote2Icon fontSize="small" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Member Notes
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#92400E', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {viewingMember.notes}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5, px: 3, bgcolor: '#F8FAFC', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5}>
            {canUpdate && viewingMember && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => { setViewDialogOpen(false); openEditDialog(viewingMember) }}
              >
                Edit Details
              </Button>
            )}
            {canUpdate && viewingMember && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<VolunteerActivismIcon />}
                onClick={() => { setViewDialogOpen(false); setUpgradingMember(viewingMember); setUpgradeDialogOpen(true) }}
              >
                Upgrade to Volunteer
              </Button>
            )}
          </Stack>
          <Button onClick={() => setViewDialogOpen(false)} variant="text" color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Gender"
                fullWidth
                value={formData.gender}
                placeholder="Male / Female / Other"
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Education"
                fullWidth
                value={formData.education}
                placeholder="Degree / Qualification"
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
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
            <Grid item xs={12} sm={4}>
              <TextField
                label="City"
                fullWidth
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="District"
                fullWidth
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
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
            They will be moved to the Volunteer pipeline in the <strong>APPLICATION</strong> stage, and removed from the Members directory.
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
