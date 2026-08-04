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

export default function EventDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [volunteersList, setVolunteersList] = useState<any[]>([])

  // Assignment Dialog State
  const [assignmentOpen, setAssignmentOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<any>(null)
  const [assignmentForm, setAssignmentForm] = useState({ 
    volunteerId: '', role: 'PARTICIPANT', taskDescription: ''
  })

  const fetchData = useCallback(async () => {
    try {
      const [resE, resV] = await Promise.all([
        fetch(`/api/events/${id}`),
        fetch(`/api/volunteers`)
      ])
      if (!resE.ok) throw new Error('Failed to fetch event')
      
      const [dataE, dataV] = await Promise.all([resE.json(), resV.json()])
      setEvent(dataE)
      // Only approved volunteers can be assigned
      const approvedVolunteers = (dataV.volunteers || []).filter((v: any) => v.currentStage === 'APPROVED')
      setVolunteersList(approvedVolunteers)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- Assignment Handlers ---
  const handleOpenAssignment = (item: any = null) => {
    if (item) {
      setEditingAssignment(item)
      setAssignmentForm({ 
        volunteerId: item.volunteerId || '',
        role: item.role, 
        taskDescription: item.taskDescription || ''
      })
    } else {
      setEditingAssignment(null)
      setAssignmentForm({ volunteerId: '', role: 'PARTICIPANT', taskDescription: '' })
    }
    setAssignmentOpen(true)
  }

  const handleSaveAssignment = async () => {
    try {
      const url = editingAssignment ? `/api/events/${id}/assignments/${editingAssignment.id}` : `/api/events/${id}/assignments`
      const method = editingAssignment ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentForm)
      })
      if (!res.ok) throw new Error('Failed to save assignment')
      setAssignmentOpen(false)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return
    try {
      const res = await fetch(`/api/events/${id}/assignments/${assignmentId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) return <Box p={3}><CircularProgress /></Box>
  if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>
  if (!event) return null

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3} gap={2}>
        <IconButton onClick={() => router.push('/admin/events')}><ArrowBackIcon /></IconButton>
        <Typography variant="h4" component="h1">{event.name}</Typography>
        <Chip label={event.type} variant="outlined" />
        <Chip label={event.status} color={event.status === 'COMPLETED' ? 'success' : event.status === 'CANCELLED' ? 'error' : 'primary'} />
      </Box>
      <Typography variant="body1" color="text.secondary" mb={4}>{event.description}</Typography>

      <Card>
        <CardHeader
          title="Volunteer Assignments"
          action={
            <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => handleOpenAssignment()}>
              Assign Volunteer
            </Button>
          }
        />
        <Divider />
        <List>
          {event.assignments?.length === 0 && <ListItem><ListItemText secondary="No volunteers assigned yet." /></ListItem>}
          {event.assignments?.map((item: any) => {
            const name = item.volunteer?.name || 'Unknown'
            const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
            return (
              <ListItem
                key={item.id}
                divider
                secondaryAction={
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenAssignment(item)}><EditIcon /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteAssignment(item.id)}><DeleteIcon /></IconButton>
                  </Box>
                }
              >
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>{initials}</Avatar>
                <ListItemText
                  primary={<Typography fontWeight={500}>{name}</Typography>}
                  secondary={
                    <Box display="flex" flexDirection="column" gap={0.5} mt={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        Role: {item.role.replace('_', ' ')}
                      </Typography>
                      {item.taskDescription && (
                        <Typography variant="body2" color="text.secondary">
                          Task: {item.taskDescription}
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

      {/* Assignment Dialog */}
      <Dialog open={assignmentOpen} onClose={() => setAssignmentOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'Assign Volunteer'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            {!editingAssignment && (
              <FormControl fullWidth>
                <InputLabel>Select Volunteer</InputLabel>
                <Select 
                  label="Select Volunteer" 
                  value={assignmentForm.volunteerId} 
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, volunteerId: e.target.value })}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {volunteersList.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={assignmentForm.role} label="Role" onChange={(e) => setAssignmentForm({ ...assignmentForm, role: e.target.value })}>
                <MenuItem value="LEAD">Lead</MenuItem>
                <MenuItem value="SUPPORT">Support</MenuItem>
                <MenuItem value="COORDINATOR">Coordinator</MenuItem>
                <MenuItem value="PARTICIPANT">Participant</MenuItem>
              </Select>
            </FormControl>

            <TextField label="Task Description (Optional)" fullWidth multiline rows={3} value={assignmentForm.taskDescription} onChange={(e) => setAssignmentForm({ ...assignmentForm, taskDescription: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAssignment} disabled={!editingAssignment && !assignmentForm.volunteerId}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
