'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
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
  Tabs,
  Tab,
} from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import PaymentsIcon from '@mui/icons-material/Payments'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import StoreIcon from '@mui/icons-material/Store'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import PersonIcon from '@mui/icons-material/Person'
import SearchIcon from '@mui/icons-material/Search'
import dayjs from 'dayjs'
import { getFiscalYearOptions, formatCurrency } from '@/lib/utils'
import { can } from '@/lib/permissions'

interface CommercialEntity {
  id: string
  name: string
  regNumber?: string
  entityType?: string
  contactPerson?: string
  phone?: string
  email?: string
  notes?: string
  totalRevenue?: number
  createdAt?: string
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

export default function CommercialSubsidiariesClient() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab')

  const canUpdate = can(session?.user?.role || '', 'finance', 'update')
  const canDelete = can(session?.user?.role || '', 'finance', 'delete')

  const [tab, setTab] = useState<number>(0)
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('2026-27')
  const [entities, setEntities] = useState<CommercialEntity[]>([])
  const [revenues, setRevenues] = useState<CommercialRevenue[]>([])
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  
  const [loading, setLoading] = useState<boolean>(true)
  const [savingEntity, setSavingEntity] = useState<boolean>(false)
  const [savingRevenue, setSavingRevenue] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Sync tab state with URL
  useEffect(() => {
    if (tabParam === 'revenues' || tabParam === '1') setTab(1)
    else setTab(0)
  }, [tabParam])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue)
    const keys = ['companies', 'revenues']
    router.push(`/admin/commercial-subsidiaries?tab=${keys[newValue]}`)
  }

  // Modals state
  const [openEntityModal, setOpenEntityModal] = useState<boolean>(false)
  const [selectedEntity, setSelectedEntity] = useState<CommercialEntity | null>(null)
  const [entityForm, setEntityForm] = useState({
    name: '',
    regNumber: '',
    entityType: 'Social Enterprise',
    contactPerson: '',
    phone: '',
    email: '',
    notes: '',
  })

  const [openRevenueModal, setOpenRevenueModal] = useState<boolean>(false)
  const [revenueForm, setRevenueForm] = useState({
    entityId: '',
    paymentAccountId: '',
    amount: '',
    date: dayjs().format('YYYY-MM-DD'),
    revenueType: 'PROFIT_SHARE' as 'PROFIT_SHARE' | 'DIVIDEND' | 'SERVICE_FEE' | 'ROYALTY' | 'OTHER',
    paymentMode: 'NEFT',
    referenceNo: '',
    notes: '',
  })

  // Fetch Payment Accounts
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/finance/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts || [])
      }
    } catch (e) {
      console.error('Failed to fetch accounts:', e)
    }
  }, [])

  // Fetch Entities & Revenues
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (selectedFiscalYear && selectedFiscalYear !== 'ALL') {
        query.set('fiscalYear', selectedFiscalYear)
      }

      const [entRes, revRes] = await Promise.all([
        fetch('/api/commercial-entities'),
        fetch(`/api/commercial-revenues?${query}`),
      ])

      if (entRes.ok) {
        const entData = await entRes.json()
        setEntities(entData.entities || [])
      }

      if (revRes.ok) {
        const revData = await revRes.json()
        setRevenues(revData.revenues || [])
      }
    } catch (err) {
      console.error('Failed to load commercial subsidiary data:', err)
      setToastMessage('Failed to load commercial subsidiary data')
    } finally {
      setLoading(false)
    }
  }, [selectedFiscalYear])

  useEffect(() => {
    fetchAccounts()
    fetchData()
  }, [fetchAccounts, fetchData])

  // Save / Update Entity
  const handleSaveEntity = async () => {
    if (!entityForm.name.trim()) {
      setToastMessage('Company/Enterprise name is required')
      return
    }
    setSavingEntity(true)
    try {
      const isEdit = !!selectedEntity
      const url = isEdit ? `/api/commercial-entities/${selectedEntity.id}` : '/api/commercial-entities'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entityForm),
      })

      if (res.ok) {
        setOpenEntityModal(false)
        setSelectedEntity(null)
        setEntityForm({ name: '', regNumber: '', entityType: 'Social Enterprise', contactPerson: '', phone: '', email: '', notes: '' })
        setToastMessage(isEdit ? 'Company profile updated successfully!' : 'Commercial company registered successfully!')
        fetchData()
      } else {
        const err = await res.json()
        setToastMessage(err.error || 'Failed to save company details')
      }
    } catch (e) {
      console.error(e)
      setToastMessage('Error saving company details')
    } finally {
      setSavingEntity(false)
    }
  }

  // Delete Entity
  const handleDeleteEntity = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return
    try {
      const res = await fetch(`/api/commercial-entities/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setToastMessage('Company deleted successfully')
        fetchData()
      } else {
        const err = await res.json()
        setToastMessage(err.error || 'Failed to delete company')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Save Commercial Revenue
  const handleSaveRevenue = async () => {
    if (!revenueForm.entityId) {
      setToastMessage('Please select a commercial entity')
      return
    }
    if (!revenueForm.amount || parseFloat(revenueForm.amount) <= 0) {
      setToastMessage('Please enter a valid amount')
      return
    }

    setSavingRevenue(true)
    try {
      const res = await fetch('/api/commercial-revenues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...revenueForm,
          amount: parseFloat(revenueForm.amount),
        }),
      })

      if (res.ok) {
        setOpenRevenueModal(false)
        setRevenueForm({
          entityId: '',
          paymentAccountId: '',
          amount: '',
          date: dayjs().format('YYYY-MM-DD'),
          revenueType: 'PROFIT_SHARE',
          paymentMode: 'NEFT',
          referenceNo: '',
          notes: '',
        })
        setToastMessage('Subsidiary revenue distribution recorded successfully!')
        fetchData()
      } else {
        const err = await res.json()
        setToastMessage(err.error || 'Failed to record commercial revenue')
      }
    } catch (e) {
      console.error(e)
      setToastMessage('Error recording commercial revenue')
    } finally {
      setSavingRevenue(false)
    }
  }

  // Delete Revenue Log
  const handleDeleteRevenue = async (id: string) => {
    if (!confirm('Are you sure you want to delete this revenue entry?')) return
    try {
      const res = await fetch(`/api/commercial-revenues/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setToastMessage('Revenue entry deleted')
        fetchData()
      } else {
        const err = await res.json()
        setToastMessage(err.error || 'Failed to delete entry')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Open Edit Entity Modal
  const openEditEntity = (ent: CommercialEntity) => {
    setSelectedEntity(ent)
    setEntityForm({
      name: ent.name || '',
      regNumber: ent.regNumber || '',
      entityType: ent.entityType || 'Social Enterprise',
      contactPerson: ent.contactPerson || '',
      phone: ent.phone || '',
      email: ent.email || '',
      notes: ent.notes || '',
    })
    setOpenEntityModal(true)
  }

  // Open Add Revenue Modal pre-selected for entity
  const openAddRevenueForEntity = (entityId: string) => {
    setRevenueForm((prev) => ({ ...prev, entityId }))
    setOpenRevenueModal(true)
  }

  // Metrics
  const totalCommercialRevenue = revenues.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  const profitShareTotal = revenues.filter((r) => r.revenueType === 'PROFIT_SHARE' || r.revenueType === 'DIVIDEND').reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  const serviceFeesTotal = revenues.filter((r) => r.revenueType === 'SERVICE_FEE' || r.revenueType === 'ROYALTY').reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

  // Filtered revenues for table search
  const filteredRevenues = revenues.filter((r) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (r.receiptNo && r.receiptNo.toLowerCase().includes(q)) ||
      (r.entity?.name && r.entity.name.toLowerCase().includes(q)) ||
      (r.referenceNo && r.referenceNo.toLowerCase().includes(q))
    )
  })

  return (
    <Box sx={{ pb: 6 }}>
      {/* Top Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', lg: 'center' },
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} color="#12446A" letterSpacing="-0.02em">
            Commercial Subsidiaries & Enterprises Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Dedicated dashboard for social enterprises, subsidiary companies, and commercial profit share distributions
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

          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData} disabled={loading} sx={{ height: 40, borderRadius: 2 }}>
            Refresh
          </Button>

          {canUpdate && (
            <>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedEntity(null)
                  setEntityForm({ name: '', regNumber: '', entityType: 'Social Enterprise', contactPerson: '', phone: '', email: '', notes: '' })
                  setOpenEntityModal(true)
                }}
                sx={{ height: 40, borderRadius: 2, fontWeight: 600 }}
              >
                Register Company
              </Button>
              <Button
                variant="contained"
                startIcon={<PaymentsIcon />}
                sx={{ bgcolor: '#12446A', '&:hover': { bgcolor: '#0d3250' }, height: 40, borderRadius: 2, fontWeight: 700 }}
                onClick={() => {
                  if (entities.length > 0 && !revenueForm.entityId) {
                    setRevenueForm((prev) => ({ ...prev, entityId: entities[0].id }))
                  }
                  setOpenRevenueModal(true)
                }}
              >
                Record Subsidiary Revenue
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Summary KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }} alignItems="stretch">
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #E1E6EB',
              bgcolor: '#F8FAFC',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1, minHeight: 40 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Total Registered Subsidiaries
              </Typography>
              <StoreIcon sx={{ color: '#12446A' }} />
            </Stack>
            <Box>
              <Typography variant="h4" fontWeight={800} color="#12446A">
                {entities.length}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Active enterprises & companies
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #BBF7D0',
              bgcolor: '#F0FDF4',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1, minHeight: 40 }}>
              <Typography variant="caption" color="#166534" fontWeight={700}>
                Total Subsidiary Revenue ({selectedFiscalYear === 'ALL' ? 'All Time' : `FY ${selectedFiscalYear}`})
              </Typography>
              <TrendingUpIcon sx={{ color: '#16A34A' }} />
            </Stack>
            <Box>
              <Typography variant="h4" fontWeight={800} color="#15803D" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {formatCurrency(totalCommercialRevenue)}
              </Typography>
              <Typography variant="caption" color="#166534" display="block" sx={{ mt: 0.5 }}>
                Credited to NGO treasury accounts
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #E1E6EB',
              bgcolor: '#FFFFFF',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1, minHeight: 40 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Profit Share & Dividends
              </Typography>
              <AccountBalanceIcon sx={{ color: '#0284C7' }} />
            </Stack>
            <Box>
              <Typography variant="h4" fontWeight={800} color="#0369A1" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {formatCurrency(profitShareTotal)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Direct profit distributions
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #E1E6EB',
              bgcolor: '#FFFFFF',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
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

      {/* ─── REGISTERED COMPANIES & UNITS ─── */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700} color="#12446A">
            Companies & Social Enterprises Registry ({entities.length})
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : entities.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: '#F8FAFC' }}>
            <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6" fontWeight={700} color="text.secondary">
              No Commercial Subsidiaries Registered
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Register your social enterprise or commercial company units to start tracking profit share distributions.
            </Typography>
            {canUpdate && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ bgcolor: '#12446A' }}
                onClick={() => setOpenEntityModal(true)}
              >
                Register First Company
              </Button>
            )}
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {entities.map((ent) => (
              <Grid item xs={12} sm={6} md={4} key={ent.id}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderLeft: '4px solid #12446A',
                    transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={700} color="#0F172A">
                          {ent.name}
                        </Typography>
                        <Chip
                          label={ent.entityType || 'Social Enterprise'}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mt: 0.5, fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        {canUpdate && (
                          <Tooltip title="Edit Company Details">
                            <IconButton size="small" onClick={() => openEditEntity(ent)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip title="Delete Company">
                            <IconButton size="small" color="error" onClick={() => handleDeleteEntity(ent.id, ent.name)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Box>

                    {ent.regNumber && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontWeight: 500 }}>
                        Reg / CIN: <strong>{ent.regNumber}</strong>
                      </Typography>
                    )}

                    <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                      {ent.contactPerson && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="inherit" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            Contact: {ent.contactPerson}
                          </Typography>
                        </Box>
                      )}
                      {ent.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon fontSize="inherit" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {ent.phone}
                          </Typography>
                        </Box>
                      )}
                      {ent.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon fontSize="inherit" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {ent.email}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ bgcolor: '#F8FAFC', p: 1.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                        Total Revenue Received ({selectedFiscalYear === 'ALL' ? 'All Time' : `FY ${selectedFiscalYear}`})
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="#12446A" sx={{ mt: 0.25 }}>
                        ₹{(ent.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </CardContent>

                  {canUpdate && (
                    <Box sx={{ px: 2.5, pb: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        startIcon={<PaymentsIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                        onClick={() => openAddRevenueForEntity(ent.id)}
                      >
                        Record Revenue for {ent.name}
                      </Button>
                    </Box>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* 🏢 Register / Edit Company Dialog Modal */}
      <Dialog open={openEntityModal} onClose={() => setOpenEntityModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#12446A' }}>
          {selectedEntity ? 'Edit Commercial Company' : 'Register Commercial Subsidiary / Unit'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Company / Unit Name"
                fullWidth
                required
                value={entityForm.name}
                onChange={(e) => setEntityForm({ ...entityForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Registration / CIN Number"
                fullWidth
                placeholder="e.g. U74999KL2026PTC12345"
                value={entityForm.regNumber}
                onChange={(e) => setEntityForm({ ...entityForm, regNumber: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={entityForm.entityType}
                  label="Entity Type"
                  onChange={(e) => setEntityForm({ ...entityForm, entityType: e.target.value })}
                >
                  <MenuItem value="Social Enterprise">Social Enterprise</MenuItem>
                  <MenuItem value="Private Limited">Private Limited Company</MenuItem>
                  <MenuItem value="LLP">Limited Liability Partnership (LLP)</MenuItem>
                  <MenuItem value="Proprietorship">Proprietorship / Business Unit</MenuItem>
                  <MenuItem value="Cooperative">Cooperative / Society Unit</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Person Name"
                fullWidth
                value={entityForm.contactPerson}
                onChange={(e) => setEntityForm({ ...entityForm, contactPerson: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Phone"
                fullWidth
                value={entityForm.phone}
                onChange={(e) => setEntityForm({ ...entityForm, phone: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Email"
                fullWidth
                value={entityForm.email}
                onChange={(e) => setEntityForm({ ...entityForm, email: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Notes & Business Details"
                fullWidth
                multiline
                rows={2}
                value={entityForm.notes}
                onChange={(e) => setEntityForm({ ...entityForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC' }}>
          <Button onClick={() => setOpenEntityModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#12446A' }}
            onClick={handleSaveEntity}
            disabled={savingEntity}
          >
            {savingEntity ? <CircularProgress size={20} color="inherit" /> : selectedEntity ? 'Save Changes' : 'Register Company'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 💰 Record Subsidiary Revenue Dialog Modal */}
      <Dialog open={openRevenueModal} onClose={() => setOpenRevenueModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#12446A' }}>
          Record Subsidiary Profit Share / Revenue
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Select Commercial Subsidiary / Company</InputLabel>
                <Select
                  value={revenueForm.entityId}
                  label="Select Commercial Subsidiary / Company"
                  onChange={(e) => setRevenueForm({ ...revenueForm, entityId: e.target.value })}
                >
                  {entities.map((ent) => (
                    <MenuItem key={ent.id} value={ent.id}>
                      {ent.name} {ent.regNumber ? `(${ent.regNumber})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Revenue Amount (₹)"
                fullWidth
                required
                type="number"
                value={revenueForm.amount}
                onChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Date Received"
                type="date"
                fullWidth
                required
                value={revenueForm.date}
                onChange={(e) => setRevenueForm({ ...revenueForm, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Revenue Type</InputLabel>
                <Select
                  value={revenueForm.revenueType}
                  label="Revenue Type"
                  onChange={(e) => setRevenueForm({ ...revenueForm, revenueType: e.target.value as any })}
                >
                  <MenuItem value="PROFIT_SHARE">Profit Share / Surplus</MenuItem>
                  <MenuItem value="DIVIDEND">Dividend Distribution</MenuItem>
                  <MenuItem value="SERVICE_FEE">Management / Service Fee</MenuItem>
                  <MenuItem value="ROYALTY">Royalty / Licensing Fee</MenuItem>
                  <MenuItem value="OTHER">Other Income</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Credited NGO Account</InputLabel>
                <Select
                  value={revenueForm.paymentAccountId}
                  label="Credited NGO Account"
                  onChange={(e) => setRevenueForm({ ...revenueForm, paymentAccountId: e.target.value })}
                >
                  <MenuItem value="">Main NGO Bank/Cash Account</MenuItem>
                  {accounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.accountName} {acc.bankName ? `(${acc.bankName})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  value={revenueForm.paymentMode}
                  label="Payment Mode"
                  onChange={(e) => setRevenueForm({ ...revenueForm, paymentMode: e.target.value })}
                >
                  <MenuItem value="NEFT">NEFT / RTGS</MenuItem>
                  <MenuItem value="CHEQUE">Cheque / Demand Draft</MenuItem>
                  <MenuItem value="ONLINE">Online Transfer / UPI</MenuItem>
                  <MenuItem value="CASH">Cash</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Reference / Cheque / UTR No."
                fullWidth
                value={revenueForm.referenceNo}
                onChange={(e) => setRevenueForm({ ...revenueForm, referenceNo: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Transaction Notes & Remarks"
                fullWidth
                multiline
                rows={2}
                value={revenueForm.notes}
                onChange={(e) => setRevenueForm({ ...revenueForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC' }}>
          <Button onClick={() => setOpenRevenueModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#12446A' }}
            onClick={handleSaveRevenue}
            disabled={savingRevenue}
          >
            {savingRevenue ? <CircularProgress size={20} color="inherit" /> : 'Record Subsidiary Revenue'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Toast */}
      <Snackbar
        open={!!toastMessage}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
      />
    </Box>
  )
}
