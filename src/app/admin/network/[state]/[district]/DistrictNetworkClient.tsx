'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Grid, Card, CardContent, Avatar, LinearProgress, IconButton,
  Divider, Chip, Tooltip,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LocationCityIcon from '@mui/icons-material/LocationCity'
import SecurityIcon from '@mui/icons-material/Security'
import PeopleIcon from '@mui/icons-material/People'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DistrictNetworkClient({ state, district }: { state: string, district: string }) {
  const router = useRouter()
  
  const [representatives, setRepresentatives] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [volunteers, setVolunteers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resC, resM, resV] = await Promise.all([
        fetch('/api/committees'),
        fetch(`/api/members?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&pageSize=100`),
        fetch(`/api/volunteers?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&pageSize=100`)
      ])
      
      const dataC = await resC.json()
      const dataM = await resM.json()
      const dataV = await resV.json()

      // Find the Executive Team and get district representatives for this district
      const execTeam = dataC.find((c: any) => c.type === 'EXECUTIVE_TEAM')
      if (execTeam) {
        const reps = execTeam.members.filter((m: any) => m.district === district)
        setRepresentatives(reps)
      }

      setMembers(dataM.members || [])
      setVolunteers(dataV.volunteers || [])

    } finally { setLoading(false) }
  }, [state, district])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => router.push(`/admin/network/${encodeURIComponent(state)}`)}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar sx={{ bgcolor: 'info.main', width: 48, height: 48 }}>
          <LocationCityIcon />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: -0.5 }}>
            {district}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {state} — Regional Operations Dashboard
          </Typography>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {/* District Representatives (From Executive Team) */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.dark' }}>
            District Leadership
          </Typography>
          <Grid container spacing={2}>
            {representatives.map(rep => {
              const name = rep.member?.name || rep.volunteer?.name || 'Unknown'
              return (
                <Grid item xs={12} sm={6} md={4} key={rep.id}>
                  <Card>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <SecurityIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>{name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {rep.designation || 'District Representative'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
            {!loading && representatives.length === 0 && (
              <Grid item xs={12}>
                <Typography color="text.secondary">No district representatives appointed yet. Assign them from the Executive Team.</Typography>
              </Grid>
            )}
          </Grid>
        </Grid>

        {/* Registered Members */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 2, color: 'primary.dark' }}>
            Members ({members.length})
          </Typography>
          <Card>
            <CardContent>
              {members.length > 0 ? (
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {members.map(m => (
                    <Box key={m.id} display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', fontSize: '0.875rem' }}>
                        {m.name.charAt(0)}
                      </Avatar>
                      <Box flexGrow={1}>
                        <Typography variant="body2" fontWeight={600}>
                          <Link href={`/admin/members`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {m.name}
                          </Link>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{m.memberNumber}</Typography>
                      </Box>
                      <Chip label={m.membershipType} size="small" variant="outlined" />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">No registered members in this district.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Volunteers */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 2, color: 'primary.dark' }}>
            Volunteers ({volunteers.length})
          </Typography>
          <Card>
            <CardContent>
              {volunteers.length > 0 ? (
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {volunteers.map(v => (
                    <Box key={v.id} display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'warning.light', fontSize: '0.875rem' }}>
                        {v.name.charAt(0)}
                      </Avatar>
                      <Box flexGrow={1}>
                        <Typography variant="body2" fontWeight={600}>
                          <Link href={`/admin/volunteers/${v.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {v.name}
                          </Link>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{v.currentStage}</Typography>
                      </Box>
                      {v.isSuspended ? (
                        <Chip label="Suspended" size="small" color="error" />
                      ) : (
                        <Chip label="Active" size="small" color="success" variant="outlined" />
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">No volunteers assigned to this district.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  )
}
