'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Button, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton, Tooltip,
  Alert, CircularProgress,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import SecurityIcon from '@mui/icons-material/Security'
import { formatDate } from '@/lib/utils'
import { useSession } from 'next-auth/react'

type User = any

export default function UsersClient() {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  
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

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    {
      field: 'role',
      headerName: 'Role',
      width: 150,
      renderCell: (p: GridRenderCellParams) => (
        <Chip 
          label={p.value} 
          size="small" 
          color={p.value === 'SUPER_ADMIN' ? 'error' : p.value === 'ADMIN' ? 'warning' : 'default'} 
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (p: GridRenderCellParams) => (
        <Chip 
          label={p.value ? 'Active' : 'Inactive'} 
          size="small" 
          color={p.value ? 'success' : 'default'} 
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 130,
      valueGetter: (v) => formatDate(v),
    },
    {
      field: 'lastLoginAt',
      headerName: 'Last Login',
      width: 130,
      valueGetter: (v) => v ? formatDate(v) : 'Never',
    },
    {
      field: 'actions',
      headerName: '',
      width: 80,
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
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
      ),
    },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add User
        </Button>
      </Box>

      <DataGrid
        rows={users}
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
