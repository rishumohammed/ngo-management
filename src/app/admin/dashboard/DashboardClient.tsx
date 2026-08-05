'use client'

import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  Stack,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import ReceiptIcon from '@mui/icons-material/Receipt'
import EventIcon from '@mui/icons-material/Event'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import GroupWorkIcon from '@mui/icons-material/GroupWork'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import dayjs from 'dayjs'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: string
  accent?: string
}

function KpiCard({ title, value, subtitle, icon, color, accent }: KpiCardProps) {
  return (
    <Card 
      sx={{ 
        height: '100%', 
        borderRadius: 3,
        border: '1px solid #E1E6EB',
        bgcolor: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          borderColor: color,
        }
      }}
    >
      
      <CardContent sx={{ p: 3, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography 
              variant="overline" 
              sx={{ 
                fontWeight: 700, 
                color: 'text.secondary', 
                letterSpacing: '0.1em',
                lineHeight: 1
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800, 
                mt: 1, 
                color: 'text.primary',
                letterSpacing: '-0.03em'
              }}
            >
              {value}
            </Typography>
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}15`,
              color: color,
              width: 52,
              height: 52,
              boxShadow: `0 4px 12px ${color}10`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {icon}
          </Avatar>
        </Box>
        
        <Box sx={{ mt: 'auto' }}>
          {subtitle && (
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500,
                color: 'text.secondary',
                mb: accent ? 1.5 : 0
              }}
            >
              {subtitle}
            </Typography>
          )}
          
          {accent && (
            <Box 
              sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                bgcolor: `${color}12`,
                color: color,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {accent}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}


export default function DashboardClient({ data }: { data: any }) {
  const {
    totalMembers,
    newMembersThisMonth,
    activeVolunteers,
    volunteerPipeline,
    donationsThisMonth,
    donationsThisQuarter,
    receiptsThisMonth,
    upcomingEvents,
    overdueActionItems,
    expiringTerms,
    recentActivity,
    eightyGExpiry,
    eightyGExpiringSoon,
    monthlyDonations,
  } = data

  const chartData = monthlyDonations.map((m: { month: string; total: number }) => ({
    month: dayjs(m.month + '-01').format('MMM'),
    amount: m.total,
  }))

  const pendingPipeline = volunteerPipeline.reduce(
    (sum: number, s: { _count: { currentStage: number } }) => sum + s._count.currentStage,
    0
  )

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: -0.5 }}>
          Admin Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Real-time metrics, donor analytics, volunteer pipeline, and governance compliance summary.
        </Typography>
      </Box>

      {/* Alerts */}
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {eightyGExpiringSoon && eightyGExpiry && (
          <Alert severity="warning" icon={<WarningAmberIcon />}>
            <strong>80G Certificate expiring soon</strong> — expires on{' '}
            {dayjs(eightyGExpiry).format('D MMMM YYYY')} (
            {dayjs(eightyGExpiry).diff(dayjs(), 'day')} days). Update in Settings.
          </Alert>
        )}
        {overdueActionItems > 0 && (
          <Alert severity="error">
            <strong>{overdueActionItems} overdue action item{overdueActionItems > 1 ? 's' : ''}</strong> from meeting minutes require attention.
          </Alert>
        )}
        {expiringTerms > 0 && (
          <Alert severity="info">
            <strong>{expiringTerms} committee member term{expiringTerms > 1 ? 's' : ''}</strong> expiring within the next 30 days.
          </Alert>
        )}
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            title="Active Members"
            value={totalMembers.toLocaleString()}
            subtitle={`+${newMembersThisMonth} this month`}
            icon={<PeopleIcon />}
            color="#00897B"
            accent={`${newMembersThisMonth} new member${newMembersThisMonth !== 1 ? 's' : ''} joined this month`}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            title="Active Volunteers"
            value={activeVolunteers.toLocaleString()}
            subtitle={`${pendingPipeline} in pipeline`}
            icon={<VolunteerActivismIcon />}
            color="#43A047"
            accent={`${pendingPipeline} awaiting approval`}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            title="Donations This Month"
            value={formatCurrency(donationsThisMonth.amount)}
            subtitle={`${donationsThisMonth.count} donations`}
            icon={<MonetizationOnIcon />}
            color="#F57C00"
            accent={`Quarter total: ${formatCurrency(donationsThisQuarter.amount)}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            title="80G Receipts Issued"
            value={receiptsThisMonth.toLocaleString()}
            subtitle="This month"
            icon={<ReceiptIcon />}
            color="#0288D1"
            accent={`${donationsThisMonth.count} donations recorded`}
          />
        </Grid>
      </Grid>

      {/* Charts + Lists Row */}
      <Grid container spacing={2.5}>
        {/* Donation Chart */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUpIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">Donations — Last 6 Months</Typography>
              </Box>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0ECEA" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v), 'Amount']}
                      contentStyle={{ borderRadius: 8, border: '1px solid #E0ECEA' }}
                    />
                    <Bar dataKey="amount" fill="#00897B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No donation data yet</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Events */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <EventIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">Upcoming Events</Typography>
              </Box>
              {upcomingEvents.length === 0 ? (
                <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>
                  No events in the next 7 days.
                </Typography>
              ) : (
                <List disablePadding>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {upcomingEvents.map((event: any, idx: number) => (
                    <Box key={event.id}>
                      <ListItem disablePadding sx={{ py: 1 }}>
                        <ListItemText
                          primary={event.name}
                          secondary={dayjs(event.startDate).format('D MMM, h:mm A')}
                          primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
                          secondaryTypographyProps={{ fontSize: '0.75rem' }}
                        />
                        <Chip
                          label={event.status}
                          size="small"
                          color={event.status === 'ONGOING' ? 'success' : 'default'}
                          sx={{ fontSize: '0.65rem' }}
                        />
                      </ListItem>
                      {idx < upcomingEvents.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Volunteer Pipeline */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <GroupWorkIcon sx={{ color: 'secondary.main' }} />
                <Typography variant="h6">Volunteer Pipeline</Typography>
              </Box>
              {volunteerPipeline.length === 0 ? (
                <Typography color="text.secondary" variant="body2">No pending applicants.</Typography>
              ) : (
                <Stack spacing={1}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {volunteerPipeline.map((s: any) => (
                    <Box key={s.currentStage} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {s.currentStage.replace(/_/g, ' ')}
                      </Typography>
                      <Chip label={s._count.currentStage} size="small" color="primary" variant="outlined" />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity Feed */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Recent Activity</Typography>
              {recentActivity.length === 0 ? (
                <Typography color="text.secondary" variant="body2">No recent activity.</Typography>
              ) : (
                <List disablePadding>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {recentActivity.map((log: any, idx: number) => (
                    <Box key={log.id}>
                      <ListItem disablePadding sx={{ py: 0.75 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                              <Chip label={log.action} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                              <Typography variant="body2" component="span">
                                {log.entity}{log.entityName ? `: ${log.entityName}` : ''}
                              </Typography>
                            </Box>
                          }
                          secondary={`${log.userName || 'System'} · ${formatDateTime(log.timestamp)}`}
                          secondaryTypographyProps={{ fontSize: '0.72rem' }}
                        />
                      </ListItem>
                      {idx < recentActivity.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
