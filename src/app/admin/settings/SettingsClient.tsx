'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Chip,
  Autocomplete,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Paper,
  Stack,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import BusinessIcon from '@mui/icons-material/Business'
import EmailIcon from '@mui/icons-material/Email'
import DownloadIcon from '@mui/icons-material/Download'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import TuneIcon from '@mui/icons-material/Tune'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import LockIcon from '@mui/icons-material/Lock'
import { can } from '@/lib/permissions'
import { getFiscalYearOptions } from '@/lib/utils'
import { DEFAULT_INDIAN_STATES, DEFAULT_PIPELINE_STAGES, PipelineStageConfig } from '@/lib/constants'

const DEFAULT_SETTINGS: Record<string, string> = {
  org_name: 'Free Mind Foundation',
  org_logo: '',
  org_signature: '',
  org_qr_code: '',
  org_address: '',
  org_phone: '',
  org_email: '',
  org_pan: '',
  eighty_g_number: '',
  eighty_g_validity: '',
  fcra_number: '',
  signatory_name: '',
  signatory_title: 'Authorised Signatory',
  receipt_prefix: 'FMF',
  voucher_max_limit: '50000',
  fy_start_month: '4',

  active_fiscal_year: '2026-27',
  locked_fiscal_years: '[]',
  email_provider: 'resend',
  email_api_key: '',
  email_from: 'no-reply@freemindfoundation.org.in',
  email_from_name: 'Free Mind Foundation',
  form_states: JSON.stringify(DEFAULT_INDIAN_STATES),
  form_districts: '{}',
  volunteer_availabilities: '[]',
  volunteer_skills: '[]',
  volunteer_interests: '[]',
  volunteer_contributions: '[]',
  volunteer_pipeline_stages: JSON.stringify(DEFAULT_PIPELINE_STAGES),
  roles_GOVERNING_BOARD: '["Chairperson", "Vice Chairperson", "Secretary", "Treasurer", "Member", "Advisor"]',
  roles_EXECUTIVE_TEAM: '["Executive Director", "Operations Head", "Finance Head", "Member"]',
  roles_DEPARTMENT: '["Head of Department", "Coordinator", "Member"]',
  roles_REGIONAL_NETWORK: '["State Head", "Regional Coordinator", "Member"]',
  roles_GENERAL_GOVERNANCE: '["State Head", "Secretary", "Member"]',
  roles_COMMITTEE: '["Chairperson", "State Head", "Member"]',
  meeting_types: '["BOARD", "COMMITTEE", "GENERAL_BODY", "AD_HOC"]',
}

