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
import PrintIcon from '@mui/icons-material/Print'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import VisibilityIcon from '@mui/icons-material/Visibility'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CloseIcon from '@mui/icons-material/Close'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'

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
import { getFiscalYear, getFiscalYearOptions, numberToWords } from '@/lib/utils'


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
  expenseCount?: number
  totalAmount?: number
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
  const [openTransferModal, setOpenTransferModal] = useState(false)
  const [openExpenseModal, setOpenExpenseModal] = useState(false)
  const [openCategoryModal, setOpenCategoryModal] = useState(false)
  const [openEntityModal, setOpenEntityModal] = useState(false)
  const [openRevenueModal, setOpenRevenueModal] = useState(false)
  const [openVoucherPrintModal, setOpenVoucherPrintModal] = useState(false)

  // Fund Transfer State
  const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    date: dayjs().format('YYYY-MM-DD'),
    referenceNo: '',
    notes: '',
  })
  const [transferSaving, setTransferSaving] = useState(false)
  const [transferError, setTransferError] = useState<string | null>(null)

  // Edit & Voucher Print states
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<Expense | null>(null)
  const [expenseFormMode, setExpenseFormMode] = useState<'EXPENSE' | 'VOUCHER'>('VOUCHER')


  // Organization Settings state
  const [orgSettings, setOrgSettings] = useState<Record<string, string>>({
    org_name: 'Free Mind Foundation',
    org_logo: '',
    org_address: '',
    org_phone: '',
    org_email: '',
    org_pan: '',
    eighty_g_number: '',
    signatory_name: 'Authorised Signatory',
    voucher_max_limit: '50000',
  })

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setOrgSettings((prev) => ({ ...prev, ...data }))
      }
    } catch (e) {
      console.error('Failed to load settings in FinanceClient', e)
    }
  }, [])


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
      const query = new URLSearchParams()
      if (selectedFiscalYear && selectedFiscalYear !== 'ALL') {
        query.set('fiscalYear', selectedFiscalYear)
      }
      const res = await fetch(`/api/expense-categories?${query}`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingCategories(false)
    }
  }, [selectedFiscalYear])

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
    fetchSettings()
    fetchSummary()
    fetchCategories()
    fetchExpenses()
    fetchEntitiesAndRevenues()
  }, [fetchSettings, fetchSummary, fetchCategories, fetchExpenses, fetchEntitiesAndRevenues])


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

  // Submit Fund Transfer
  const handleSaveTransfer = async () => {
    const amt = parseFloat(transferForm.amount)
    if (isNaN(amt) || amt <= 0) {
      setTransferError('Only positive transfer amounts are permitted.')
      return
    }

    if (transferForm.fromAccountId === transferForm.toAccountId) {
      setTransferError('Source and destination accounts must be different.')
      return
    }

    const fromAcc = summary?.accounts.find((a) => a.id === transferForm.fromAccountId)
    if (fromAcc && fromAcc.currentBalance < amt) {
      setTransferError(
        `Insufficient balance in "${fromAcc.accountName}". Available balance: ₹${fromAcc.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}, requested: ₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Bank balance & Cash in hand cannot be negative.`
      )
      return
    }

    setTransferSaving(true)
    setTransferError(null)

    try {
      const res = await fetch('/api/finance/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transferForm,
          amount: amt,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setOpenTransferModal(false)
        setTransferForm({
          fromAccountId: '',
          toAccountId: '',
          amount: '',
          date: dayjs().format('YYYY-MM-DD'),
          referenceNo: '',
          notes: '',
        })
        fetchSummary()
      } else {
        setTransferError(data.error || 'Failed to transfer funds')
      }
    } catch (e: any) {
      setTransferError(e.message || 'Server error occurred')
    } finally {
      setTransferSaving(false)
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
          isVoucher: expenseFormMode === 'VOUCHER',
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
          title: 'Payment Vouchers & Expenses',
          subtitle: 'Record operating expenses, issue payment vouchers, and print formal voucher receipts',
          actions: (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  setExpenseFormMode('EXPENSE')
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
                Record Expense
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<ReceiptLongIcon />}
                onClick={() => {
                  setExpenseFormMode('VOUCHER')
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
                Issue Payment Voucher
              </Button>
            </Stack>
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
                    <Stack direction="row" spacing={1.5}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<SwapHorizIcon />}
                        onClick={() => {
                          setTransferForm({
                            fromAccountId: summary.accounts[0]?.id || '',
                            toAccountId: summary.accounts[1]?.id || summary.accounts[0]?.id || '',
                            amount: '',
                            date: dayjs().format('YYYY-MM-DD'),
                            referenceNo: '',
                            notes: '',
                          })
                          setTransferError(null)
                          setOpenTransferModal(true)
                        }}
                      >
                        Transfer Funds
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenAccountModal(true)}
                      >
                        Add Account
                      </Button>
                    </Stack>
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

      {/* ─── TAB 1: PAYMENT VOUCHERS & EXPENSES ─── */}
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
                sx={{ width: { xs: '100%', sm: 360 } }}
              />
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
                            No payment vouchers recorded matching your criteria.
                          </TableCell>
                        </TableRow>
                      ) : (
                        expenses.map((exp) => (
                          <TableRow key={exp.id} hover>
                            <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
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
                              <Tooltip title="View & Print Payment Voucher">
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => {
                                    setSelectedVoucherForPrint(exp)
                                    setOpenVoucherPrintModal(true)
                                  }}
                                >
                                  <ReceiptLongIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Voucher Record">
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
          <Grid container spacing={2.5}>
            {categories.map((cat) => {
              const expCount = cat.expenseCount !== undefined ? cat.expenseCount : (cat._count?.expenses || 0)
              const totalSpent = cat.totalAmount || 0
              const isOverBudget = cat.budgetLimit && totalSpent > cat.budgetLimit

              return (
                <Grid item xs={12} sm={6} md={4} key={cat.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: isOverBudget ? '1.5px solid #EF4444' : '1px solid #E2E8F0',
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', color: '#12446A' }}>
                          {cat.name}
                        </Typography>
                        <CategoryIcon sx={{ color: '#00897B' }} />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2, minHeight: 36, fontSize: '0.85rem' }}>
                        {cat.description || 'No description provided.'}
                      </Typography>

                      {/* Total Expenses Amount Box for Financial Year */}
                      <Box
                        sx={{
                          bgcolor: isOverBudget ? '#FEF2F2' : '#F8FAFC',
                          p: 1.75,
                          borderRadius: 2,
                          border: `1px solid ${isOverBudget ? '#FCA5A5' : '#E2E8F0'}`,
                          mb: 1.5,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                          Total Spent ({selectedFiscalYear && selectedFiscalYear !== 'ALL' ? `FY ${selectedFiscalYear}` : 'All Time'})
                        </Typography>
                        <Typography variant="h6" fontWeight={800} color={isOverBudget ? 'error.main' : '#0F172A'} sx={{ mt: 0.25 }}>
                          ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 1.5 }} />

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                          Logged Expenses: <strong style={{ color: '#0F172A' }}>{expCount}</strong>
                        </Typography>
                        {cat.budgetLimit && (
                          <Chip
                            label={`Limit: ₹${cat.budgetLimit.toLocaleString('en-IN')}`}
                            size="small"
                            color={isOverBudget ? 'error' : 'default'}
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
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

      {/* 2. Record Expense / Issue Payment Voucher Modal */}
      <Dialog open={openExpenseModal} onClose={() => setOpenExpenseModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedExpense
            ? 'Edit Expense / Payment Voucher Record'
            : expenseFormMode === 'EXPENSE'
            ? 'Record New Expense'
            : 'Issue Payment Voucher'}
        </DialogTitle>

        <DialogContent dividers>

          <Box sx={{ pt: 1 }}>
            {/* Voucher Limit Alert if amount exceeds limit */}
            {expenseFormMode === 'VOUCHER' &&
              expenseForm.amount &&
              parseFloat(expenseForm.amount) > parseFloat(orgSettings.voucher_max_limit || '50000') && (
                <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 2.5 }}>
                  Voucher amount (₹{parseFloat(expenseForm.amount).toLocaleString('en-IN')}) exceeds the maximum allowed
                  voucher limit of ₹{parseFloat(orgSettings.voucher_max_limit || '50000').toLocaleString('en-IN')} set in
                  Organization Settings.
                </Alert>
              )}

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  helperText={expenseFormMode === 'VOUCHER' ? ' ' : undefined}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Amount (₹)"
                  type="number"
                  fullWidth
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  helperText={
                    expenseFormMode === 'VOUCHER'
                      ? `Max amount ${parseFloat(orgSettings.voucher_max_limit || '50000').toLocaleString('en-IN')}`
                      : undefined
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Payee / Vendor Name"
                  fullWidth
                  placeholder="e.g. Kerala State Electricity Board, Office Landlord"
                  value={expenseForm.payeeName}
                  onChange={(e) => setExpenseForm({ ...expenseForm, payeeName: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Expense Category</InputLabel>
                  <Select
                    value={expenseForm.categoryId}
                    label="Expense Category"
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
                  label="Reference / UTR / Cheque No."
                  fullWidth
                  value={expenseForm.referenceNo}
                  onChange={(e) => setExpenseForm({ ...expenseForm, referenceNo: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Particulars / Description"
                  multiline
                  rows={2}
                  fullWidth
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>

          <Button onClick={() => setOpenExpenseModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveExpense}
            disabled={
              expenseFormMode === 'VOUCHER' &&
              !!(
                expenseForm.amount &&
                parseFloat(expenseForm.amount) > parseFloat(orgSettings.voucher_max_limit || '50000')
              )
            }
          >
            {expenseFormMode === 'EXPENSE' ? 'Save Expense' : 'Issue Voucher'}
          </Button>
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

      {/* 6. Formal Printable NGO Payment Voucher Modal */}
      <Dialog
        open={openVoucherPrintModal}
        onClose={() => setOpenVoucherPrintModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ReceiptLongIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Payment Voucher — {selectedVoucherForPrint?.voucherNo}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
            >
              Print Voucher
            </Button>
            <IconButton onClick={() => setOpenVoucherPrintModal(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: 'grey.100', p: 3 }}>
          {selectedVoucherForPrint && (
            <Paper
              id="printable-payment-voucher"
              elevation={2}
              sx={{
                p: 4,
                bgcolor: '#ffffff',
                maxWidth: 760,
                mx: 'auto',
                border: '2px solid #00897B',
                borderRadius: 2,
                fontFamily: 'Roboto, sans-serif',
              }}
            >
              {/* Header: Logo, Name, Address, Contact Phone & Email */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  pb: 2,
                  mb: 2,
                  borderBottom: '2px solid #00897B',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {orgSettings.org_logo ? (
                    <Box
                      component="img"
                      src={orgSettings.org_logo}
                      alt="Logo"
                      sx={{ width: 64, height: 64, objectFit: 'contain' }}
                    />
                  ) : null}
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#00897B', letterSpacing: '-0.02em' }}>
                      {orgSettings.org_name || 'Free Mind Foundation'}
                    </Typography>
                    {orgSettings.org_address && (
                      <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-line', fontSize: 13 }}>
                        {orgSettings.org_address}
                      </Typography>
                    )}
                    {(orgSettings.org_phone || orgSettings.org_email) && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontWeight: 500 }}>
                        {[orgSettings.org_phone ? `Phone: ${orgSettings.org_phone}` : '', orgSettings.org_email ? `Email: ${orgSettings.org_email}` : '']
                          .filter(Boolean)
                          .join(' | ')}
                      </Typography>
                    )}
                    {orgSettings.org_pan && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        PAN: {orgSettings.org_pan} {orgSettings.eighty_g_number ? `| 80G Reg: ${orgSettings.eighty_g_number}` : ''}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Voucher Number
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#00897B' }}>
                    {selectedVoucherForPrint.voucherNo}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Date: {dayjs(selectedVoucherForPrint.date).format('DD MMM YYYY')}
                  </Typography>
                  <Chip
                    label={`FY ${selectedVoucherForPrint.fiscalYear}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mt: 0.5, fontWeight: 700 }}
                  />
                </Box>
              </Box>

              {/* Voucher Title */}
              <Box sx={{ textAlign: 'center', my: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#004D40', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  PAYMENT VOUCHER
                </Typography>
              </Box>

              {/* Financial Transaction Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ my: 2, borderRadius: 1.5 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50', width: '30%' }}>Paid To (Payee)</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '1rem', color: 'primary.dark' }}>
                        {selectedVoucherForPrint.payeeName}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Debit Account (Category)</TableCell>
                      <TableCell>{selectedVoucherForPrint.category?.name || 'Expense Category'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Credit Account (Paid From)</TableCell>
                      <TableCell>{selectedVoucherForPrint.paymentAccount?.accountName || 'Cash in Hand / Bank'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Payment Mode & Reference</TableCell>
                      <TableCell>
                        {selectedVoucherForPrint.paymentMode}{' '}
                        {selectedVoucherForPrint.referenceNo ? `(Ref / UTR: ${selectedVoucherForPrint.referenceNo})` : ''}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Particulars / Description</TableCell>
                      <TableCell>{selectedVoucherForPrint.description || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Amount in Figures</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#D32F2F' }}>
                        ₹{Number(selectedVoucherForPrint.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Amount in Words</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontStyle: 'italic', color: 'text.primary' }}>
                        {numberToWords(selectedVoucherForPrint.amount)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Signatures Section */}
              <Box sx={{ mt: 5, pt: 2 }}>
                <Grid container spacing={2} sx={{ textAlign: 'center' }}>
                  <Grid item xs={3}>
                    <Box sx={{ borderTop: '1px solid #777', pt: 1, mt: 4 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Prepared By
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ borderTop: '1px solid #777', pt: 1, mt: 4 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Verified / Checked By
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ borderTop: '1px solid #777', pt: 1, mt: 4 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Receiver Signature
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ borderTop: '1px solid #777', pt: 1, mt: 4 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.dark', display: 'block' }}>
                        {orgSettings.signatory_name || 'Authorised Signatory'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {orgSettings.org_name || 'Trustee'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Print stylesheet override */}
              <style jsx global>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #printable-payment-voucher,
                  #printable-payment-voucher * {
                    visibility: visible;
                  }
                  #printable-payment-voucher {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    max-width: 100% !important;
                    box-shadow: none !important;
                    border: 2px solid #000 !important;
                  }
                }
              `}</style>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVoucherPrintModal(false)}>Close</Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Print Voucher
          </Button>
      </Dialog>

      {/* Transfer Funds Modal */}
      <Dialog open={openTransferModal} onClose={() => setOpenTransferModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#12446A', display: 'flex', alignItems: 'center', gap: 1 }}>
          <SwapHorizIcon color="primary" /> Transfer Funds Between Accounts
        </DialogTitle>
        <DialogContent dividers>
          {transferError && <Alert severity="error" sx={{ mb: 2 }}>{transferError}</Alert>}

          <Box display="flex" flexDirection="column" gap= {2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>From Account (Source)</InputLabel>
              <Select
                value={transferForm.fromAccountId}
                label="From Account (Source)"
                onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
              >
                {summary?.accounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>
                    {acc.accountName} — Available: ₹{acc.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>To Account (Destination)</InputLabel>
              <Select
                value={transferForm.toAccountId}
                label="To Account (Destination)"
                onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
              >
                {summary?.accounts
                  .filter((acc) => acc.id !== transferForm.fromAccountId)
                  .map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.accountName} — Current: ₹{acc.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              label="Transfer Amount (₹)"
              type="number"
              size="small"
              fullWidth
              value={transferForm.amount}
              onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
              helperText="Only positive transfer amounts are permitted"
            />

            <TextField
              label="Transfer Date"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={transferForm.date}
              onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })}
            />

            <TextField
              label="Reference / Cheque / UTR No"
              size="small"
              fullWidth
              placeholder="e.g. UTR123456 / Cash Withdrawal"
              value={transferForm.referenceNo}
              onChange={(e) => setTransferForm({ ...transferForm, referenceNo: e.target.value })}
            />

            <TextField
              label="Notes / Purpose"
              size="small"
              fullWidth
              multiline
              rows={2}
              placeholder="e.g. Cash withdrawal from SBI bank for petty cash box"
              value={transferForm.notes}
              onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenTransferModal(false)} disabled={transferSaving}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SwapHorizIcon />}
            onClick={handleSaveTransfer}
            disabled={transferSaving}
          >
            {transferSaving ? <CircularProgress size={20} color="inherit" /> : 'Confirm Transfer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

