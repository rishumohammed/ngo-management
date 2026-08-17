'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Grid, Card, CardActionArea, Avatar, LinearProgress, IconButton
} from '@mui/material'
import MapIcon from '@mui/icons-material/Map'
import LocationCityIcon from '@mui/icons-material/LocationCity'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useRouter } from 'next/navigation'

export default function StateNetworkClient({ state }: { state: string }) {
  const router = useRouter()
  const [districts, setDistricts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const resOpt = await fetch(`/api/public/form-options`)
      const dataOpt = await resOpt.json()
      setDistricts(dataOpt.districts?.[state] || [])
    } finally { setLoading(false) }
  }, [state])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => router.push('/admin/committees')}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
          <MapIcon />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: -0.5 }}>
            {state}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            State Network Overview
          </Typography>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.dark' }}>
        Districts ({districts.length})
      </Typography>
      <Grid container spacing={3}>
        {districts.map(district => (
          <Grid item xs={12} sm={6} md={4} key={district}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea 
                sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                onClick={() => router.push(`/admin/network/${encodeURIComponent(state)}/${encodeURIComponent(district)}`)}
              >
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <LocationCityIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>{district}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage district members & volunteers
                    </Typography>
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {!loading && districts.length === 0 && (
        <Typography color="text.secondary">No districts found for this state.</Typography>
      )}
    </Box>
  )
}
