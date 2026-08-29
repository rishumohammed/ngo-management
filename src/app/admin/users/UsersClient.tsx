'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Button, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton, Tooltip,
  Alert, CircularProgress, Paper, Grid, InputAdornment, Stack
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SecurityIcon from '@mui/icons-material/Security'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import FilterListIcon from '@mui/icons-material/FilterList'
import { formatDate } from '@/lib/utils'
import { useSession } from 'next-auth/react'

type User = any

export default function UsersClient() {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', role: 'USER', isActive: true })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users`)
      const data = await res.json()
      setUsers(data.users || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Filtered users calculation
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false
    if (statusFilter === 'ACTIVE' && !u.isActive) return false
    if (statusFilter === 'INACTIVE' && u.isActive) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const nameMatch = u.name?.toLowerCase().includes(q)
      const emailMatch = u.email?.toLowerCase().includes(q)
      if (!nameMatch && !emailMatch) return false
    }
    return true
  })

  const handleOpenDialog = (user: User | null = null) => {
    if (user) {
      setEditingUser(user)
      setFormData({ name: user.name, email: user.email, role: user.role, isActive: user.isActive })
    } else {
      setEditingUser(null)
      setFormData({ name: '', email: '', role: 'USER', isActive: true })
    }
    setFormError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      setFormError('Name and email are required')
      return
    }
    setSaving(true)
    setFormError('')
    
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      // If editing, we only send role and isActive. If creating, we send all.
      const payload = editingUser 
        ? { role: formData.role, isActive: formData.isActive }
        : formData
        
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) {
        const err = await res.json()
        setFormError(err.error || 'Failed to save user')
        return
      }
      
      setDialogOpen(false)
      fetchUsers()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete user')
      fetchUsers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1.2, minWidth: 150 },
    { field: 'email', headerName: 'Email', flex: 1.2, minWidth: 200 },
    {
      field: 'role',
      headerName: 'Role',
      minWidth: 140,
      flex: 0.9,
      align: 'center',
      headerAlign: 'center',
      renderCell: (p: GridRenderCellParams) => (
        <Chip 
          label={p.value} 
          size="small" 
          color={p.value === 'SUPER_ADMIN' ? 'error' : p.value === 'ADMIN' ? 'warning' : 'default'}
          sx={{ fontWeight: 600, minWidth: 80 }}
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      minWidth: 120,
      flex: 0.8,
      align: 'center',
      headerAlign: 'center',
      renderCell: (p: GridRenderCellParams) => (
        <Chip 
          label={p.value ? 'Active' : 'Inactive'} 
          size="small" 
          color={p.value ? 'success' : 'default'}
          sx={{ fontWeight: 600, minWidth: 70 }}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      minWidth: 120,
      flex: 0.8,
      valueGetter: (v) => formatDate(v),
    },
    {
      field: 'lastLoginAt',
      headerName: 'Last Login',
      minWidth: 120,
      flex: 0.8,
      valueGetter: (v) => v ? formatDate(v) : 'Never',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      minWidth: 90,
      flex: 0.6,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', width: '100%' }}>
          <Tooltip title={p.row.id === currentUserId ? 'Cannot edit your own account here' : 'Edit User'}>
            <span>
              <IconButton 
                size="small" 
                onClick={() => handleOpenDialog(p.row)}
                disabled={p.row.id === currentUserId}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          {session?.user?.role === 'SUPER_ADMIN' && (
            <Tooltip title={p.row.id === currentUserId ? 'Cannot delete yourself' : 'Permanently Delete User'}>
              <span>
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => handleDelete(p.row.id)}
                  disabled={p.row.id === currentUserId}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ]

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
            User Management
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Manage staff accounts, roles, access permissions, and active statuses.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add User
        </Button>
      </Box>

      {/* Search & Filters Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #E2E8F0', borderRadius: 3, bgcolor: '#FFFFFF' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search users by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={roleFilter}
                label="Filter by Role"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Roles</MenuItem>
                <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="VOLUNTEER">Volunteer</MenuItem>
                <MenuItem value="USER">User</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                label="Filter by Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="ACTIVE">Active Only</MenuItem>
                <MenuItem value="INACTIVE">Inactive Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <DataGrid
        rows={filteredUsers}
        columns={columns}
        loading={loading}
        disableRowSelectionOnClick
        autoHeight
        sx={{ bgcolor: 'background.paper' }}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" />
          {editingUser ? 'Edit User' : 'Create User'}
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {!editingUser && (
            <Alert severity="info" sx={{ mb: 2 }}>
              New users will be assigned a temporary password <strong>TempPassword123!</strong>
            </Alert>
          )}
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!!editingUser}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!editingUser}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <MenuItem value="USER">User (Read-Only / Basic)</MenuItem>
                <MenuItem value="VOLUNTEER">Volunteer</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
              </Select>
            </FormControl>
            {editingUser && (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'ACTIVE' })}
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