export default function SettingsClient() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  const canEdit = can(session?.user?.role || '', 'settings', 'update')

  const [tab, setTab] = useState(0)

  useEffect(() => {
    if (tabParam === 'fiscal' || tabParam === '1') setTab(1)
    else if (tabParam === 'email' || tabParam === '2') setTab(2)
    else if (tabParam === 'form' || tabParam === '3') setTab(3)
    else if (tabParam === 'pipeline' || tabParam === '4') setTab(4)
    else if (tabParam === 'backup' || tabParam === '5') setTab(5)
    else setTab(0)
  }, [tabParam])

  const handleTabChange = (_: React.SyntheticEvent, val: number) => {
    setTab(val)
    const tabKeys = ['org', 'fiscal', 'email', 'form', 'pipeline', 'backup']
    router.push(`/admin/settings?tab=${tabKeys[val]}`)
  }
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [testEmail, setTestEmail] = useState('freemindfoundation786@gmail.com')
  const [testEmailSending, setTestEmailSending] = useState(false)

  const handleSendTestEmail = async () => {
    setTestEmailSending(true)
    try {
      const res = await fetch('/api/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: testEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send test email')
      setMsg({ type: 'success', text: data.message })
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setTestEmailSending(false)
    }
  }

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings({ ...DEFAULT_SETTINGS, ...data })
        setLoading(false)
      })
  }, [])

  const set = (key: string, value: string) => setSettings((prev) => ({ ...prev, [key]: value }))

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const formData = new FormData()
      formData.append('file', file)

      setSaving(true)
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (res.ok && data.path) {
          set('org_logo', data.path)
          setMsg({ type: 'success', text: 'Logo uploaded. Remember to click Save All Changes.' })
        } else {
          setMsg({ type: 'error', text: data.error || 'Failed to upload logo.' })
        }
      } catch (err) {
        setMsg({ type: 'error', text: 'Error uploading logo.' })
      } finally {
        setSaving(false)
      }
    }
  }

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const formData = new FormData()
      formData.append('file', file)

      setSaving(true)
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (res.ok && data.path) {
          set('org_signature', data.path)
          setMsg({ type: 'success', text: 'Authorized Signature uploaded. Remember to click Save All Changes.' })
        } else {
          setMsg({ type: 'error', text: data.error || 'Failed to upload signature.' })
        }
      } catch (err) {
        setMsg({ type: 'error', text: 'Error uploading signature.' })
      } finally {
        setSaving(false)
      }
    }
  }

  const handleQrCodeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const formData = new FormData()
      formData.append('file', file)

      setSaving(true)
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (res.ok && data.path) {
          set('org_qr_code', data.path)
          setMsg({ type: 'success', text: 'Verification QR Code uploaded. Remember to click Save All Changes.' })
        } else {
          setMsg({ type: 'error', text: data.error || 'Failed to upload QR Code.' })
        }
      } catch (err) {
        setMsg({ type: 'error', text: 'Error uploading QR Code.' })
      } finally {
        setSaving(false)
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      setMsg(
        res.ok
          ? { type: 'success', text: 'Settings saved successfully.' }
          : { type: 'error', text: 'Failed to save settings.' }
      )
    } finally {
      setSaving(false)
    }
    setTimeout(() => setMsg(null), 5000)
  }

  // Financial Year helper methods
  const getLockedFYs = (): string[] => {
    try {
      const parsed = JSON.parse(settings.locked_fiscal_years || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      return []
    }
  }

  const toggleLockFY = (fy: string) => {
    const currentLocked = getLockedFYs()
    let updated: string[]
    if (currentLocked.includes(fy)) {
      updated = currentLocked.filter((item) => item !== fy)
    } else {
      updated = [...currentLocked, fy]
    }
    set('locked_fiscal_years', JSON.stringify(updated))
  }

  // Pipeline stage helper methods
  const getPipelineStages = (): PipelineStageConfig[] => {
    try {
      const parsed = JSON.parse(settings.volunteer_pipeline_stages || '[]')
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    } catch (e) {}
    return DEFAULT_PIPELINE_STAGES
  }

  const updatePipelineStages = (stages: PipelineStageConfig[]) => {
    set('volunteer_pipeline_stages', JSON.stringify(stages))
  }

  const handleStageChange = (index: number, field: keyof PipelineStageConfig, value: any) => {
    const current = [...getPipelineStages()]
    current[index] = { ...current[index], [field]: value }
    updatePipelineStages(current)
  }

  const moveStage = (index: number, direction: 'up' | 'down') => {
    const current = [...getPipelineStages()]
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= current.length) return
    // Prevent moving mandatory endpoints beyond boundary
    const temp = current[index]
    current[index] = current[targetIdx]
    current[targetIdx] = temp
    updatePipelineStages(current)
  }

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )

  if (!isSuperAdmin) {
    return (
      <Box>
        <Alert severity="warning">Settings are accessible to Super Admin only.</Alert>
      </Box>
    )
  }

  const pipelineStages = getPipelineStages()

  const getTabHeader = () => {
    switch (tab) {
      case 1:
        return {
          title: 'Donations, 80G & Financial Year Governance',
          subtitle: 'Tax exemption registration, receipt numbering, default financial year, and audit locks',
        }
      case 2:
        return {
          title: 'Email Dispatch & Provider Config',
          subtitle: 'Configure transactional email delivery via Resend, Brevo, or SendGrid',
        }
      case 3:
        return {
          title: 'Form Options & Governance Roles',
          subtitle: 'Manage Indian states, districts, volunteer choices, and committee governance roles',
        }
      case 4:
        return {
          title: 'Volunteer Pipeline Stages',
          subtitle: 'Configure stages for volunteer onboarding and verification workflow',
        }
      case 5:
        return {
          title: 'Automated Database Backups & Retention',
          subtitle: 'Daily 2:00 AM database backups, 7-day auto-pruning retention policy, and instant database downloads',
        }
      default:
        return {
          title: 'Organization Identity & Legal Details',
          subtitle: 'Configure trust name, logo, PAN, FCRA, and official signatory details',
        }
    }
  }

  const headerInfo = getTabHeader()

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
            {headerInfo.title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {headerInfo.subtitle}
          </Typography>
        </Box>
        {canEdit && (
          <Button
            id="save-settings-btn"
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save All Changes'}
          </Button>
        )}
      </Box>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Organization Identity" />
          <Tab label="Donations & 80G" />
          <Tab label="Email Dispatch" />
          <Tab label="Form Options" />
          <Tab label="Volunteer Pipeline" />
          <Tab label="Database Backups & Retention" />
        </Tabs>
      </Box>



      {/* Organization Tab */}
      {tab === 0 && (
        <Card>
          <CardHeader title="Trust / Organization Details" subheader="Used in 80G donation receipts, financial vouchers, and official communications" />
          <Divider />
          <CardContent>
            <Grid container spacing={2.5}>
              {/* Logo & Signature Uploads Row */}
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                  Organization Logo
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {settings.org_logo ? (
                    <Box
                      component="img"
                      src={settings.org_logo}
                      alt="Logo"
                      sx={{
                        width: 72,
                        height: 72,
                        objectFit: 'contain',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1.5,
                        p: 0.5,
                        bgcolor: '#fafafa',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        bgcolor: 'grey.100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px dashed',
                        borderColor: 'grey.400',
                        borderRadius: 1.5,
                      }}
                    >
                      <BusinessIcon color="disabled" />
                    </Box>
                  )}
                  {canEdit && (
                    <Stack spacing={1}>
                      <Button variant="outlined" component="label" size="small">
                        Upload Logo
                        <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        PNG or JPG image
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                  Authorized Signature
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {settings.org_signature ? (
                    <Box
                      component="img"
                      src={settings.org_signature}
                      alt="Signature"
                      sx={{
                        width: 90,
                        height: 72,
                        objectFit: 'contain',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1.5,
                        p: 0.5,
                        bgcolor: '#ffffff',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 90,
                        height: 72,
                        bgcolor: 'grey.100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px dashed',
                        borderColor: 'grey.400',
                        borderRadius: 1.5,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">No Signature</Typography>
                    </Box>
                  )}
                  {canEdit && (
                    <Stack spacing={1}>
                      <Button variant="outlined" component="label" size="small">
                        Upload Signature
                        <input type="file" hidden accept="image/*" onChange={handleSignatureUpload} />
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        Digital signature / stamp
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                  Verification QR Code
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {settings.org_qr_code ? (
                    <Box
                      component="img"
                      src={settings.org_qr_code}
                      alt="QR Code"
                      sx={{
                        width: 72,
                        height: 72,
                        objectFit: 'contain',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1.5,
                        p: 0.5,
                        bgcolor: '#ffffff',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        bgcolor: 'grey.100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px dashed',
                        borderColor: 'grey.400',
                        borderRadius: 1.5,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">No QR</Typography>
                    </Box>
                  )}
                  {canEdit && (
                    <Stack spacing={1}>
                      <Button variant="outlined" component="label" size="small">
                        Upload QR Code
                        <input type="file" hidden accept="image/*" onChange={handleQrCodeUpload} />
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        Verification QR image
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Organization Name"
                  fullWidth
                  value={settings.org_name}
                  onChange={(e) => set('org_name', e.target.value)}
                  disabled={!canEdit}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Signatory / Trustee Name"
                  fullWidth
                  value={settings.signatory_name}
                  onChange={(e) => set('signatory_name', e.target.value)}
                  disabled={!canEdit}
                  helperText="Name printed under signature block on 80G receipts"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Signatory Role / Designation Title"
                  fullWidth
                  value={settings.signatory_title || ''}
                  onChange={(e) => set('signatory_title', e.target.value)}
                  disabled={!canEdit}
                  helperText="e.g. Authorised Signatory / Managing Trustee / Treasurer"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Phone Number"
                  fullWidth
                  value={settings.org_phone || ''}
                  onChange={(e) => set('org_phone', e.target.value)}
                  disabled={!canEdit}
                  helperText="Displayed on receipts, invoices & vouchers"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Email Address"
                  fullWidth
                  value={settings.org_email || ''}
                  onChange={(e) => set('org_email', e.target.value)}
                  disabled={!canEdit}
                  helperText="Official email displayed on receipts & vouchers"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="PAN Number"
                  fullWidth
                  value={settings.org_pan}
                  onChange={(e) => set('org_pan', e.target.value.toUpperCase())}
                  disabled={!canEdit}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Registered Address"
                  fullWidth
                  multiline
                  rows={3}
                  value={settings.org_address}
                  onChange={(e) => set('org_address', e.target.value)}
                  disabled={!canEdit}
                  helperText="Official registered address printed in receipt header"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="FCRA Registration Number"
                  fullWidth
                  value={settings.fcra_number}
                  onChange={(e) => set('fcra_number', e.target.value)}
                  disabled={!canEdit}
                  helperText="Optional (if accepting foreign contributions)"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Donations & 80G Tab */}
      {tab === 1 && (
        <Stack spacing={3}>
          {/* Payment Voucher & Financial Limits */}
          <Card>
            <CardHeader
              title="Voucher & Payment Transaction Controls"
              subheader="Configure maximum permissible limits for financial vouchers and disbursements"
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Maximum Voucher Amount Limit (₹)"
                    fullWidth
                    type="number"
                    value={settings.voucher_max_limit || '50000'}
                    onChange={(e) => set('voucher_max_limit', e.target.value)}
                    disabled={!canEdit}
                    helperText="Maximum transaction limit permitted per payment voucher generated in Finance."
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary', fontWeight: 600 }}>₹</Typography>,
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="80G & Receipt Configuration"
              subheader="Tax exemption registration & financial year settings"
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="80G Order / Registration Number"
                    fullWidth
                    value={settings.eighty_g_number}
                    onChange={(e) => set('eighty_g_number', e.target.value)}
                    disabled={!canEdit}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="80G Validity / Period"
                    fullWidth
                    value={settings.eighty_g_validity}
                    onChange={(e) => set('eighty_g_validity', e.target.value)}
                    disabled={!canEdit}
                    placeholder="e.g. AY 2024-25 to 2026-27 or Perpetual"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Receipt Number Prefix"
                    fullWidth
                    value={settings.receipt_prefix}
                    onChange={(e) => set('receipt_prefix', e.target.value.toUpperCase())}
                    disabled={!canEdit}
                    helperText="Prefix (e.g. FMF)"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth disabled={!canEdit}>
                    <InputLabel>Active Default Financial Year</InputLabel>
                    <Select
                      label="Active Default Financial Year"
                      value={settings.active_fiscal_year || '2026-27'}
                      onChange={(e) => set('active_fiscal_year', e.target.value)}
                    >
                      {getFiscalYearOptions().map((fy) => (
                        <MenuItem key={fy} value={fy}>
                          FY {fy}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth disabled={!canEdit}>
                    <InputLabel>Financial Year Start Month</InputLabel>
                    <Select
                      label="Financial Year Start Month"
                      value={settings.fy_start_month}
                      onChange={(e) => set('fy_start_month', e.target.value)}
                    >
                      <MenuItem value="1">January (Calendar Year)</MenuItem>
                      <MenuItem value="4">April (Indian Financial Year)</MenuItem>
                      <MenuItem value="7">July</MenuItem>
                      <MenuItem value="10">October</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

              </Grid>
            </CardContent>
          </Card>

          {/* Financial Year Audit Locking Registry */}
          <Card>
            <CardHeader
              title="Financial Year Governance & Audit Locks"
              subheader="Lock closed financial years to protect audited financial entries against unauthorized alterations"
            />
            <Divider />
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Locking a Financial Year prevents modifications to expenses, revenues, and receipt vouchers for audit compliance.
              </Typography>
              <Stack spacing={1.5}>
                {getFiscalYearOptions().map((fy) => {
                  const isLocked = getLockedFYs().includes(fy)
                  const isActive = settings.active_fiscal_year === fy

                  return (
                    <Paper
                      key={fy}
                      variant="outlined"
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderRadius: 2,
                        borderColor: isLocked ? 'error.light' : 'divider',
                        bgcolor: isLocked ? 'error.50' : 'background.paper',
                      }}
                    >
                      <Box>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            Financial Year {fy}
                          </Typography>
                          {isActive && <Chip label="ACTIVE DEFAULT" size="small" color="primary" sx={{ fontWeight: 700 }} />}
                          {isLocked ? (
                            <Chip label="LOCKED FOR AUDIT" size="small" color="error" icon={<LockIcon />} sx={{ fontWeight: 700 }} />
                          ) : (
                            <Chip label="OPEN FOR EDITS" size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
                          )}
                        </Stack>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                          Period: 01 Apr {fy.split('-')[0]} — 31 Mar 20{fy.split('-')[1]}
                        </Typography>
                      </Box>
                      {canEdit && (
                        <Button
                          size="small"
                          variant={isLocked ? 'outlined' : 'contained'}
                          color={isLocked ? 'primary' : 'warning'}
                          startIcon={isLocked ? <CheckCircleOutlineIcon /> : <LockIcon />}
                          onClick={() => toggleLockFY(fy)}
                        >
                          {isLocked ? 'Unlock FY' : 'Lock FY'}
                        </Button>
                      )}
                    </Paper>
                  )
                })}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* Email Tab */}
      {tab === 2 && (
        <Stack spacing={3}>
          <Card>
            <CardHeader
              title="Email Provider Settings"
              subheader="Configure transactional email delivery (Resend / Brevo / SendGrid / SMTP)"
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={!canEdit}>
                    <InputLabel>Email Provider</InputLabel>
                    <Select
                      name="email_provider"
                      value={settings.email_provider}
                      onChange={(e) => set('email_provider', e.target.value)}
                      label="Email Provider"
                    >
                      <MenuItem value="resend">Resend (REST API)</MenuItem>
                      <MenuItem value="brevo">Brevo (formerly Sendinblue)</MenuItem>
                      <MenuItem value="sendgrid">SendGrid</MenuItem>
                      <MenuItem value="smtp">Custom SMTP</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="API Key / Password"
                    type="password"
                    fullWidth
                    value={settings.email_api_key}
                    onChange={(e) => set('email_api_key', e.target.value)}
                    disabled={!canEdit}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="From Email"
                    fullWidth
                    type="email"
                    value={settings.email_from}
                    onChange={(e) => set('email_from', e.target.value)}
                    disabled={!canEdit}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="From Sender Name"
                    fullWidth
                    value={settings.email_from_name}
                    onChange={(e) => set('email_from_name', e.target.value)}
                    disabled={!canEdit}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Test Email Dispatch & Provider Diagnostics"
              subheader="Verify that your API keys and transactional email settings are sending correctly"
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2.5} alignItems="center">
                <Grid item xs={12} sm={8}>
                  <TextField
                    label="Test Recipient Email Address"
                    fullWidth
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    helperText="A diagnostic test message will be sent to this email address using current provider settings."
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    size="large"
                    onClick={handleSendTestEmail}
                    disabled={testEmailSending || !testEmail}
                    startIcon={testEmailSending ? <CircularProgress size={20} color="inherit" /> : undefined}
                  >
                    {testEmailSending ? 'Sending Test Email...' : 'Send Test Email'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* Form Options & States Tab */}
      {tab === 3 && (
        <Card>
          <CardHeader
            title="Form Options"
            subheader="Manage predefined options available across member & volunteer registration forms"
          />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              {/* General Form Dropdowns */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  General Form Dropdowns
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  These options are shared across both Member and Volunteer registration forms.
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={JSON.parse(settings.form_genders || '["Male", "Female", "Other"]')}
                  onChange={(_, newValue) => set('form_genders', JSON.stringify(newValue))}
                  disabled={!canEdit}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index })
                      return <Chip variant="outlined" label={option} key={key} {...tagProps} />
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Gender Options"
                      placeholder="Type and press enter"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={JSON.parse(settings.form_educations || '["High School", "Bachelor\'s Degree", "Master\'s Degree", "Doctorate"]')}
                  onChange={(_, newValue) => set('form_educations', JSON.stringify(newValue))}
                  disabled={!canEdit}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index })
                      return <Chip variant="outlined" label={option} key={key} {...tagProps} />
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Education Levels"
                      placeholder="Type and press enter"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Volunteer Options */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  Volunteer Registration Form Dropdowns
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={JSON.parse(settings.volunteer_availabilities || '[]')}
                  onChange={(_, newValue) => set('volunteer_availabilities', JSON.stringify(newValue))}
                  disabled={!canEdit}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index })
                      return <Chip variant="outlined" label={option} key={key} {...tagProps} />
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Availability Options"
                      placeholder="Type and press enter"
                      helperText="e.g. Weekends, Evenings, 5 hours/week"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={JSON.parse(settings.volunteer_skills || '[]')}
                  onChange={(_, newValue) => set('volunteer_skills', JSON.stringify(newValue))}
                  disabled={!canEdit}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index })
                      return <Chip variant="outlined" label={option} key={key} {...tagProps} />
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Skills Options"
                      placeholder="Type and press enter"
                      helperText="e.g. Counselling, Social Media, Field Operations"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={JSON.parse(settings.volunteer_interests || '[]')}
                  onChange={(_, newValue) => set('volunteer_interests', JSON.stringify(newValue))}
                  disabled={!canEdit}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index })
                      return <Chip variant="outlined" label={option} key={key} {...tagProps} />
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Interests Options"
                      placeholder="Type and press enter"
                      helperText="e.g. Youth Programs, Mental Health Awareness, Community Outreach"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={JSON.parse(settings.volunteer_contributions || '[]')}
                  onChange={(_, newValue) => set('volunteer_contributions', JSON.stringify(newValue))}
                  disabled={!canEdit}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index })
                      return <Chip variant="outlined" label={option} key={key} {...tagProps} />
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Contribution Options"
                      placeholder="Type and press enter"
                      helperText="e.g. Weekly field visits, Remote work, Weekend events"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Committee Roles */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  Organization Structure Roles
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  These roles will appear in the dropdown when assigning volunteers to different parts of the organization structure.
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={JSON.parse(settings.roles_GOVERNING_BOARD || '[]')}
                  onChange={(_, newValue) => set('roles_GOVERNING_BOARD', JSON.stringify(newValue))}
                  disabled={!canEdit}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index })
                      return <Chip variant="outlined" label={option} key={key} {...tagProps} />
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Governing Board Roles"
                      placeholder="Type and press enter"
                      helperText="e.g. Chairperson, Secretary, Treasurer, Member"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={JSON.parse(settings.roles_EXECUTIVE_TEAM || '[]')}
                  onChange={(_, newValue) => set('roles_EXECUTIVE_TEAM', JSON.stringify(newValue))}
                  disabled={!canEdit}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index })
                      return <Chip variant="outlined" label={option} key={key} {...tagProps} />
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Executive Team Roles"
                      placeholder="Type and press enter"
                      helperText="e.g. Executive Director, Operations Head, Member"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={JSON.parse(settings.roles_DEPARTMENT || '[]')}
                  onChange={(_, newValue) => set('roles_DEPARTMENT', JSON.stringify(newValue))}
                  disabled={!canEdit}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index })
                      return <Chip variant="outlined" label={option} key={key} {...tagProps} />
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Department Roles"
                      placeholder="Type and press enter"
                      helperText="e.g. Head of Department, Coordinator, Member"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={JSON.parse(settings.roles_REGIONAL_NETWORK || '[]')}
                  onChange={(_, newValue) => set('roles_REGIONAL_NETWORK', JSON.stringify(newValue))}
                  disabled={!canEdit}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index })
                      return <Chip variant="outlined" label={option} key={key} {...tagProps} />
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Regional Network Roles"
                      placeholder="Type and press enter"
                      helperText="e.g. State Head, Regional Coordinator, Member"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={JSON.parse(settings.roles_GENERAL_GOVERNANCE || '[]')}
                  onChange={(_, newValue) => set('roles_GENERAL_GOVERNANCE', JSON.stringify(newValue))}
                  disabled={!canEdit}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index })
                      return <Chip variant="outlined" label={option} key={key} {...tagProps} />
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="General Governance Roles"
                      placeholder="Type and press enter"
                      helperText="e.g. State Head, Secretary, Member"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={JSON.parse(settings.roles_COMMITTEE || '[]')}
                  onChange={(_, newValue) => set('roles_COMMITTEE', JSON.stringify(newValue))}
                  disabled={!canEdit}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index })
                      return <Chip variant="outlined" label={option} key={key} {...tagProps} />
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Standard Committee Roles"
                      placeholder="Type and press enter"
                      helperText="e.g. Chairperson, State Head, Member"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Meeting Types */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  Meeting Types
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  These types will appear in the dropdown when creating new Meeting Minutes.
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={JSON.parse(settings.meeting_types || '[]')}
                  onChange={(_, newValue) => set('meeting_types', JSON.stringify(newValue))}
                  disabled={!canEdit}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index })
                      return <Chip variant="outlined" label={option} key={key} {...tagProps} />
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Meeting Types"
                      placeholder="Type and press enter"
                      helperText="e.g. BOARD, COMMITTEE, GENERAL_BODY"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Volunteer Pipeline Tab */}
      {tab === 4 && (
        <Card>
          <CardHeader
            title="Volunteer Onboarding Pipeline Management"
            subheader="Customize the stages, titles, instructions, and order applicants progress through from application to approval"
            action={
              canEdit && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RestartAltIcon />}
                  onClick={() => updatePipelineStages(DEFAULT_PIPELINE_STAGES)}
                  sx={{ mt: 1, mr: 1 }}
                >
                  Reset Default Stages
                </Button>
              )
            }
          />
          <Divider />
          <CardContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              When a stage is passed by staff/admin, the applicant progresses to the next enabled stage in this list.
              Upon reaching and passing the final <strong>Approved</strong> stage, portal credentials and invite tokens
              are automatically generated.
            </Alert>

            <Stack spacing={2.5}>
              {pipelineStages.map((stageItem, index) => {
                const isFirst = index === 0
                const isLast = index === pipelineStages.length - 1
                const isMandatory = stageItem.key === 'APPLICATION' || stageItem.key === 'APPROVED'

                return (
                  <Paper
                    key={stageItem.key}
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: stageItem.enabled ? '#FFFFFF' : '#F8FAFC',
                      borderColor: stageItem.enabled ? 'divider' : '#E2E8F0',
                      opacity: stageItem.enabled ? 1 : 0.75,
                      boxShadow: stageItem.enabled ? '0 1px 4px rgba(0,0,0,0.03)' : 'none',
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      {/* Order & Status Badges */}
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: stageItem.enabled ? '#12446A' : '#94A3B8',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              flexShrink: 0,
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1E293B' }}>
                              {stageItem.key}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                              {isMandatory ? (
                                <Chip
                                  icon={<LockIcon sx={{ fontSize: '13px !important' }} />}
                                  label="Required"
                                  size="small"
                                  color="default"
                                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                                />
                              ) : (
                                <Chip
                                  icon={stageItem.enabled ? <CheckCircleOutlineIcon sx={{ fontSize: '13px !important' }} /> : undefined}
                                  label={stageItem.enabled ? 'Active' : 'Disabled / Skipped'}
                                  size="small"
                                  color={stageItem.enabled ? 'success' : 'default'}
                                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Stage Label & Description */}
                      <Grid item xs={12} sm={6}>
                        <Stack spacing={1.5}>
                          <TextField
                            label="Display Label / Step Title"
                            size="small"
                            fullWidth
                            value={stageItem.label}
                            onChange={(e) => handleStageChange(index, 'label', e.target.value)}
                            disabled={!canEdit}
                          />
                          <TextField
                            label="Reviewer Guidelines & Description"
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            value={stageItem.description || ''}
                            onChange={(e) => handleStageChange(index, 'description', e.target.value)}
                            disabled={!canEdit}
                            placeholder="What reviewers or coordinators should check in this stage"
                          />
                        </Stack>
                      </Grid>

                      {/* Controls (Toggle & Reorder) */}
                      <Grid item xs={12} sm={3}>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: { xs: 'flex-start', sm: 'flex-end' },
                            gap: 1,
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Switch
                                checked={stageItem.enabled}
                                onChange={(e) => handleStageChange(index, 'enabled', e.target.checked)}
                                disabled={!canEdit || isMandatory}
                                color="primary"
                              />
                            }
                            label={stageItem.enabled ? 'Enabled' : 'Disabled'}
                            sx={{ mr: 0 }}
                          />

                          {canEdit && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Move Stage Up">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => moveStage(index, 'up')}
                                    disabled={isFirst || index === 1} // Keep APPLICATION at top
                                  >
                                    <ArrowUpwardIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Move Stage Down">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => moveStage(index, 'down')}
                                    disabled={isLast || index === pipelineStages.length - 2} // Keep APPROVED at bottom
                                  >
                                    <ArrowDownwardIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                )
              })}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Database Backup Tab */}
      {tab === 5 && (
        <Stack spacing={3}>
          <Card>
            <CardHeader
              title="Automated 2:00 AM Database Backup & 7-Day Retention"
              subheader="System-level automated MySQL database backups with automatic 7-day retention cleanup"
            />
            <Divider />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                    <Typography variant="caption" color="#166534" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                      AUTOMATED BACKUP SCHEDULE
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="#14532D">
                      Daily at 2:00 AM
                    </Typography>
                    <Chip label="Active Cron (0 2 * * *)" color="success" size="small" sx={{ mt: 1, fontWeight: 700 }} />
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#FEF3C7', borderColor: '#FDE68A' }}>
                    <Typography variant="caption" color="#92400E" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                      RETENTION & CLEANUP POLICY
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="#78350F">
                      7-Day Auto-Cleanup
                    </Typography>
                    <Chip label="Auto-Prunes > 7 Days" color="warning" size="small" sx={{ mt: 1, fontWeight: 700 }} />
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#F0F9FF', borderColor: '#BAE6FD' }}>
                    <Typography variant="caption" color="#075985" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                      BACKUP FORMAT & STORAGE
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="#0C4A6E">
                      GZIP Compressed (.sql.gz)
                    </Typography>
                    <Chip label="Location: /root/fmf-backups" color="info" size="small" sx={{ mt: 1, fontWeight: 700 }} />
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Instant Database Export & Manual Backup Download"
              subheader="Generate and download a complete JSON/SQL database dump directly to your web browser"
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Full System Database Export
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Downloads an instant backup snapshot containing all members, volunteers, donations, expenses, meeting minutes, and system settings.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<DownloadIcon />}
                  onClick={() => window.open('/api/settings/backup/download', '_blank')}
                  sx={{ px: 3, py: 1.2, fontWeight: 700, whiteSpace: 'nowrap' }}
                >
                  Download Database Backup
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  )
}
