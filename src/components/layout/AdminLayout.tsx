'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Chip,
  useMediaQuery,
  useTheme,
  Badge,
  CircularProgress,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import ArticleIcon from '@mui/icons-material/Article'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import EventIcon from '@mui/icons-material/Event'
import SettingsIcon from '@mui/icons-material/Settings'
import SecurityIcon from '@mui/icons-material/Security'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout'
import FavoriteIcon from '@mui/icons-material/Favorite'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { ROLE_LABELS } from '@/lib/permissions'
import { can } from '@/lib/permissions'

const DRAWER_WIDTH = 248

interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
  module?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, href: '/admin/dashboard' },
  { label: 'Members', icon: <PeopleIcon />, href: '/admin/members', module: 'members' },
  { label: 'Volunteers', icon: <VolunteerActivismIcon />, href: '/admin/volunteers', module: 'volunteers' },
  { label: 'Donations & 80G', icon: <MonetizationOnIcon />, href: '/admin/donations', module: 'donations' },
  { label: 'Meeting Minutes', icon: <ArticleIcon />, href: '/admin/minutes', module: 'minutes' },
  { label: 'Organization Structure', icon: <AccountTreeIcon />, href: '/admin/committees', module: 'committees' },
  { label: 'Events', icon: <EventIcon />, href: '/admin/events', module: 'events' },
  { label: 'Locations', icon: <LocationOnIcon />, href: '/admin/locations', module: 'settings' },
  { label: 'Audit Log', icon: <SecurityIcon />, href: '/admin/audit', module: 'audit' },
  { label: 'Users', icon: <PeopleIcon />, href: '/admin/users', module: 'users' },
  { label: 'Settings', icon: <SettingsIcon />, href: '/admin/settings', module: 'settings' },
]

export default function AdminLayout({ children, session, logo }: { children: React.ReactNode, session: any, logo?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)

  const role = session?.user?.role || ''

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (!item.module) return true // Dashboard always visible
    return can(role, item.module as Parameters<typeof can>[1], 'read')
  })



  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <Box
        sx={{
          px: logo ? 1 : 2.5,
          py: logo ? 1 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: logo ? 'center' : 'flex-start',
          gap: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: logo ? 84 : 64,
        }}
      >
        {logo ? (
          <Box
            component="img"
            src={logo}
            alt="Logo"
            sx={{
              width: '100%',
              maxHeight: 72,
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
        ) : (
          <>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FavoriteIcon sx={{ fontSize: 18, color: 'white' }} />
            </Box>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: 'primary.dark', lineHeight: 1.2 }}
              >
                Free Mind
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1 }}>
                Foundation
              </Typography>
            </Box>
          </>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        <List dense disablePadding>
          {visibleNavItems.map((item) => {
            const isActive =
              item.href === '/admin/dashboard'
                ? pathname === '/admin/dashboard'
                : pathname.startsWith(item.href)

            return (
              <ListItem key={item.href} disablePadding>
                <ListItemButton
                  selected={isActive}
                  onClick={() => {
                    router.push(item.href)
                    setMobileOpen(false)
                  }}
                  sx={{ py: 1, px: 2 }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: isActive ? 'primary.dark' : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Box>


    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar — desktop */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Sidebar — mobile */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}
      >
        {/* Top AppBar */}
        <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Toolbar>
            {isMobile && (
              <IconButton
                onClick={() => setMobileOpen(true)}
                edge="start"
                sx={{ mr: 2, color: 'text.primary' }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, flexGrow: 1 }}>
              {isMobile ? 'FMF Management' : ''}
            </Typography>

            {/* User Info */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1,
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'grey.100' },
              }}
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {session?.user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              {!isMobile && (
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, lineHeight: 1.2, color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {session?.user?.name}
                  </Typography>
                  <Chip
                    label={ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
                    size="small"
                    sx={{ height: 16, fontSize: '0.65rem', mt: 0.25 }}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              )}
              <KeyboardArrowDownIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            </Box>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem
                onClick={() => {
                  setUserMenuAnchor(null)
                  signOut({ callbackUrl: '/auth/login' })
                }}
                sx={{ gap: 1 }}
              >
                <LogoutIcon fontSize="small" />
                Sign Out
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
