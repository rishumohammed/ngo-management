'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  Stack,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
} from '@mui/material'
import PaymentsIcon from '@mui/icons-material/Payments'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import StoreIcon from '@mui/icons-material/Store'
import dayjs from 'dayjs'
import { getFiscalYearOptions, formatCurrency } from '@/lib/utils'
import { can } from '@/lib/permissions'

interface CommercialEntity {
  id: string
  name: string
}

interface PaymentAccount {
  id: string
  accountName: string
  accountType: string
  bankName?: string
  accountNumber?: string
}

interface CommercialRevenue {
  id: string
  receiptNo: string
  fiscalYear: string
  entityId: string
  entity?: CommercialEntity
  paymentAccountId?: string
  paymentAccount?: PaymentAccount
  amount: number
  date: string
  revenueType: 'PROFIT_SHARE' | 'DIVIDEND' | 'SERVICE_FEE' | 'ROYALTY' | 'OTHER'
  paymentMode: string
  referenceNo?: string
  notes?: string
}

export default function CommercialRevenuesClient() {
  const { data: session } = useSession()
  const router = useRouter()

  const canUpdate = can(session?.user?.role || '', 'finance', 'update')
  const canDelete = can(session?.user?.role || '', 'finance', 'delete')

  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('2026-27')
  const [entities, setEntities] = useState<CommercialEntity[]>([])
  const [revenues, setRevenues] = useState<CommercialRevenue[]>([])
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])

  const [loading, setLoading] = useState<boolean>(true)
  const [savingRevenue, setSavingRevenue] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Add Revenue Modal State
  const [openRevenueModal, setOpenRevenueModal] = useState<boolean>(false)
  const [revEntityId, setRevEntityId] = useState<string>('')
  const [revAmount, setRevAmount] = useState<string>('')
  const [revType, setRevType] = useState<string>('PROFIT_SHARE')
  const [revDate, setRevDate] = useState<string>(dayjs().format('YYYY-MM-DD'))
  const [revPaymentMode, setRevPaymentMode] = useState<string>('BANK_TRANSFER')
  const [revAccountId, setRevAccountId] = useState<string>('')
  const [revRefNo, setRevRefNo] = useState<string>('')
  const [revNotes, setRevNotes] = useState<string>('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resE, resR, resA] = await Promise.all([
        fetch('/api/commercial-entities'),
        fetch(`/api/commercial-revenues?fiscalYear=${encodeURIComponent(selectedFiscalYear)}`),
        fetch('/api/payment-accounts'),
      ])

      const dataE = await resE.json()
      const dataR = await resR.json()
      const dataA = await resA.json()

      setEntities(Array.isArray(dataE) ? dataE : [])
      setRevenues(Array.isArray(dataR) ? dataR : [])
      setAccounts(Array.isArray(dataA) ? dataA : [])
    } catch (err) {
      console.error('Failed to fetch commercial revenues:', err)
      setToastMessage('Error loading revenue ledger data')
    } finally {
      setLoading(false)
    }
  }, [selectedFiscalYear])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calculation metrics
  const totalRevenueLogged = revenues.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  const profitShareTotal = revenues.filter((r) => r.revenueType === 'PROFIT_SHARE').reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  const dividendTotal = revenues.filter((r) => r.revenueType === 'DIVIDEND').reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  const serviceFeesTotal = revenues.filter((r) => r.revenueType === 'SERVICE_FEE' || r.revenueType === 'ROYALTY').reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

  // Filtered revenues search
  const filteredRevenues = revenues.filter((r) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      r.receiptNo?.toLowerCase().includes(q) ||
      r.entity?.name?.toLowerCase().includes(q) ||
      r.referenceNo?.toLowerCase().includes(q) ||
      r.revenueType?.toLowerCase().includes(q)
    )
  })

  // Submit new revenue
  const handleSaveRevenue = async () => {
    if (!revEntityId || !revAmount || parseFloat(revAmount) <= 0) {
      setToastMessage('Please select a commercial entity and enter a valid positive amount.')
      return
    }

    setSavingRevenue(true)
    try {
      const payload = {
        fiscalYear: selectedFiscalYear === 'ALL' ? '2026-27' : selectedFiscalYear,
        entityId: revEntityId,
        amount: parseFloat(revAmount),
        date: revDate,
        revenueType: revType,
        paymentMode: revPaymentMode,
        paymentAccountId: revAccountId || null,
        referenceNo: revRefNo,
        notes: revNotes,
      }

      const res = await fetch('/api/commercial-revenues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setToastMessage('Revenue distribution recorded successfully.')
        setOpenRevenueModal(false)
        setRevAmount('')
        setRevRefNo('')
        setRevNotes('')
        fetchData()
      } else {
        const err = await res.json()
        setToastMessage(err.error || 'Failed to record revenue distribution.')
      }
    } catch (e) {
      setToastMessage('Error connecting to server.')
    } finally {
      setSavingRevenue(false)
    }
  }

  // Delete revenue entry
  const handleDeleteRevenue = async (id: string) => {
    if (!confirm('Are you sure you want to delete this revenue entry? This action will remove the record.')) return

    try {
      const res = await fetch(`/api/commercial-revenues?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setToastMessage('Revenue entry deleted.')
        fetchData()
      } else {
        setToastMessage('Failed to delete revenue entry.')
      }
    } catch (e) {
      setToastMessage('Error deleting entry.')
    }
  }

  return (
    <Box sx={{ pb: 6 }}>
      {/* Top Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', lg: 'center' },
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#12446A', letterSpacing: '-0.02em' }}>
            Subsidiary Revenue & Profit Distributions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Ledger of profit shares, dividends, and royalties received from commercial subsidiary entities
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Financial Year</InputLabel>
            <Select
              value={selectedFiscalYear}
              label="Financial Year"
              onChange={(e) => setSelectedFiscalYear(e.target.value)}
              sx={{ bgcolor: 'white', borderRadius: 2 }}
            >
              <MenuItem value="ALL">All Financial Years</MenuItem>
              {getFiscalYearOptions().map((fy) => (
                <MenuItem key={fy} value={fy}>
                  FY {fy}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <IconButton onClick={fetchData} color="primary" sx={{ bgcolor: 'white', border: '1px solid #E2E8F0', height: 40, width: 40, borderRadius: 2 }}>
            <RefreshIcon />
          </IconButton>

          {canUpdate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                if (entities.length > 0 && !revEntityId) setRevEntityId(entities[0].id)
                setOpenRevenueModal(true)
              }}
              sx={{ bgcolor: '#12446A', '&:hover': { bgcolor: '#0E3654' }, fontWeight: 700, borderRadius: 2, height: 40 }}
            >
              Record Revenue Distribution
            </Button>
          )}
        </Box>
      </Box>

      {/* KPI Stats Bar */}
      <Grid container spacing={2.5} sx={{ mb: 4 }} alignItems="stretch">
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E1E6EB', bgcolor: '#FFFFFF', height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1, minHeight: 40 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Total Subsidiary Revenue ({selectedFiscalYear === 'ALL' ? 'All Time' : `FY ${selectedFiscalYear}`})
              </Typography>
              <TrendingUpIcon sx={{ color: '#16A34A' }} />
            </Stack>
            <Box>
              <Typography variant="h4" fontWeight={800} color="#166534" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {formatCurrency(totalRevenueLogged)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {filteredRevenues.length} Total distribution vouchers
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E1E6EB', bgcolor: '#FFFFFF', height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1, minHeight: 40 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Profit Share Earnings
              </Typography>
              <AccountBalanceIcon sx={{ color: '#12446A' }} />
            </Stack>
            <Box>
              <Typography variant="h4" fontWeight={800} color="#12446A" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {formatCurrency(profitShareTotal)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Net profit share received
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E1E6EB', bgcolor: '#FFFFFF', height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1, minHeight: 40 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Dividends
              </Typography>
              <StoreIcon sx={{ color: '#2563EB' }} />
            </Stack>
            <Box>
              <Typography variant="h4" fontWeight={800} color="#1D4ED8" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {formatCurrency(dividendTotal)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Direct profit distributions
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E1E6EB', bgcolor: '#FFFFFF', height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1, minHeight: 40 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Service Fees & Royalties
              </Typography>
              <PaymentsIcon sx={{ color: '#D97706' }} />
            </Stack>
            <Box>
              <Typography variant="h4" fontWeight={800} color="#B45309" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {formatCurrency(serviceFeesTotal)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Operational fees & IP licensing
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Ledger Table */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E1E6EB' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
          <Typography variant="h6" fontWeight={700} color="#12446A">
            Subsidiary Revenue Distribution Entries ({filteredRevenues.length})
          </Typography>

          <TextField
            size="small"
            placeholder="Search by receipt no, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
                <TableCell sx={{ fontWeight: 700 }}>Receipt No.</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Company / Enterprise</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Revenue Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Credited Account</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reference / Notes</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Amount (₹)
                </TableCell>
                {canDelete && <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredRevenues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No subsidiary revenue distribution entries found for {selectedFiscalYear === 'ALL' ? 'all time' : `FY ${selectedFiscalYear}`}.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRevenues.map((rev) => (
                  <TableRow key={rev.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#12446A' }}>
                      {rev.receiptNo}
                    </TableCell>
                    <TableCell>{dayjs(rev.date).format('DD MMM YYYY')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{rev.entity?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={rev.revenueType.replace(/_/g, ' ')}
                        size="small"
                        color={rev.revenueType === 'PROFIT_SHARE' ? 'success' : 'info'}
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>{rev.paymentAccount?.accountName || 'Main Treasury Account'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      {rev.referenceNo ? `Ref: ${rev.referenceNo} ` : ''}
                      {rev.notes ? `(${rev.notes})` : ''}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#166534' }}>
                      ₹{Number(rev.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </TableCell>
                    {canDelete && (
                      <TableCell align="center">
                        <Tooltip title="Delete Entry">
                          <IconButton size="small" color="error" onClick={() => handleDeleteRevenue(rev.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 💰 Record Revenue Modal */}
      <Dialog open={openRevenueModal} onClose={() => setOpenRevenueModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#12446A' }}>
          Record Subsidiary Revenue Distribution
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Commercial Company / Enterprise</InputLabel>
                <Select
                  value={revEntityId}
                  label="Commercial Company / Enterprise"
                  onChange={(e) => setRevEntityId(e.target.value)}
                >
                  {entities.map((e) => (
                    <MenuItem key={e.id} value={e.id}>
                      {e.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Amount (₹)"
                type="number"
                fullWidth
                size="small"
                value={revAmount}
                onChange={(e) => setRevAmount(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Revenue Type</InputLabel>
                <Select value={revType} label="Revenue Type" onChange={(e) => setRevType(e.target.value)}>
                  <MenuItem value="PROFIT_SHARE">Profit Share</MenuItem>
                  <MenuItem value="DIVIDEND">Dividend</MenuItem>
                  <MenuItem value="SERVICE_FEE">Service Fee / IP Royalty</MenuItem>
                  <MenuItem value="OTHER">Other Enterprise Contribution</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Received Date"
                type="date"
                fullWidth
                size="small"
                value={revDate}
                onChange={(e) => setRevDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Credited NGO Account</InputLabel>
                <Select
                  value={revAccountId}
                  label="Credited NGO Account"
                  onChange={(e) => setRevAccountId(e.target.value)}
                >
                  <MenuItem value="">Default Treasury Account</MenuItem>
                  {accounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.accountName} ({acc.accountType})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  value={revPaymentMode}
                  label="Payment Mode"
                  onChange={(e) => setRevPaymentMode(e.target.value)}
                >
                  <MenuItem value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</MenuItem>
                  <MenuItem value="CHEQUE">Cheque</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="CASH">Cash</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Bank Ref / UTR No."
                fullWidth
                size="small"
                value={revRefNo}
                onChange={(e) => setRevRefNo(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Reference Notes / Purpose"
                fullWidth
                multiline
                rows={2}
                size="small"
                value={revNotes}
                onChange={(e) => setRevNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenRevenueModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveRevenue}
            disabled={savingRevenue}
            sx={{ bgcolor: '#12446A', '&:hover': { bgcolor: '#0E3654' } }}
          >
            {savingRevenue ? <CircularProgress size={24} color="inherit" /> : 'Record Distribution'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
      />
    </Box>
  )
}
