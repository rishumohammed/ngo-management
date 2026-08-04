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

  // Member Dialog State
  const [memberOpen, setMemberOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [memberForm, setMemberForm] = useState({ 
    memberId: '', volunteerId: '', designation: '', role: 'MEMBER', termStart: '', termEnd: '', isActive: true
  })

  const fetchData = useCallback(async () => {
    try {
      const [resC, resM, resV] = await Promise.all([
        fetch(`/api/committees/${id}`),
        fetch(`/api/members`),
        fetch(`/api/volunteers`)
      ])
      if (!resC.ok) throw new Error('Failed to fetch committee')
      
      const [dataC, dataM, dataV] = await Promise.all([resC.json(), resM.json(), resV.json()])
      setCommittee(dataC)
      setMembersList(dataM.members || [])
      setVolunteersList(dataV.volunteers || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- Member Handlers ---
  const handleOpenMember = (item: any = null) => {
    if (item) {
      setEditingMember(item)
      setMemberForm({ 
        memberId: item.memberId || '', 
        volunteerId: item.volunteerId || '',
        designation: item.designation || '', 
        role: item.role, 
        termStart: item.termStart ? dayjs(item.termStart).format('YYYY-MM-DD') : '', 
        termEnd: item.termEnd ? dayjs(item.termEnd).format('YYYY-MM-DD') : '',
        isActive: item.isActive
      })
    } else {
      setEditingMember(null)
      setMemberForm({ memberId: '', volunteerId: '', designation: '', role: 'MEMBER', termStart: '', termEnd: '', isActive: true })
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
                <MenuItem value="CHAIRPERSON">Chairperson</MenuItem>
                <MenuItem value="SECRETARY">Secretary</MenuItem>
                <MenuItem value="TREASURER">Treasurer</MenuItem>
                <MenuItem value="MEMBER">Member</MenuItem>
                <MenuItem value="ADVISOR">Advisor</MenuItem>
              </Select>
            </FormControl>

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
    </Box>
  )
}
