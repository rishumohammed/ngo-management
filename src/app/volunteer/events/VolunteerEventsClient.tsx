'use client'

import { useState, useEffect } from 'react'
import {
  Box, Typography, Chip, Card, CardContent, CardHeader, Avatar,
  LinearProgress, Stack, Grid,
} from '@mui/material'
import EventIcon from '@mui/icons-material/Event'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { formatDate } from '@/lib/utils'
import dayjs from 'dayjs'


type Event = any

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  PLANNED: 'primary', ONGOING: 'warning', COMPLETED: 'success', CANCELLED: 'error',
}

export default function VolunteerEventsClient() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/events?pageSize=100')
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setLoading(false) })
  }, [])

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
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  )
}
