'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box, Button, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton, Tooltip,
  InputAdornment, Grid, Alert, CircularProgress, Stack, FormControlLabel, Checkbox,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import EmailIcon from '@mui/icons-material/Email'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import { can } from '@/lib/permissions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { downloadCSV } from '@/lib/csv'

const PAYMENT_MODES = ['CASH', 'CHEQUE', 'NEFT', 'RTGS', 'IMPS', 'UPI', 'DEMAND_DRAFT', 'ONLINE']


type Donation = any

const emptyForm = {
  donorName: '', donorPhone: '', donorEmail: '', donorPan: '', donorAddress: '',
  amount: '', date: new Date().toISOString().split('T')[0],
  paymentMode: 'CASH', chequeNumber: '', bankName: '', purpose: '', tier: '', notes: '',
  emailReceipt: false,
}

export default function DonationsClient() {
  const { data: session } = useSession()
  const role = session?.user?.role || ''
  const canCreate = can(role, 'donations', 'create')

  const [donations, setDonations] = useState<Donation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [modeFilter, setModeFilter] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)
  const [emailLoading, setEmailLoading] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const fetchDonations = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page + 1), pageSize: String(pageSize), search, paymentMode: modeFilter })
      const res = await fetch(`/api/donations?${params}`)
      const data = await res.json()
      setDonations(data.donations || [])
      setTotal(data.total || 0)
    } finally { setLoading(false) }
  }, [page, pageSize, search, modeFilter])

  useEffect(() => { fetchDonations() }, [fetchDonations])

  const handleSave = async () => {
    if (!formData.donorName || !formData.amount || !formData.date) {
      setFormError('Donor name, amount and date are required')
      return
    }
    setSaving(true); setFormError('')
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) }),
      })
      if (!res.ok) { const e = await res.json(); setFormError(e.error || 'Failed'); return }
      setDialogOpen(false)
      fetchDonations()
      setActionMsg({ type: 'success', msg: 'Donation recorded and receipt generated.' })
      setTimeout(() => setActionMsg(null), 4000)
    } finally { setSaving(false) }
  }

  const downloadPdf = async (id: string, receiptNumber: string) => {
    setPdfLoading(id)
    try {
      const res = await fetch(`/api/donations/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pdf' }),
      })
      if (!res.ok) { setActionMsg({ type: 'error', msg: 'PDF generation failed' }); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `${receiptNumber}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } finally { setPdfLoading(null) }
  }

  const sendEmail = async (id: string) => {
    setEmailLoading(id)
    try {
      const res = await fetch(`/api/donations/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'email' }),
      })
      setActionMsg(res.ok
        ? { type: 'success', msg: 'Receipt emailed to donor.' }
        : { type: 'error', msg: 'Email send failed.' })
      setTimeout(() => setActionMsg(null), 4000)
    } finally { setEmailLoading(null) }
  }

  const columns: GridColDef[] = [
    { field: 'receiptNumber', headerName: 'Receipt #', width: 160 },
    { field: 'donorName', headerName: 'Donor', flex: 1, minWidth: 150 },
    { field: 'donorPan', headerName: 'PAN', width: 120, valueGetter: (v) => v || '—' },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 130,
      renderCell: (p: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={600} color="primary.dark">
          {formatCurrency(Number(p.value))}
        </Typography>
      ),
    },
    { field: 'date', headerName: 'Date', width: 110, valueGetter: (v) => formatDate(v) },
    {
      field: 'paymentMode',
      headerName: 'Mode',
      width: 100,
      renderCell: (p: GridRenderCellParams) => (
        <Chip label={p.value} size="small" variant="outlined" />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (p: GridRenderCellParams) => (
        <Chip
          label={p.value}
          size="small"
          color={p.value === 'CONFIRMED' ? 'success' : p.value === 'CANCELLED' ? 'error' : 'warning'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Receipt',
      width: 110,
      sortable: false,
      renderCell: (p: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Download PDF Receipt">
            <IconButton
              size="small"
              color="primary"
              onClick={() => downloadPdf(p.row.id, p.row.receiptNumber)}
              disabled={pdfLoading === p.row.id}
            >
              {pdfLoading === p.row.id ? <CircularProgress size={16} /> : <PictureAsPdfIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          {p.row.donorEmail && (
            <Tooltip title={p.row.receiptEmailed ? 'Receipt already emailed — send again?' : 'Email receipt to donor'}>
              <IconButton
                size="small"
                color={p.row.receiptEmailed ? 'success' : 'default'}
                onClick={() => sendEmail(p.row.id)}
                disabled={emailLoading === p.row.id}
              >
                {emailLoading === p.row.id ? <CircularProgress size={16} /> : <EmailIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            onClick={() => downloadCSV(donations, 'Donations_Export')}
            disabled={donations.length === 0}
          >
            Export CSV
          </Button>
          {canCreate && (
            <Button id="record-donation-btn" variant="contained" startIcon={<AddIcon />} onClick={() => { setFormData(emptyForm); setFormError(''); setDialogOpen(true) }}>
              Record Donation
            </Button>
          )}
        </Box>
      </Box>

      {actionMsg && (
        <Alert severity={actionMsg.type} sx={{ mb: 2 }} onClose={() => setActionMsg(null)}>
          {actionMsg.msg}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          placeholder="Search donor, PAN, receipt #..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          sx={{ minWidth: 260 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Payment Mode</InputLabel>
          <Select label="Payment Mode" value={modeFilter} onChange={(e) => { setModeFilter(e.target.value); setPage(0) }}>
            <MenuItem value="">All Modes</MenuItem>
            {PAYMENT_MODES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      <DataGrid
        rows={donations}
        columns={columns}
        rowCount={total}
        loading={loading}
        paginationMode="server"
        paginationModel={{ page, pageSize }}
        onPaginationModelChange={(m) => { setPage(m.page); setPageSize(m.pageSize) }}
        pageSizeOptions={[10, 25, 50, 100]}
        disableRowSelectionOnClick
        autoHeight
        sx={{ bgcolor: 'background.paper' }}
      />

      {/* Add Donation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MonetizationOnIcon color="primary" /> Record Donation
        </DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField label="Donor Name *" fullWidth value={formData.donorName} onChange={e => setFormData({ ...formData, donorName: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Phone" fullWidth value={formData.donorPhone} onChange={e => setFormData({ ...formData, donorPhone: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Email" type="email" fullWidth value={formData.donorEmail} onChange={e => setFormData({ ...formData, donorEmail: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="PAN" fullWidth inputProps={{ style: { textTransform: 'uppercase' } }} value={formData.donorPan} onChange={e => setFormData({ ...formData, donorPan: e.target.value.toUpperCase() })} /></Grid>
            <Grid item xs={6}><TextField label="Amount (₹) *" type="number" fullWidth value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Date *" type="date" fullWidth value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Mode *</InputLabel>
                <Select label="Payment Mode *" value={formData.paymentMode} onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}>
                  {PAYMENT_MODES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            {(formData.paymentMode === 'CHEQUE' || formData.paymentMode === 'DEMAND_DRAFT') && (
              <>
                <Grid item xs={6}><TextField label="Cheque/DD Number" fullWidth value={formData.chequeNumber} onChange={e => setFormData({ ...formData, chequeNumber: e.target.value })} /></Grid>
                <Grid item xs={6}><TextField label="Bank Name" fullWidth value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value })} /></Grid>
              </>
            )}
            <Grid item xs={12}><TextField label="Address" fullWidth multiline rows={2} value={formData.donorAddress} onChange={e => setFormData({ ...formData, donorAddress: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Purpose" fullWidth value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField label="Tier / Category" fullWidth value={formData.tier} onChange={e => setFormData({ ...formData, tier: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Notes" fullWidth multiline rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} /></Grid>
            {formData.donorEmail && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox checked={formData.emailReceipt} onChange={e => setFormData({ ...formData, emailReceipt: e.target.checked })} color="primary" />}
                  label="Email 80G receipt to donor after saving"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button id="save-donation-btn" variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Record & Generate Receipt'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
