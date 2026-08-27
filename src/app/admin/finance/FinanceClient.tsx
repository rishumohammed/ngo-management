'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
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
  TablePagination,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import CategoryIcon from '@mui/icons-material/Category'
import BusinessIcon from '@mui/icons-material/Business'
import ReceiptIcon from '@mui/icons-material/Receipt'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import PaymentsIcon from '@mui/icons-material/Payments'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useSearchParams, useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { getFiscalYear, getFiscalYearOptions } from '@/lib/utils'

interface PaymentAccount {
  id: string
  accountName: string
  accountType: 'BANK_ACCOUNT' | 'CASH_IN_HAND' | 'DIGITAL_WALLET'
  bankName?: string
  accountNumber?: string
  openingBalance: number
  currentBalance: number
  isDefault: boolean
}

interface ExpenseCategory {
  id: string
  name: string
  description?: string
  budgetLimit?: number
  _count?: { expenses: number }
}

interface Expense {
  id: string
  voucherNo: string
  fiscalYear: string
  categoryId: string
  category: ExpenseCategory
  paymentAccountId?: string
  paymentAccount?: PaymentAccount
  amount: number
  date: string
  paymentMode: string
  payeeName: string
  referenceNo?: string
  description?: string
  receiptUrl?: string
  status: 'PAID' | 'PENDING' | 'CANCELLED'
}

interface CommercialEntity {
  id: string
  name: string
  regNumber?: string
  entityType?: string
  contactPerson?: string
  phone?: string
  email?: string
  totalRevenue?: number
}

interface CommercialRevenue {
  id: string
  receiptNo: string
  fiscalYear: string
  entityId: string
  entity: CommercialEntity
  paymentAccountId?: string
  paymentAccount?: PaymentAccount
  amount: number
  date: string
  revenueType: string
  paymentMode: string
  referenceNo?: string
  notes?: string
}

interface SummaryData {
  accounts: PaymentAccount[]
  totalAccountBalance: number
  totalDonations: number
  totalCommercialRevenues: number
  totalRevenue: number
  totalExpenses: number
  netSurplus: number
  expensesByCategory: Array<{ categoryId: string; categoryName: string; amount: number; count: number }>
  monthlyTrends: Array<{ month: string; donations: number; commercial: number; totalIncome: number; expenses: number; net: number }>
}

const COLORS = ['#00897B', '#1E88E5', '#FB8C00', '#E53935', '#8E24AA', '#3949AB', '#00ACC1', '#43A047']

