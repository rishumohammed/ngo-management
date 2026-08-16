'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Box, Typography, Chip, Card, CardContent, CardHeader, Avatar,
  LinearProgress, Stack, Grid, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, ImageList, ImageListItem, ImageListItemBar, Divider
} from '@mui/material'
import EventIcon from '@mui/icons-material/Event'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhotoCamera from '@mui/icons-material/PhotoCamera'
import CollectionsIcon from '@mui/icons-material/Collections'
import { formatDate } from '@/lib/utils'
import dayjs from 'dayjs'


type Event = any

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  PLANNED: 'primary', ONGOING: 'warning', COMPLETED: 'success', CANCELLED: 'error',
}

export default function VolunteerEventsClient() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  // Gallery State
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchEvents = () => {
    fetch('/api/events?pageSize=100')
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setLoading(false) })
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleOpenGallery = (event: Event) => {
    setSelectedEvent(event)
    setGalleryOpen(true)
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedEvent) return
    const file = e.target.files[0]
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!uploadRes.ok) throw new Error('Image upload failed')
      const { path } = await uploadRes.json()
      
      const res = await fetch(`/api/events/${selectedEvent.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: path })
      })
      
      if (!res.ok) throw new Error('Failed to add image to event')
      
      const resData = await res.json()
      // Update selectedEvent images in state immediately
      setSelectedEvent({ ...selectedEvent, images: resData.images })
      fetchEvents() // refresh background list too
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const upcoming = events.filter(e => dayjs(e.startDate).isAfter(dayjs()))
  const past = events.filter(e => !dayjs(e.startDate).isAfter(dayjs()))

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>My Events</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Events you are assigned to
      </Typography>

      {loading && <LinearProgress />}

      {!loading && events.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <EventIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
          <Typography>You have no events assigned yet.</Typography>
        </Box>
      )}

      {upcoming.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Upcoming</Typography>
          <Grid container spacing={2}>
            {upcoming.map((event: Event) => (
              <Grid item xs={12} sm={6} key={event.id}>
                <Card>
                  <CardHeader
                    avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><EventIcon /></Avatar>}
                    title={event.name}
                    subheader={formatDate(event.startDate)}
                    action={<Chip label={event.status} size="small" color={STATUS_COLORS[event.status]} />}
                  />
                  <CardContent sx={{ pt: 0 }}>
                    {event.location && (
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                        <LocationOnIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">{event.location}</Typography>
                      </Stack>
                    )}
                    {event.assignments?.map((a: { role: string; taskDescription?: string; volunteer?: { name: string } }) => (
                      <Chip key={a.role} label={`Role: ${a.role}`} size="small" variant="outlined" />
                    ))}
                    <Box mt={2}>
                      <Button
                        size="small"
                        startIcon={<CollectionsIcon />}
                        variant="outlined"
                        onClick={() => handleOpenGallery(event)}
                      >
                        View Gallery
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {past.length > 0 && (
        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'text.secondary' }}>Past Events</Typography>
          <Grid container spacing={2}>
            {past.map((event: Event) => (
              <Grid item xs={12} sm={6} key={event.id}>
                <Card sx={{ opacity: 0.75 }}>
                  <CardHeader
                    avatar={<Avatar sx={{ bgcolor: 'grey.400' }}><EventIcon /></Avatar>}
                    title={event.name}
                    subheader={formatDate(event.startDate)}
                    action={<Chip label={event.status} size="small" />}
                  />
                  <CardContent sx={{ pt: 0 }}>
                    <Button
                      size="small"
                      startIcon={<CollectionsIcon />}
                      variant="outlined"
                      onClick={() => handleOpenGallery(event)}
                    >
                      View Gallery
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Gallery Dialog */}
      <Dialog open={galleryOpen} onClose={() => setGalleryOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Event Gallery: {selectedEvent?.name}</Typography>
          <Button
            component="label"
            variant="contained"
            startIcon={<PhotoCamera />}
            size="small"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
            <input
              type="file"
              hidden
              accept="image/*"
              ref={fileInputRef}
              onChange={handleUploadImage}
            />
          </Button>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {(!selectedEvent?.images || selectedEvent.images.length === 0) ? (
            <Box py={4} textAlign="center">
              <Typography color="text.secondary">No images uploaded for this event yet.</Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>Be the first to upload a photo!</Typography>
            </Box>
          ) : (
            <ImageList sx={{ width: '100%', height: 'auto' }} cols={3} rowHeight={200} gap={8}>
              {selectedEvent.images.map((img: any, index: number) => (
                <ImageListItem key={index}>
                  <img
                    src={img.url}
                    alt={`Event Image ${index + 1}`}
                    loading="lazy"
                    style={{ height: '100%', objectFit: 'cover' }}
                  />
                  <ImageListItemBar
                    title={img.uploadedBy}
                    subtitle={dayjs(img.uploadedAt).format('MMM D, YYYY h:mm A')}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGalleryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
