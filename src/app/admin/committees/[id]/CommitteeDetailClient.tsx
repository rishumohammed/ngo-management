'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Button, Typography, Card, CardContent, CardHeader,
  Grid, TextField, CircularProgress, Alert, IconButton,
  List, ListItem, ListItemText, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
  Chip, Avatar
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import dayjs from 'dayjs'

export default function CommitteeDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const [committee, setCommittee] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [membersList, setMembersList] = useState<any[]>([])
  const [volunteersList, setVolunteersList] = useState<any[]>([])

  // Committee Edit State
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', type: '', purpose: '', isArchived: false })

  // Member Dialog State
  const [memberOpen, setMemberOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [memberForm, setMemberForm] = useState({ 
    memberId: '', volunteerId: '', designation: '', district: '', role: 'MEMBER', termStart: '', termEnd: '', isActive: true
  })
  const [districtsMap, setDistrictsMap] = useState<Record<string, string[]>>({})
  const [selectedState, setSelectedState] = useState<string>('')

  const fetchData = useCallback(async () => {
    try {
      const [resC, resM, resV, resOpt] = await Promise.all([
        fetch(`/api/committees/${id}`),
        fetch(`/api/members`),
        fetch(`/api/volunteers`),
        fetch(`/api/public/form-options`)
      ])
      if (!resC.ok) throw new Error('Failed to fetch committee')
      
      const [dataC, dataM, dataV, dataOpt] = await Promise.all([resC.json(), resM.json(), resV.json(), resOpt.json()])
      setCommittee(dataC)
      setMembersList(dataM.members || [])
      setVolunteersList(dataV.volunteers || [])
      setDistrictsMap(dataOpt.districts || {})
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- Committee Handlers ---
  const handleOpenEdit = () => {
    setEditForm({ name: committee.name, type: committee.type, purpose: committee.purpose || '', isArchived: committee.isArchived })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    let finalName = editForm.name
    if (editForm.type === 'GOVERNING_BOARD') finalName = 'Governing Board'
    if (editForm.type === 'EXECUTIVE_TEAM') finalName = 'Executive Team'

    try {
      const res = await fetch(`/api/committees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, name: finalName })
      })
      if (!res.ok) throw new Error('Failed to update committee')
      setEditOpen(false)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteCommittee = async () => {
    if (!confirm('Are you sure you want to completely delete this committee? This action cannot be undone.')) return
    try {
      const res = await fetch(`/api/committees/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete committee')
      }
      router.push('/admin/committees')
    } catch (err: any) {
      alert(err.message)
    }
  }

  // --- Member Handlers ---
  const handleOpenMember = (item: any = null) => {
    if (item) {
      setEditingMember(item)
      setMemberForm({ 
        memberId: item.memberId || '', 
        volunteerId: item.volunteerId || '',
        designation: item.designation || '', 
        district: item.district || '',
        role: item.role, 
        termStart: item.termStart ? dayjs(item.termStart).format('YYYY-MM-DD') : '', 
        termEnd: item.termEnd ? dayjs(item.termEnd).format('YYYY-MM-DD') : '',
        isActive: item.isActive
      })
      // If editing an existing item with a district, try to guess the state (optional)
    } else {
      setEditingMember(null)
      setSelectedState('')
      setMemberForm({ memberId: '', volunteerId: '', designation: '', district: '', role: 'MEMBER', termStart: '', termEnd: '', isActive: true })
    }
    setMemberOpen(true)
  }

  const handleSaveMember = async () => {
    try {
      const url = editingMember ? `/api/committees/${id}/members/${editingMember.id}` : `/api/committees/${id}/members`
      const method = editingMember ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberForm)
      })
      if (!res.ok) throw new Error('Failed to save member')
      setMemberOpen(false)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    try {
      const res = await fetch(`/api/committees/${id}/members/${memberId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) return <Box p={3}><CircularProgress /></Box>
  if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>
  if (!committee) return null

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3} gap={2}>
        <IconButton onClick={() => router.push('/admin/committees')}><ArrowBackIcon /></IconButton>
        <Typography variant="h4" component="h1">{committee.name}</Typography>
        <Chip label={committee.type} variant="outlined" />
        {committee.isArchived && <Chip label="Archived" color="error" />}
        <Box flexGrow={1} />
        <Button startIcon={<EditIcon />} variant="outlined" size="small" onClick={handleOpenEdit} sx={{ mr: 1 }}>
          Edit Details
        </Button>
        <Button startIcon={<DeleteIcon />} variant="outlined" color="error" size="small" onClick={handleDeleteCommittee}>
          Delete
        </Button>
      </Box>
      <Typography variant="body1" color="text.secondary" mb={4}>{committee.purpose}</Typography>

      <Card>
        <CardHeader
          title="Committee Members"
          action={
            <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => handleOpenMember()}>
              Add Member
            </Button>
          }
        />
        <Divider />
        <List>
          {committee.members?.length === 0 && <ListItem><ListItemText secondary="No members in this committee yet." /></ListItem>}
          {committee.members?.map((item: any) => {
            const name = item.member?.name || item.volunteer?.name || 'Unknown'
            const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
            return (
              <ListItem
                key={item.id}
                divider
                secondaryAction={
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenMember(item)}><EditIcon /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteMember(item.id)}><DeleteIcon /></IconButton>
                  </Box>
                }
              >
                <Avatar sx={{ mr: 2, bgcolor: item.isActive ? 'primary.main' : 'grey.400' }}>{initials}</Avatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography fontWeight={500}>{name}</Typography>
                      {!item.isActive && <Chip size="small" label="Inactive" color="default" />}
                    </Box>
                  }
                  secondary={
                    <Box display="flex" flexDirection="column" gap={0.5} mt={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        {item.role.replace('_', ' ')} {item.designation ? `— ${item.designation}` : ''}
                        {item.district && <><br/>District: {item.district}</>}
                      </Typography>
                      {(item.termStart || item.termEnd) && (
                        <Typography variant="caption" color="text.secondary">
                          Term: {item.termStart ? dayjs(item.termStart).format('MMM D, YYYY') : 'N/A'} - {item.termEnd ? dayjs(item.termEnd).format('MMM D, YYYY') : 'Present'}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            )
          })}
        </List>
      </Card>

      {/* Member Dialog */}
      <Dialog open={memberOpen} onClose={() => setMemberOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingMember ? 'Edit Member' : 'Add Member'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            {!editingMember && (
              <Box display="flex" gap={2}>
                <FormControl fullWidth>
                  <InputLabel>Link Member</InputLabel>
                  <Select 
                    label="Link Member" 
                    value={memberForm.memberId} 
                    onChange={(e) => setMemberForm({ ...memberForm, memberId: e.target.value, volunteerId: '' })}
                    disabled={!!memberForm.volunteerId}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {membersList.map(m => <MenuItem key={m.id} value={m.id}>{m.name} ({m.memberNumber})</MenuItem>)}
                  </Select>
                </FormControl>
                <Typography variant="body2" sx={{ alignSelf: 'center' }}>OR</Typography>
                <FormControl fullWidth>
                  <InputLabel>Link Volunteer</InputLabel>
                  <Select 
                    label="Link Volunteer" 
                    value={memberForm.volunteerId} 
                    onChange={(e) => setMemberForm({ ...memberForm, volunteerId: e.target.value, memberId: '' })}
                    disabled={!!memberForm.memberId}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {volunteersList.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            )}

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={memberForm.role} label="Role" onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}>
                <MenuItem value="EXECUTIVE_LEADER">Executive Leader</MenuItem>
                <MenuItem value="CHAIRPERSON">Chairperson</MenuItem>
                <MenuItem value="HEAD_OF_DEPARTMENT">Head of Department</MenuItem>
                <MenuItem value="DISTRICT_REPRESENTATIVE">District Representative</MenuItem>
                <MenuItem value="SECRETARY">Secretary</MenuItem>
                <MenuItem value="TREASURER">Treasurer</MenuItem>
                <MenuItem value="MEMBER">Member</MenuItem>
                <MenuItem value="ADVISOR">Advisor</MenuItem>
              </Select>
            </FormControl>

            {memberForm.role === 'DISTRICT_REPRESENTATIVE' && (
              <Box display="flex" gap={2}>
                <FormControl fullWidth>
                  <InputLabel>State</InputLabel>
                  <Select 
                    value={selectedState} 
                    label="State"
                    onChange={(e) => {
                      setSelectedState(e.target.value)
                      setMemberForm(prev => ({ ...prev, district: '' }))
                    }}
                  >
                    {Object.keys(districtsMap).map(state => (
                      <MenuItem key={state} value={state}>{state}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth disabled={!selectedState}>
                  <InputLabel>District</InputLabel>
                  <Select 
                    value={memberForm.district} 
                    label="District"
                    onChange={(e) => setMemberForm(prev => ({ ...prev, district: e.target.value }))}
                  >
                    {(districtsMap[selectedState] || []).map(district => (
                      <MenuItem key={district} value={district}>{district}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            <TextField label="Designation (Optional)" fullWidth value={memberForm.designation} onChange={(e) => setMemberForm({ ...memberForm, designation: e.target.value })} />
            
            <Box display="flex" gap={2}>
              <TextField label="Term Start" type="date" fullWidth InputLabelProps={{ shrink: true }} value={memberForm.termStart} onChange={(e) => setMemberForm({ ...memberForm, termStart: e.target.value })} />
              <TextField label="Term End" type="date" fullWidth InputLabelProps={{ shrink: true }} value={memberForm.termEnd} onChange={(e) => setMemberForm({ ...memberForm, termEnd: e.target.value })} />
            </Box>

            {editingMember && (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={memberForm.isActive ? 'ACTIVE' : 'INACTIVE'} label="Status" onChange={(e) => setMemberForm({ ...memberForm, isActive: e.target.value === 'ACTIVE' })}>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemberOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveMember} disabled={!editingMember && !memberForm.memberId && !memberForm.volunteerId}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Committee Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Committee Details</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                <MenuItem value="GOVERNING_BOARD">Governing Board</MenuItem>
                <MenuItem value="EXECUTIVE_TEAM">Executive Team</MenuItem>
                <MenuItem value="DEPARTMENT">Department</MenuItem>
              </Select>
            </FormControl>
            {(editForm.type !== 'GOVERNING_BOARD' && editForm.type !== 'EXECUTIVE_TEAM') && (
              <TextField label="Name" fullWidth value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            )}
            <TextField label="Purpose / Description" fullWidth multiline rows={3} value={editForm.purpose} onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={editForm.isArchived ? 'ARCHIVED' : 'ACTIVE'} onChange={(e) => setEditForm({ ...editForm, isArchived: e.target.value === 'ARCHIVED' })}>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="ARCHIVED">Archived</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
