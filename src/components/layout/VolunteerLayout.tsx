'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import EventIcon from '@mui/icons-material/Event'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PersonIcon from '@mui/icons-material/Person'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import FavoriteIcon from '@mui/icons-material/Favorite'

const NAV_ITEMS = [
  { label: 'Home', icon: <HomeIcon />, href: '/volunteer/dashboard' },
  { label: 'My Events', icon: <EventIcon />, href: '/volunteer/events' },
  { label: 'Hours Log', icon: <AccessTimeIcon />, href: '/volunteer/hours' },
  { label: 'My Profile', icon: <PersonIcon />, href: '/volunteer/profile' },
]

export default function VolunteerLayout({ children, session, logo }: { children: React.ReactNode, session: any, logo?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {isMobile && (
            <IconButton onClick={() => setMobileOpen(true)} edge="start" sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}

          {/* Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 3 }}>
            {logo ? (
              <Box
                component="img"
                src={logo}
                alt="Logo"
                sx={{
                  height: 48,
                  objectFit: 'contain',
                }}
              />
            ) : (
              <>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00897B, #43A047)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FavoriteIcon sx={{ fontSize: 14, color: 'white' }} />
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                  FMF Volunteers
                </Typography>
              </>
            )}
          </Box>

          {/* Desktop Nav */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 0.5, flex: 1 }}>
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    startIcon={item.icon}
                    size="small"
                    sx={{
                      textTransform: 'none',
                      color: isActive ? 'primary.main' : 'text.secondary',
                      fontWeight: isActive ? 600 : 400,
                      borderBottom: isActive ? '2px solid' : '2px solid transparent',
                      borderRadius: 0,
                      pb: 0.25,
                    }}
                  >
                    {item.label}
                  </Button>
                )
              })}
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* User Avatar */}
          <IconButton
            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            sx={{ p: 0.5 }}
          >
            <Avatar
              sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.875rem' }}
            >
              {session?.user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={() => setUserMenuAnchor(null)}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                {session?.user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {session?.user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { router.push('/volunteer/profile'); setUserMenuAnchor(null) }}>
              <PersonIcon fontSize="small" sx={{ mr: 1 }} /> My Profile
            </MenuItem>
            <MenuItem onClick={() => signOut({ callbackUrl: '/auth/login' })}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Sign Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 240 } }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body1" fontWeight={700} color="primary.dark">
            FMF Volunteers
          </Typography>
        </Box>
        <List>
          {NAV_ITEMS.map((item) => (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                onClick={() => { router.push(item.href); setMobileOpen(false) }}
                selected={pathname === item.href}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider />
          <ListItem disablePadding>
            <ListItemButton onClick={() => signOut({ callbackUrl: '/auth/login' })}>
              <ListItemIcon sx={{ minWidth: 36 }}><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Sign Out" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Page Content */}
      <Box
        component="main"
        sx={{ flex: 1, p: { xs: 2, sm: 3 }, bgcolor: 'background.default', maxWidth: 1200, mx: 'auto', width: '100%' }}
      >
        {children}
      </Box>
    </Box>
  )
}
