'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Chip, TextField, Select, MenuItem, FormControl, InputLabel,
  InputAdornment, LinearProgress, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, TablePagination,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import SecurityIcon from '@mui/icons-material/Security'
import { formatDateTime } from '@/lib/utils'


type Log = any

const ACTION_COLORS: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  LOGIN: 'default',
  STAGE_CHANGE: 'warning',
  STATUS_CHANGE: 'info',
  PDF_GENERATED: 'default',
  EMAIL_SENT: 'default',
  INVITE_SENT: 'default',
}

export default function AuditClient() {
  const [logs, setLogs] = useState<Log[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [loading, setLoading] = useState(false)
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        pageSize: String(pageSize),
        entity,
        action,
      })
      const res = await fetch(`/api/audit?${params}`)
      const data = await res.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } finally { setLoading(false) }
  }, [page, pageSize, entity, action])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Entity</InputLabel>
          <Select label="Entity" value={entity} onChange={e => setEntity(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {['Member', 'Volunteer', 'Donation', 'MeetingMinute', 'Committee', 'Event', 'Settings', 'User'].map(e => (
              <MenuItem key={e} value={e}>{e}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Action</InputLabel>
          <Select label="Action" value={action} onChange={e => setAction(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'STAGE_CHANGE', 'STATUS_CHANGE', 'PDF_GENERATED', 'EMAIL_SENT'].map(a => (
              <MenuItem key={a} value={a}>{a}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 1 }} />}

      <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Record</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log: Log) => (
              <TableRow key={log.id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                  {formatDateTime(log.timestamp)}
                </TableCell>
                <TableCell sx={{ fontSize: '0.875rem' }}>{log.userName || 'System'}</TableCell>
                <TableCell>
                  <Chip
                    label={log.action}
                    size="small"
                    color={ACTION_COLORS[log.action] || 'default'}
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: '0.875rem' }}>{log.entity}</TableCell>
                <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                  {log.entityName || log.entityId || '—'}
                </TableCell>
              </TableRow>
            ))}
            {!loading && logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No audit logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={pageSize}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => { setPageSize(parseInt(e.target.value)); setPage(0) }}
        />
      </TableContainer>
    </Box>
  )
}
