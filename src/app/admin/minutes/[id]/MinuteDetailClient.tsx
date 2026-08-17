'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Button, Typography, Card, CardContent, CardHeader,
  Grid, TextField, CircularProgress, Alert, IconButton,
  List, ListItem, ListItemText, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
  Chip
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import dayjs from 'dayjs'

export default function MinuteDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const [minute, setMinute] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Agenda Dialog State
  const [agendaOpen, setAgendaOpen] = useState(false)
  const [editingAgenda, setEditingAgenda] = useState<any>(null)
  const [agendaForm, setAgendaForm] = useState({ title: '', orderIndex: 1, notes: '', decisions: '' })

  // Action Item Dialog State
  const [actionOpen, setActionOpen] = useState(false)
  const [editingAction, setEditingAction] = useState<any>(null)
  const [actionForm, setActionForm] = useState({ description: '', ownerName: '', dueDate: '', status: 'OPEN' })

  // Addendum Dialog State
  const [addendumOpen, setAddendumOpen] = useState(false)
  const [editingAddendum, setEditingAddendum] = useState<any>(null)
  const [addendumForm, setAddendumForm] = useState({ content: '' })

  const fetchMinute = useCallback(async () => {
    try {
      const res = await fetch(`/api/minutes/${id}`)
      if (!res.ok) throw new Error('Failed to fetch minute')
      const data = await res.json()
      setMinute(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchMinute()
  }, [fetchMinute])

  const isFinalized = minute?.status === 'FINALIZED'

  // --- Agenda Handlers ---
  const handleOpenAgenda = (item: any = null) => {
    if (item) {
      setEditingAgenda(item)
      setAgendaForm({ title: item.title, orderIndex: item.orderIndex, notes: item.notes || '', decisions: item.decisions || '' })
    } else {
      setEditingAgenda(null)
      const nextIndex = minute?.agendaItems?.length ? Math.max(...minute.agendaItems.map((a: any) => a.orderIndex)) + 1 : 1
      setAgendaForm({ title: '', orderIndex: nextIndex, notes: '', decisions: '' })
    }
    setAgendaOpen(true)
  }

  const handleSaveAgenda = async () => {
    try {
      const url = editingAgenda ? `/api/minutes/${id}/agenda/${editingAgenda.id}` : `/api/minutes/${id}/agenda`
      const method = editingAgenda ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agendaForm)
      })
      if (!res.ok) throw new Error('Failed to save agenda item')
      setAgendaOpen(false)
      fetchMinute()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteAgenda = async (agendaId: string) => {
    if (!confirm('Are you sure you want to delete this agenda item?')) return
    try {
      const res = await fetch(`/api/minutes/${id}/agenda/${agendaId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      fetchMinute()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // --- Action Item Handlers ---
  const handleOpenAction = (item: any = null) => {
    if (item) {
      setEditingAction(item)
      setActionForm({
        description: item.description,
        ownerName: item.ownerName,
        dueDate: item.dueDate ? dayjs(item.dueDate).format('YYYY-MM-DD') : '',
        status: item.status
      })
    } else {
      setEditingAction(null)
      setActionForm({ description: '', ownerName: '', dueDate: '', status: 'OPEN' })
    }
    setActionOpen(true)
  }

  const handleSaveAction = async () => {
    try {
      const url = editingAction ? `/api/minutes/${id}/action-items/${editingAction.id}` : `/api/minutes/${id}/action-items`
      const method = editingAction ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionForm)
      })
      if (!res.ok) throw new Error('Failed to save action item')
      setActionOpen(false)
      fetchMinute()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteAction = async (actionId: string) => {
    if (!confirm('Are you sure you want to delete this action item?')) return
    try {
      const res = await fetch(`/api/minutes/${id}/action-items/${actionId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      fetchMinute()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // --- Addendum Handlers ---
  const handleOpenAddendum = (item: any = null) => {
    if (item) {
      setEditingAddendum(item)
      setAddendumForm({ content: item.content })
    } else {
      setEditingAddendum(null)
      setAddendumForm({ content: '' })
    }
    setAddendumOpen(true)
  }

  const handleSaveAddendum = async () => {
    try {
      const url = editingAddendum ? `/api/minutes/${id}/addendums/${editingAddendum.id}` : `/api/minutes/${id}/addendums`
      const method = editingAddendum ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addendumForm)
      })
      if (!res.ok) throw new Error('Failed to save addendum')
      setAddendumOpen(false)
      fetchMinute()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteAddendum = async (addendumId: string) => {
    if (!confirm('Are you sure you want to delete this addendum?')) return
    try {
      const res = await fetch(`/api/minutes/${id}/addendums/${addendumId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      fetchMinute()
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) return <Box p={3}><CircularProgress /></Box>
  if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>
  if (!minute) return null

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3} gap={2}>
        <IconButton onClick={() => router.push('/admin/minutes')}><ArrowBackIcon /></IconButton>
        <Typography variant="h4" component="h1">{minute.title}</Typography>
        <Chip label={minute.status} color={minute.status === 'FINALIZED' ? 'success' : 'warning'} />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Agenda Items"
              action={
                !isFinalized && (
                  <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => handleOpenAgenda()}>
                    Add
                  </Button>
                )
              }
            />
            <Divider />
            <List>
              {minute.agendaItems?.length === 0 && <ListItem><ListItemText secondary="No agenda items yet." /></ListItem>}
              {minute.agendaItems?.map((item: any) => (
                <ListItem
                  key={item.id}
                  divider
                  secondaryAction={
                    !isFinalized && (
                      <Box>
                        <IconButton size="small" onClick={() => handleOpenAgenda(item)}><EditIcon /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteAgenda(item.id)}><DeleteIcon /></IconButton>
                      </Box>
                    )
                  }
                >
                  <ListItemText
                    primary={`${item.orderIndex}. ${item.title}`}
                    secondary={
                      <>
                        {item.notes && <Typography variant="body2" color="text.secondary">Notes: {item.notes}</Typography>}
                        {item.decisions && <Typography variant="body2" color="primary">Decisions: {item.decisions}</Typography>}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Action Items"
              action={
                !isFinalized && (
                  <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => handleOpenAction()}>
                    Add
                  </Button>
                )
              }
            />
            <Divider />
            <List>
              {minute.actionItems?.length === 0 && <ListItem><ListItemText secondary="No action items yet." /></ListItem>}
              {minute.actionItems?.map((item: any) => (
                <ListItem
                  key={item.id}
                  divider
                  secondaryAction={
                    !isFinalized && (
                      <Box>
                        <IconButton size="small" onClick={() => handleOpenAction(item)}><EditIcon /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteAction(item.id)}><DeleteIcon /></IconButton>
                      </Box>
                    )
                  }
                >
                  <ListItemText
                    primary={item.description}
                    secondary={
                      <Box component="span" display="flex" gap={1} mt={1}>
                        <Chip size="small" label={item.ownerName} />
                        <Chip size="small" label={item.status} color={item.status === 'DONE' ? 'success' : 'default'} />
                        {item.dueDate && <Chip size="small" variant="outlined" label={`Due: ${dayjs(item.dueDate).format('MMM D, YYYY')}`} />}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>
      </Grid>

      <Box mt={3}>
        <Card>
          <CardHeader
            title="Addendums (Post-Meeting Notes)"
            action={
              <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => handleOpenAddendum()}>
                Add
              </Button>
            }
          />
          <Divider />
          <List>
            {minute.addendums?.length === 0 && <ListItem><ListItemText secondary="No addendums yet." /></ListItem>}
            {minute.addendums?.map((item: any) => (
              <ListItem
                key={item.id}
                divider
                secondaryAction={
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenAddendum(item)}><EditIcon /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteAddendum(item.id)}><DeleteIcon /></IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={item.content}
                  secondary={
                    <Box component="span" display="flex" gap={1} mt={1}>
                      <Chip size="small" label={`Added by: ${item.addedBy}`} />
                      <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                        {dayjs(item.addedAt).format('MMM D, YYYY h:mm A')}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Card>
      </Box>

      {/* Agenda Dialog */}
      <Dialog open={agendaOpen} onClose={() => setAgendaOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAgenda ? 'Edit Agenda Item' : 'Add Agenda Item'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField label="Order Index" type="number" fullWidth value={agendaForm.orderIndex} onChange={(e) => setAgendaForm({ ...agendaForm, orderIndex: Number(e.target.value) })} />
            <TextField label="Title" fullWidth required value={agendaForm.title} onChange={(e) => setAgendaForm({ ...agendaForm, title: e.target.value })} />
            <TextField label="Notes" fullWidth multiline rows={3} value={agendaForm.notes} onChange={(e) => setAgendaForm({ ...agendaForm, notes: e.target.value })} />
            <TextField label="Decisions" fullWidth multiline rows={2} value={agendaForm.decisions} onChange={(e) => setAgendaForm({ ...agendaForm, decisions: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAgendaOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAgenda} disabled={!agendaForm.title}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionOpen} onClose={() => setActionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAction ? 'Edit Action Item' : 'Add Action Item'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField label="Description" fullWidth multiline rows={2} required value={actionForm.description} onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })} />
            <TextField label="Owner Name" fullWidth required value={actionForm.ownerName} onChange={(e) => setActionForm({ ...actionForm, ownerName: e.target.value })} />
            <TextField label="Due Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={actionForm.dueDate} onChange={(e) => setActionForm({ ...actionForm, dueDate: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={actionForm.status} label="Status" onChange={(e) => setActionForm({ ...actionForm, status: e.target.value })}>
                <MenuItem value="OPEN">Open</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="DONE">Done</MenuItem>
                <MenuItem value="DEFERRED">Deferred</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAction} disabled={!actionForm.description || !actionForm.ownerName}>Save</Button>
        </DialogActions>
      </Dialog>
      {/* Addendum Dialog */}
      <Dialog open={addendumOpen} onClose={() => setAddendumOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAddendum ? 'Edit Addendum' : 'Add Addendum'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField label="Content" fullWidth multiline rows={4} required value={addendumForm.content} onChange={(e) => setAddendumForm({ ...addendumForm, content: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddendumOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAddendum} disabled={!addendumForm.content}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
