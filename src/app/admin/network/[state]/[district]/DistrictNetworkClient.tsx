'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  IconButton,
  Divider,
  Chip,
  Tooltip,
  Paper,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LocationCityIcon from '@mui/icons-material/LocationCity'
import SecurityIcon from '@mui/icons-material/Security'
import PeopleIcon from '@mui/icons-material/People'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DistrictNetworkClient({ state, district }: { state: string; district: string }) {
  const router = useRouter()
  
  const [tab, setTab] = useState<number>(0)
  const [representatives, setRepresentatives] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [volunteers, setVolunteers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [memberSearch, setMemberSearch] = useState('')
  const [volunteerSearch, setVolunteerSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resC, resM, resV] = await Promise.all([
        fetch('/api/committees'),
        fetch(`/api/members?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&pageSize=500`),
        fetch(`/api/volunteers?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&pageSize=500`),
      ])
      
      const dataC = await resC.json()
      const dataM = await resM.json()
      const dataV = await resV.json()

      // Find the Executive Team and get district representatives for this district
      const execTeam = Array.isArray(dataC) ? dataC.find((c: any) => c.type === 'EXECUTIVE_TEAM') : null
      if (execTeam && Array.isArray(execTeam.members)) {
        const reps = execTeam.members.filter((m: any) => m.district && m.district.toLowerCase() === district.toLowerCase())
        setRepresentatives(reps)
      }

      setMembers(dataM.members || [])
      setVolunteers(dataV.volunteers || [])
    } catch (err) {
      console.error('Failed to fetch district network data:', err)
    } finally {
      setLoading(false)
    }
  }, [state, district])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filtered members & volunteers
  const filteredMembers = members.filter((m) => {
    if (!memberSearch) return true
    const q = memberSearch.toLowerCase()
    return (
      m.name?.toLowerCase().includes(q) ||
      m.memberNumber?.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    )
  })

  const filteredVolunteers = volunteers.filter((v) => {
    if (!volunteerSearch) return true
    const q = volunteerSearch.toLowerCase()
    return (
      v.name?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      v.phone?.toLowerCase().includes(q) ||
      v.currentStage?.toLowerCase().includes(q)
    )
  })

  const activeVolunteersCount = volunteers.filter((v) => !v.isSuspended).length

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => router.push(`/admin/locations`)} sx={{ bgcolor: 'white', border: '1px solid #E2E8F0' }}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar sx={{ bgcolor: '#12446A', width: 48, height: 48 }}>
          <LocationCityIcon />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#12446A', letterSpacing: '-0.02em' }}>
            {district} District
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
            State of {state} — Regional Operations & Member Management
          </Typography>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* KPI Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }} alignItems="stretch">
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                District Members
              </Typography>
              <PeopleIcon sx={{ color: '#12446A' }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#12446A">
              {members.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              Registered in {district}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #BBF7D0', bgcolor: '#F0FDF4', height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="caption" color="#166534" fontWeight={700}>
                District Volunteers
              </Typography>
              <VolunteerActivismIcon sx={{ color: '#16A34A' }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#15803D">
              {volunteers.length}
            </Typography>
            <Typography variant="caption" color="#166534" display="block" sx={{ mt: 0.5 }}>
              Active in pipeline ({activeVolunteersCount} active)
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                District Leadership
              </Typography>
              <SecurityIcon sx={{ color: '#0284C7' }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#0369A1">
              {representatives.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              Executive Representatives
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Active Ratio
              </Typography>
              <CheckCircleIcon sx={{ color: '#D97706' }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#B45309">
              {members.length + volunteers.length > 0
                ? `${Math.round((activeVolunteersCount / (members.length + volunteers.length)) * 100)}%`
                : '0%'}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              Engagement percentage
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* District Leadership Cards Section */}
      {representatives.length > 0 && (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', mb: 3, bgcolor: '#FAF5FF' }}>
          <Typography variant="subtitle1" fontWeight={700} color="#6B21A8" sx={{ mb: 1.5 }}>
            District Leadership Representatives
          </Typography>
          <Grid container spacing={2}>
            {representatives.map((rep) => {
              const name = rep.member?.name || rep.volunteer?.name || 'Unknown Leader'
              return (
                <Grid item xs={12} sm={6} md={4} key={rep.id}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                      <Avatar sx={{ bgcolor: '#8B5CF6' }}>
                        <SecurityIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {rep.designation || 'District Representative'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        </Paper>
      )}

      {/* 2 Navigation Tabs */}
      <Paper elevation={0} sx={{ borderBottom: '1px solid #E2E8F0', bgcolor: 'transparent', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, val) => setTab(val)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'text.secondary',
              '&.Mui-selected': {
                color: '#12446A',
              },
            },
            '& .MuiTabs-indicator': {
              bgcolor: '#12446A',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab icon={<PeopleIcon fontSize="small" />} iconPosition="start" label={`District Members (${members.length})`} />
          <Tab icon={<VolunteerActivismIcon fontSize="small" />} iconPosition="start" label={`District Volunteers (${volunteers.length})`} />
        </Tabs>
      </Paper>

      {/* ─── TAB 0: MEMBERS LIST ─── */}
      {tab === 0 && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E1E6EB' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
            <Typography variant="h6" fontWeight={700} color="#12446A">
              Registered Members in {district} ({filteredMembers.length})
            </Typography>

            <TextField
              size="small"
              placeholder="Search member by name, number..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 280 }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Member No.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Member Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Contact Info</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Membership Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      No registered members found in {district} district.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((m) => (
                    <TableRow key={m.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#12446A' }}>
                        {m.memberNumber || 'N/A'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#12446A', fontSize: '0.85rem' }}>
                            {m.name ? m.name.charAt(0).toUpperCase() : 'M'}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>
                            {m.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {m.phone && <Box>{m.phone}</Box>}
                        {m.email && <Box color="text.secondary">{m.email}</Box>}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={m.membershipType || 'GENERAL'}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={m.status || 'ACTIVE'}
                          size="small"
                          color={m.status === 'INACTIVE' ? 'default' : 'success'}
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon fontSize="small" />}
                          onClick={() => router.push(`/admin/members`)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ─── TAB 1: VOLUNTEERS LIST ─── */}
      {tab === 1 && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E1E6EB' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
            <Typography variant="h6" fontWeight={700} color="#12446A">
              Registered Volunteers in {district} ({filteredVolunteers.length})
            </Typography>

            <TextField
              size="small"
              placeholder="Search volunteer by name, stage..."
              value={volunteerSearch}
              onChange={(e) => setVolunteerSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 280 }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Volunteer Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Contact Info</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Pipeline Stage</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVolunteers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      No volunteers assigned to {district} district.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVolunteers.map((v) => (
                    <TableRow key={v.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#16A34A', fontSize: '0.85rem' }}>
                            {v.name ? v.name.charAt(0).toUpperCase() : 'V'}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>
                            {v.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {v.phone && <Box>{v.phone}</Box>}
                        {v.email && <Box color="text.secondary">{v.email}</Box>}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={v.currentStage || 'REGISTERED'}
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        {v.isSuspended ? (
                          <Chip label="Suspended" size="small" color="error" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                        ) : (
                          <Chip label="Active" size="small" color="success" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon fontSize="small" />}
                          onClick={() => router.push(`/admin/volunteers/${v.id}`)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          View Pipeline Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  )
}
