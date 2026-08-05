'use client'

import { createTheme } from '@mui/material/styles'
import type {} from '@mui/x-data-grid/themeAugmentation'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#12446A',       // Navy from Logo
      light: '#3D688C',
      dark: '#0A2B45',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#43A047',       // Kept Green for success/actions
      light: '#76D275',
      dark: '#2E7D32',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F4F7F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#15202B',
      secondary: '#5C6B74',
    },
    divider: '#E1E6EB',
    grey: {
      50: '#F4F7F9',
      100: '#EBEEF2',
      200: '#D6DEE5',
      300: '#B0C0CC',
      400: '#8AA0B3',
      500: '#5C6B74',
    },
    error: { main: '#D32F2F' },
    warning: { main: '#F57C00' },
    info: { main: '#0288D1' },
    success: { main: '#388E3C' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h2: { fontSize: '1.5rem', fontWeight: 600 },
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    h4: { fontSize: '1.125rem', fontWeight: 600 },
    h5: { fontSize: '1rem', fontWeight: 600 },
    h6: { fontSize: '0.875rem', fontWeight: 600 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', color: '#5C6B74' },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.05)',
    '0 1px 4px rgba(0,0,0,0.08)',
    '0 2px 8px rgba(0,0,0,0.08)',
    '0 4px 12px rgba(0,0,0,0.08)',
    '0 4px 16px rgba(0,0,0,0.1)',
    '0 6px 20px rgba(0,0,0,0.1)',
    '0 8px 24px rgba(0,0,0,0.1)',
    '0 8px 28px rgba(0,0,0,0.12)',
    '0 10px 32px rgba(0,0,0,0.12)',
    '0 12px 36px rgba(0,0,0,0.12)',
    '0 14px 40px rgba(0,0,0,0.14)',
    '0 16px 44px rgba(0,0,0,0.14)',
    '0 18px 48px rgba(0,0,0,0.14)',
    '0 20px 52px rgba(0,0,0,0.16)',
    '0 22px 56px rgba(0,0,0,0.16)',
    '0 24px 60px rgba(0,0,0,0.16)',
    '0 26px 64px rgba(0,0,0,0.18)',
    '0 28px 68px rgba(0,0,0,0.18)',
    '0 30px 72px rgba(0,0,0,0.18)',
    '0 32px 76px rgba(0,0,0,0.2)',
    '0 34px 80px rgba(0,0,0,0.2)',
    '0 36px 84px rgba(0,0,0,0.2)',
    '0 38px 88px rgba(0,0,0,0.22)',
    '0 40px 92px rgba(0,0,0,0.22)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 6,
          padding: '7px 18px',
        },
        contained: {
          boxShadow: '0 1px 4px rgba(18,68,106,0.18)',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(18,68,106,0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: '1px solid #E1E6EB',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#EBEEF2',
            fontWeight: 600,
            fontSize: '0.8125rem',
            color: '#15202B',
            borderBottom: '2px solid #D6DEE5',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #E1E6EB',
          padding: '10px 16px',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#FAFCFD',
          borderRight: '1px solid #E1E6EB',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: '1px 8px',
          '&.Mui-selected': {
            backgroundColor: '#E7F0F7',
            color: '#12446A',
            '& .MuiListItemIcon-root': { color: '#12446A' },
            '&:hover': { backgroundColor: '#CBE0F0' },
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 12 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: '1px solid #E1E6EB',
          borderRadius: 10,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#EBEEF2',
            borderBottom: '2px solid #D6DEE5',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
            fontSize: '0.8125rem',
          },
          '& .MuiDataGrid-cell': {
            display: 'flex',
            alignItems: 'center',
          },
          '& .MuiDataGrid-cell--textRight': {
            justifyContent: 'flex-end',
          },
          '& .MuiDataGrid-cell--textCenter': {
            justifyContent: 'center',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: '#F0F5F9',
          },
        },
      },
    },
  },
})

export default theme