export default function FinanceClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  const [tabIndex, setTabIndex] = useState(0)

  useEffect(() => {
    if (tabParam === 'expenses' || tabParam === '1') setTabIndex(1)
    else if (tabParam === 'categories' || tabParam === '2') setTabIndex(2)
    else if (tabParam === 'commercial' || tabParam === '3') setTabIndex(3)
    else if (tabParam === 'statement' || tabParam === '4') setTabIndex(4)
    else setTabIndex(0)
  }, [tabParam])

  const handleTabChange = (_: React.SyntheticEvent, val: number) => {
    setTabIndex(val)
    const tabKeys = ['overview', 'expenses', 'categories', 'commercial', 'statement']
    router.push(`/admin/finance?tab=${tabKeys[val]}`)
  }

  // Financial Year state
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>(getFiscalYear())
  const fiscalYearOptions = getFiscalYearOptions()

  // Data states
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expensesTotal, setExpensesTotal] = useState(0)
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [expensePage, setExpensePage] = useState(0)
  const [expenseRowsPerPage, setExpenseRowsPerPage] = useState(10)
  const [expenseSearch, setExpenseSearch] = useState('')

  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  const [entities, setEntities] = useState<CommercialEntity[]>([])
  const [loadingEntities, setLoadingEntities] = useState(false)

  const [commercialRevenues, setCommercialRevenues] = useState<CommercialRevenue[]>([])
  const [loadingRevenues, setLoadingRevenues] = useState(false)

  // Dialog states
  const [openAccountModal, setOpenAccountModal] = useState(false)
  const [openExpenseModal, setOpenExpenseModal] = useState(false)
  const [openCategoryModal, setOpenCategoryModal] = useState(false)
  const [openEntityModal, setOpenEntityModal] = useState(false)
  const [openRevenueModal, setOpenRevenueModal] = useState(false)

  // Edit states
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  // Form states
  const [accountForm, setAccountForm] = useState({
    accountName: '',
    accountType: 'BANK_ACCOUNT',
    bankName: '',
    accountNumber: '',
    openingBalance: 0,
    isDefault: false,
  })

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    budgetLimit: '',
  })

  const [expenseForm, setExpenseForm] = useState({
    categoryId: '',
    paymentAccountId: '',
    amount: '',
    date: dayjs().format('YYYY-MM-DD'),
    paymentMode: 'NEFT',
    payeeName: '',
    referenceNo: '',
    description: '',
    receiptUrl: '',
  })

  const [entityForm, setEntityForm] = useState({
    name: '',
    regNumber: '',
    entityType: 'Social Enterprise',
    contactPerson: '',
    phone: '',
    email: '',
  })

  const [revenueForm, setRevenueForm] = useState({
    entityId: '',
    paymentAccountId: '',
    amount: '',
    date: dayjs().format('YYYY-MM-DD'),
    revenueType: 'PROFIT_SHARE',
    paymentMode: 'NEFT',
    referenceNo: '',
    notes: '',
  })

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true)
    try {
      const query = new URLSearchParams()
      if (selectedFiscalYear && selectedFiscalYear !== 'ALL') {
        query.set('fiscalYear', selectedFiscalYear)
      }
      const res = await fetch(`/api/finance/summary?${query}`)
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load financial summary')
    } finally {
      setLoadingSummary(false)
    }
  }, [selectedFiscalYear])

  // Fetch categories & accounts
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true)
    try {
      const res = await fetch('/api/expense-categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingCategories(false)
    }
  }, [])

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true)
    try {
      const query = new URLSearchParams({
        page: (expensePage + 1).toString(),
        pageSize: expenseRowsPerPage.toString(),
        search: expenseSearch,
      })
      if (selectedFiscalYear && selectedFiscalYear !== 'ALL') {
        query.set('fiscalYear', selectedFiscalYear)
      }
      const res = await fetch(`/api/expenses?${query}`)
      if (res.ok) {
        const data = await res.json()
        setExpenses(data.expenses || [])
        setExpensesTotal(data.total || 0)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingExpenses(false)
    }
  }, [expensePage, expenseRowsPerPage, expenseSearch, selectedFiscalYear])

  // Fetch commercial entities & revenues
  const fetchEntitiesAndRevenues = useCallback(async () => {
    setLoadingEntities(true)
    setLoadingRevenues(true)
    try {
      const revQuery = new URLSearchParams()
      if (selectedFiscalYear && selectedFiscalYear !== 'ALL') {
        revQuery.set('fiscalYear', selectedFiscalYear)
      }
      const [entRes, revRes] = await Promise.all([
        fetch('/api/commercial-entities'),
        fetch(`/api/commercial-revenues?${revQuery}`),
      ])
      if (entRes.ok) {
        const entData = await entRes.json()
        setEntities(entData.entities || [])
      }
      if (revRes.ok) {
        const revData = await revRes.json()
        setCommercialRevenues(revData.revenues || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingEntities(false)
      setLoadingRevenues(false)
    }
  }, [selectedFiscalYear])

  useEffect(() => {
    fetchSummary()
    fetchCategories()
    fetchExpenses()
    fetchEntitiesAndRevenues()
  }, [fetchSummary, fetchCategories, fetchExpenses, fetchEntitiesAndRevenues])

  // Submit Account Form
  const handleSaveAccount = async () => {
    try {
      const res = await fetch('/api/finance/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...accountForm,
          openingBalance: parseFloat(accountForm.openingBalance.toString() || '0'),
        }),
      })
      if (res.ok) {
        setOpenAccountModal(false)
        setAccountForm({
          accountName: '',
          accountType: 'BANK_ACCOUNT',
          bankName: '',
          accountNumber: '',
          openingBalance: 0,
          isDefault: false,
        })
        fetchSummary()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to save account')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Submit Category Form
  const handleSaveCategory = async () => {
    try {
      const res = await fetch('/api/expense-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...categoryForm,
          budgetLimit: categoryForm.budgetLimit ? parseFloat(categoryForm.budgetLimit) : null,
        }),
      })
      if (res.ok) {
        setOpenCategoryModal(false)
        setCategoryForm({ name: '', description: '', budgetLimit: '' })
        fetchCategories()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to save category')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Submit Expense Form
  const handleSaveExpense = async () => {
    try {
      const method = selectedExpense ? 'PUT' : 'POST'
      const url = selectedExpense ? `/api/expenses/${selectedExpense.id}` : '/api/expenses'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expenseForm,
          amount: parseFloat(expenseForm.amount),
        }),
      })
      if (res.ok) {
        setOpenExpenseModal(false)
        setSelectedExpense(null)
        setExpenseForm({
          categoryId: '',
          paymentAccountId: '',
          amount: '',
          date: dayjs().format('YYYY-MM-DD'),
          paymentMode: 'NEFT',
          payeeName: '',
          referenceNo: '',
          description: '',
          receiptUrl: '',
        })
        fetchExpenses()
        fetchSummary()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to save expense')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchExpenses()
        fetchSummary()
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Submit Commercial Entity Form
  const handleSaveEntity = async () => {
    try {
      const res = await fetch('/api/commercial-entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entityForm),
      })
      if (res.ok) {
        setOpenEntityModal(false)
        setEntityForm({ name: '', regNumber: '', entityType: 'Social Enterprise', contactPerson: '', phone: '', email: '' })
        fetchEntitiesAndRevenues()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to save company')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Submit Commercial Revenue Form
  const handleSaveRevenue = async () => {
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
        fetchEntitiesAndRevenues()
        fetchSummary()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to record commercial revenue')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // CSV Export for Income & Expense Statement
  const exportStatementCSV = () => {
    if (!summary) return
    const rows = [
      ['Financial Treasury Statement — Free Mind Foundation'],
      ['Financial Year', selectedFiscalYear === 'ALL' ? 'All Financial Years' : `FY ${selectedFiscalYear}`],
      ['Generated On', dayjs().format('YYYY-MM-DD HH:mm')],
      [''],
      ['TREASURY BALANCES & ACCOUNTS'],
      ['Account Name', 'Account Type', 'Current Balance (₹)'],
      ...summary.accounts.map((a) => [a.accountName, a.accountType, a.currentBalance.toFixed(2)]),
      ['TOTAL LIQUID FUNDS', '', summary.totalAccountBalance.toFixed(2)],
      [''],
      ['INCOME BREAKDOWN'],
      ['Source', 'Amount (₹)'],
      ['Donations & 80G Receipts', summary.totalDonations.toFixed(2)],
      ['Commercial Enterprise Profits / Benefits', summary.totalCommercialRevenues.toFixed(2)],
      ['TOTAL REVENUE', summary.totalRevenue.toFixed(2)],
      [''],
      ['EXPENSE BREAKDOWN BY CATEGORY'],
      ['Category Name', 'Amount (₹)', 'Count'],
      ...summary.expensesByCategory.map((c) => [c.categoryName, c.amount.toFixed(2), c.count.toString()]),
      ['TOTAL EXPENSES', summary.totalExpenses.toFixed(2)],
      [''],
      ['NET SURPLUS / NET AVAILABLE FUNDS', summary.netSurplus.toFixed(2)],
    ]

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `FMF_Financial_Statement_${dayjs().format('YYYY-MM-DD')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Dynamic header based on tabIndex
  const getTabHeader = () => {
    switch (tabIndex) {
      case 1:
        return {
          title: 'Expenses Log & Vouchers',
          subtitle: 'Log operational costs, track expense categories, and manage voucher records',
          actions: (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedExpense(null)
                setExpenseForm({
                  categoryId: categories[0]?.id || '',
                  paymentAccountId: summary?.accounts[0]?.id || '',
                  amount: '',
                  date: dayjs().format('YYYY-MM-DD'),
                  paymentMode: 'NEFT',
                  payeeName: '',
                  referenceNo: '',
                  description: '',
                  receiptUrl: '',
                })
                setOpenExpenseModal(true)
              }}
            >
              Record New Expense
            </Button>
          ),
        }
      case 2:
        return {
          title: 'Expense Categories',
          subtitle: 'Custom categories for organizing NGO operating costs and budget limits',
          actions: (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                setCategoryForm({ name: '', description: '', budgetLimit: '' })
                setOpenCategoryModal(true)
              }}
            >
              Add New Category
            </Button>
          ),
        }
      case 3:
        return {
          title: 'Commercial Enterprises & Companies',
          subtitle: 'Companies and social enterprises operated under/by the NGO that generate commercial revenues',
          actions: (
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setOpenEntityModal(true)}
              >
                Register Company
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PaymentsIcon />}
                onClick={() => {
                  setRevenueForm({
                    entityId: entities[0]?.id || '',
                    paymentAccountId: summary?.accounts[0]?.id || '',
                    amount: '',
                    date: dayjs().format('YYYY-MM-DD'),
                    revenueType: 'PROFIT_SHARE',
                    paymentMode: 'NEFT',
                    referenceNo: '',
                    notes: '',
                  })
                  setOpenRevenueModal(true)
                }}
              >
                Record Subsidiary Profit
              </Button>
            </Stack>
          ),
        }
      case 4:
        return {
          title: 'Financial Statement & Audit Export',
          subtitle: 'Audited summary of NGO cash flow, revenue breakdowns, and liquid fund reserves',
          actions: (
            <Button
              variant="contained"
              color="primary"
              startIcon={<FileDownloadIcon />}
              onClick={exportStatementCSV}
              disabled={!summary}
            >
              Export Statement CSV
            </Button>
          ),
        }
      default:
        return {
          title: 'Treasury & Liquidity Overview',
          subtitle: 'Real-time NGO bank account balances, cash reserves, income streams, and expense trends',
          actions: null,
        }
    }
  }

  const headerInfo = getTabHeader()

  return (
    <Box sx={{ pb: 4 }}>
      {/* Dynamic Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
            {headerInfo.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {headerInfo.subtitle}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel id="fy-select-label">Financial Year</InputLabel>
            <Select
              labelId="fy-select-label"
              value={selectedFiscalYear}
              label="Financial Year"
              onChange={(e) => setSelectedFiscalYear(e.target.value)}
              sx={{ bgcolor: 'background.paper', borderRadius: 1.5, fontWeight: 600 }}
            >
              <MenuItem value="ALL">
                <em>All Financial Years</em>
              </MenuItem>
              {fiscalYearOptions.map((fy) => (
                <MenuItem key={fy} value={fy}>
                  FY {fy}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchSummary()
              fetchExpenses()
              fetchEntitiesAndRevenues()
            }}
          >
            Refresh
          </Button>
          {headerInfo.actions}
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}



      {/* ─── TAB 0: TREASURY OVERVIEW ─── */}
      {tabIndex === 0 && (
        <Box>
          {loadingSummary ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : summary ? (
            <Grid container spacing={3}>
              {/* Key Liquidity Cards */}
              <Grid item xs={12} md={4}>
                <Card
                  elevation={0}
                  sx={{
                    bgcolor: 'primary.main',
                    color: '#FFFFFF',
                    borderRadius: 3,
                    p: 1,
                    background: 'linear-gradient(135deg, #00796B 0%, #004D40 100%)',
                    boxShadow: '0 4px 16px rgba(0, 77, 64, 0.25)',
                  }}
                >
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" sx={{ color: '#E0F2F1', fontWeight: 700, letterSpacing: '0.05em' }}>
                        NET AVAILABLE NGO FUNDS
                      </Typography>
                      <AccountBalanceWalletIcon sx={{ color: '#E0F2F1' }} />
                    </Stack>
                    <Typography variant="h3" sx={{ fontWeight: 800, my: 1, color: '#FFFFFF' }}>
                      ₹{summary.totalAccountBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#E0F2F1', fontWeight: 500, display: 'block', fontSize: '0.8125rem' }}>
                      Real-time total across all Bank Accounts & Cash Boxes
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" color="text.secondary">
                        TOTAL REVENUE / INCOME
                      </Typography>
                      <TrendingUpIcon color="success" />
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'success.main' }}>
                      ₹{summary.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip
                        label={`Donations: ₹${summary.totalDonations.toLocaleString('en-IN')}`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                      <Chip
                        label={`Subsidiary: ₹${summary.totalCommercialRevenues.toLocaleString('en-IN')}`}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" color="text.secondary">
                        TOTAL EXPENDITURE
                      </Typography>
                      <TrendingDownIcon color="error" />
                    </Stack>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'error.main' }}>
                      ₹{summary.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Net Surplus: ₹{summary.netSurplus.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Payment Accounts & Cash Boxes Grid */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Bank Accounts & Cash Boxes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Running balances for each financial account
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenAccountModal(true)}
                    >
                      Add Account
                    </Button>
                  </Stack>

                  <Grid container spacing= {2}>
                    {summary.accounts.map((acc) => (
                      <Grid item xs={12} sm={6} md={4} key={acc.id}>
                        <Card
                          variant="outlined"
                          sx={{
                            borderRadius: 2,
                            borderColor: acc.isDefault ? 'primary.main' : 'divider',
                            bgcolor: acc.isDefault ? 'teal.50' : 'background.paper',
                          }}
                        >
                          <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                  {acc.accountName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  {acc.accountType === 'CASH_IN_HAND' ? 'Cash in Hand' : acc.bankName || 'Bank Account'}
                                  {acc.accountNumber ? ` • ${acc.accountNumber}` : ''}
                                </Typography>
                              </Box>
                              {acc.accountType === 'CASH_IN_HAND' ? (
                                <PointOfSaleIcon color="action" />
                              ) : (
                                <AccountBalanceIcon color="primary" />
                              )}
                            </Stack>
                            <Typography variant="h5" sx={{ fontWeight: 800, mt: 2, color: 'primary.dark' }}>
                              ₹{acc.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>

              {/* Monthly Income vs Expense Chart */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Monthly Financial Trends (Income vs Expenses)
                  </Typography>
                  <Box sx={{ height: 320, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip formatter={(val: number) => `₹${val.toLocaleString('en-IN')}`} />
                        <Legend />
                        <Bar dataKey="donations" name="Donations" fill="#00897B" />
                        <Bar dataKey="commercial" name="Subsidiary Revenue" fill="#1E88E5" />
                        <Bar dataKey="expenses" name="Expenses" fill="#E53935" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>

              {/* Category Breakdown Pie Chart */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Expense Distribution by Category
                  </Typography>
                  {summary.expensesByCategory.length === 0 ? (
                    <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
                      No expenses logged yet.
                    </Typography>
                  ) : (
                    <Box sx={{ height: 260, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={summary.expensesByCategory}
                            dataKey="amount"
                            nameKey="categoryName"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={(entry) => entry.categoryName}
                          >
                            {summary.expensesByCategory.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(val: number) => `₹${val.toLocaleString('en-IN')}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          ) : null}
        </Box>
      )}

      {/* ─── TAB 1: EXPENSES LOG ─── */}
      {tabIndex === 1 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" sx={{ mb: 3 }}>
            <TextField
              size="small"
              placeholder="Search vendor, voucher, description..."
              value={expenseSearch}
              onChange={(e) => {
                setExpenseSearch(e.target.value)
                setExpensePage(0)
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: '100%', sm: 300 } }}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedExpense(null)
                setExpenseForm({
                  categoryId: categories[0]?.id || '',
                  paymentAccountId: summary?.accounts[0]?.id || '',
                  amount: '',
                  date: dayjs().format('YYYY-MM-DD'),
                  paymentMode: 'NEFT',
                  payeeName: '',
                  referenceNo: '',
                  description: '',
                  receiptUrl: '',
                })
                setOpenExpenseModal(true)
              }}
            >
              Record New Expense
            </Button>
          </Stack>

          {loadingExpenses ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table size="medium">
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Voucher No.</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Payee / Vendor</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Account Paid From</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Amount (₹)
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Mode</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No expenses recorded matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((exp) => (
                        <TableRow key={exp.id} hover>
                          <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {exp.voucherNo}
                          </TableCell>
                          <TableCell>{dayjs(exp.date).format('DD MMM YYYY')}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{exp.payeeName}</TableCell>
                          <TableCell>
                            <Chip label={exp.category?.name || 'Category'} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>{exp.paymentAccount?.accountName || 'Cash / Unassigned'}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>
                            ₹{Number(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Chip label={exp.paymentMode} size="small" />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Edit Expense">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  setSelectedExpense(exp)
                                  setExpenseForm({
                                    categoryId: exp.categoryId,
                                    paymentAccountId: exp.paymentAccountId || '',
                                    amount: exp.amount.toString(),
                                    date: dayjs(exp.date).format('YYYY-MM-DD'),
                                    paymentMode: exp.paymentMode,
                                    payeeName: exp.payeeName,
                                    referenceNo: exp.referenceNo || '',
                                    description: exp.description || '',
                                    receiptUrl: exp.receiptUrl || '',
                                  })
                                  setOpenExpenseModal(true)
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Expense">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteExpense(exp.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={expensesTotal}
                page={expensePage}
                onPageChange={(_, page) => setExpensePage(page)}
                rowsPerPage={expenseRowsPerPage}
                onRowsPerPageChange={(e) => {
                  setExpenseRowsPerPage(parseInt(e.target.value, 10))
                  setExpensePage(0)
                }}
              />
            </>
          )}
        </Paper>
      )}

      {/* ─── TAB 2: EXPENSE CATEGORIES ─── */}
      {tabIndex === 2 && (
        <Box>
          <Grid container spacing={2}>
            {categories.map((cat) => (
              <Grid item xs={12} sm={6} md={4} key={cat.id}>
                <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {cat.name}
                      </Typography>
                      <CategoryIcon color="primary" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, minHeight: 40 }}>
                      {cat.description || 'No description provided.'}
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Logged Expenses: <strong>{cat._count?.expenses || 0}</strong>
                      </Typography>
                      {cat.budgetLimit && (
                        <Chip label={`Limit: ₹${cat.budgetLimit.toLocaleString('en-IN')}`} size="small" />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* ─── TAB 3: COMMERCIAL SUBSIDIARIES & REVENUE ─── */}
      {tabIndex === 3 && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {entities.map((ent) => (
              <Grid item xs={12} sm={6} md={4} key={ent.id}>
                <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '4px solid #1E88E5' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {ent.name}
                        </Typography>
                        <Chip label={ent.entityType || 'Enterprise'} size="small" color="info" sx={{ mt: 0.5 }} />
                      </Box>
                      <BusinessIcon color="info" />
                    </Stack>
                    {ent.regNumber && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Reg/CIN: {ent.regNumber}
                      </Typography>
                    )}
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Income Received
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'info.main' }}>
                      ₹{(ent.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Revenue Transactions Table */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Subsidiary Revenue & Profit Share Log
            </Typography>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Receipt No.</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Company / Enterprise</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Revenue Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Credited Account</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Amount (₹)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {commercialRevenues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No commercial revenue entries recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    commercialRevenues.map((rev) => (
                      <TableRow key={rev.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: 'info.main' }}>
                          {rev.receiptNo}
                        </TableCell>
                        <TableCell>{dayjs(rev.date).format('DD MMM YYYY')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{rev.entity?.name}</TableCell>
                        <TableCell>
                          <Chip label={rev.revenueType.replace('_', ' ')} size="small" color="info" variant="outlined" />
                        </TableCell>
                        <TableCell>{rev.paymentAccount?.accountName || 'Main Account'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                          ₹{Number(rev.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* ─── TAB 4: FINANCIAL STATEMENT ─── */}
      {tabIndex === 4 && (
        <Paper sx={{ p: 4, borderRadius: 3, maxWidth: 900, mx: 'auto' }}>

          {summary && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'success.dark' }}>
                  1. REVENUE & INCOME
                </Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Public & Member Donations (80G Tax Exempted)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        ₹{summary.totalDonations.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Commercial Enterprise Profits / Subsidiary Revenue</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        ₹{summary.totalCommercialRevenues.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: 'success.50' }}>
                      <TableCell sx={{ fontWeight: 800 }}>TOTAL REVENUE (A)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: 'success.main', fontSize: '1.1rem' }}>
                        ₹{summary.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'error.dark' }}>
                  2. EXPENDITURE BY CATEGORY
                </Typography>
                <Table size="small">
                  <TableBody>
                    {summary.expensesByCategory.map((cat) => (
                      <TableRow key={cat.categoryId}>
                        <TableCell>{cat.categoryName}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          ₹{cat.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: 'error.50' }}>
                      <TableCell sx={{ fontWeight: 800 }}>TOTAL EXPENDITURE (B)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: 'error.main', fontSize: '1.1rem' }}>
                        ₹{summary.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>

              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'teal.50', borderColor: 'primary.main' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.dark' }}>
                    NET SURPLUS / REAL LIQUID NGO FUNDS (A - B)
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.dark' }}>
                    ₹{summary.netSurplus.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          )}
        </Paper>
      )}

      {/* ─── MODALS & DIALOGS ─── */}

      {/* 1. Add Payment Account Modal */}
      <Dialog open={openAccountModal} onClose={() => setOpenAccountModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Bank Account / Cash Box</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Account Name"
              placeholder="e.g. SBI Main Account, Cash Box"
              fullWidth
              value={accountForm.accountName}
              onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={accountForm.accountType}
                label="Account Type"
                onChange={(e) => setAccountForm({ ...accountForm, accountType: e.target.value as any })}
              >
                <MenuItem value="BANK_ACCOUNT">Bank Account</MenuItem>
                <MenuItem value="CASH_IN_HAND">Cash in Hand</MenuItem>
                <MenuItem value="DIGITAL_WALLET">Digital Wallet</MenuItem>
              </Select>
            </FormControl>
            {accountForm.accountType === 'BANK_ACCOUNT' && (
              <>
                <TextField
                  label="Bank Name"
                  placeholder="State Bank of India"
                  fullWidth
                  value={accountForm.bankName}
                  onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })}
                />
                <TextField
                  label="Account Number"
                  fullWidth
                  value={accountForm.accountNumber}
                  onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                />
              </>
            )}
            <TextField
              label="Opening Balance (₹)"
              type="number"
              fullWidth
              value={accountForm.openingBalance}
              onChange={(e) => setAccountForm({ ...accountForm, openingBalance: parseFloat(e.target.value) || 0 })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAccountModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAccount}>Save Account</Button>
        </DialogActions>
      </Dialog>

      {/* 2. Add Expense Modal */}
      <Dialog open={openExpenseModal} onClose={() => setOpenExpenseModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedExpense ? 'Edit Expense Record' : 'Record New Expense'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Amount (₹)"
                  type="number"
                  fullWidth
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              label="Payee / Vendor Name"
              fullWidth
              placeholder="e.g. Kerala State Electricity Board, Office Landlord"
              value={expenseForm.payeeName}
              onChange={(e) => setExpenseForm({ ...expenseForm, payeeName: e.target.value })}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={expenseForm.categoryId}
                    label="Category"
                    onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}
                  >
                    {categories.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Paid From Account</InputLabel>
                  <Select
                    value={expenseForm.paymentAccountId}
                    label="Paid From Account"
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentAccountId: e.target.value })}
                  >
                    {summary?.accounts.map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.accountName} (₹{a.currentBalance.toLocaleString('en-IN')})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Mode</InputLabel>
                  <Select
                    value={expenseForm.paymentMode}
                    label="Payment Mode"
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMode: e.target.value })}
                  >
                    <MenuItem value="CASH">Cash</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="NEFT">NEFT / RTGS</MenuItem>
                    <MenuItem value="CHEQUE">Cheque</MenuItem>
                    <MenuItem value="ONLINE">Online Transfer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Reference / UTR No."
                  fullWidth
                  value={expenseForm.referenceNo}
                  onChange={(e) => setExpenseForm({ ...expenseForm, referenceNo: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              label="Description / Purpose"
              multiline
              rows={2}
              fullWidth
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExpenseModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveExpense}>Save Expense</Button>
        </DialogActions>
      </Dialog>

      {/* 3. Add Category Modal */}
      <Dialog open={openCategoryModal} onClose={() => setOpenCategoryModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Expense Category</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Category Name"
              fullWidth
              placeholder="e.g. Media & Advertising"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            />
            <TextField
              label="Description"
              multiline
              rows={2}
              fullWidth
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            />
            <TextField
              label="Budget Limit (Optional ₹)"
              type="number"
              fullWidth
              value={categoryForm.budgetLimit}
              onChange={(e) => setCategoryForm({ ...categoryForm, budgetLimit: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCategoryModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCategory}>Save Category</Button>
        </DialogActions>
      </Dialog>

      {/* 4. Register Commercial Company Modal */}
      <Dialog open={openEntityModal} onClose={() => setOpenEntityModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Register Subsidiary Company / Enterprise</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Company Name"
              fullWidth
              placeholder="e.g. Free Mind Wellness Products Pvt Ltd"
              value={entityForm.name}
              onChange={(e) => setEntityForm({ ...entityForm, name: e.target.value })}
            />
            <TextField
              label="Registration / CIN No."
              fullWidth
              value={entityForm.regNumber}
              onChange={(e) => setEntityForm({ ...entityForm, regNumber: e.target.value })}
            />
            <TextField
              label="Enterprise Type"
              fullWidth
              placeholder="Private Ltd / Social Enterprise"
              value={entityForm.entityType}
              onChange={(e) => setEntityForm({ ...entityForm, entityType: e.target.value })}
            />
            <TextField
              label="Contact Person"
              fullWidth
              value={entityForm.contactPerson}
              onChange={(e) => setEntityForm({ ...entityForm, contactPerson: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEntityModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEntity}>Save Company</Button>
        </DialogActions>
      </Dialog>

      {/* 5. Record Subsidiary Profit Revenue Modal */}
      <Dialog open={openRevenueModal} onClose={() => setOpenRevenueModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Subsidiary Profit / Commercial Revenue</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Subsidiary Company</InputLabel>
              <Select
                value={revenueForm.entityId}
                label="Subsidiary Company"
                onChange={(e) => setRevenueForm({ ...revenueForm, entityId: e.target.value })}
              >
                {entities.map((ent) => (
                  <MenuItem key={ent.id} value={ent.id}>
                    {ent.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={revenueForm.date}
                  onChange={(e) => setRevenueForm({ ...revenueForm, date: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Amount (₹)"
                  type="number"
                  fullWidth
                  value={revenueForm.amount}
                  onChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth>
              <InputLabel>Credited Bank Account</InputLabel>
              <Select
                value={revenueForm.paymentAccountId}
                label="Credited Bank Account"
                onChange={(e) => setRevenueForm({ ...revenueForm, paymentAccountId: e.target.value })}
              >
                {summary?.accounts.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.accountName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Revenue Type</InputLabel>
              <Select
                value={revenueForm.revenueType}
                label="Revenue Type"
                onChange={(e) => setRevenueForm({ ...revenueForm, revenueType: e.target.value })}
              >
                <MenuItem value="PROFIT_SHARE">Profit Share</MenuItem>
                <MenuItem value="DIVIDEND">Dividend</MenuItem>
                <MenuItem value="SERVICE_FEE">Service Fee</MenuItem>
                <MenuItem value="ROYALTY">Royalty</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Notes / Reference"
              multiline
              rows={2}
              fullWidth
              value={revenueForm.notes}
              onChange={(e) => setRevenueForm({ ...revenueForm, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRevenueModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRevenue}>Record Profit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
