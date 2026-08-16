'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import TuneIcon from '@mui/icons-material/Tune'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import LockIcon from '@mui/icons-material/Lock'
import { can } from '@/lib/permissions'
import { DEFAULT_INDIAN_STATES, DEFAULT_PIPELINE_STAGES, PipelineStageConfig } from '@/lib/constants'

const DEFAULT_SETTINGS: Record<string, string> = {
  org_name: 'Free Mind Foundation',
  org_logo: '',
  org_address: '',
  org_pan: '',
  eighty_g_number: '',
  eighty_g_validity: '',
  fcra_number: '',
  signatory_name: '',
  receipt_prefix: 'FMF',
  fy_start_month: '4',
  email_provider: 'brevo',
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
}

export default function SettingsClient() {
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  const canEdit = can(session?.user?.role || '', 'settings', 'update')

  const [tab, setTab] = useState(0)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [selectedDistrictState, setSelectedDistrictState] = useState<string>('')

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
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: -0.5 }}>
            Organization Settings
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Configure organization identity, 80G tax settings, email dispatch, and volunteer workflow stages.
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

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab icon={<BusinessIcon fontSize="small" />} iconPosition="start" label="Organization" />
        <Tab icon={<ReceiptLongIcon fontSize="small" />} iconPosition="start" label="Donations & 80G" />
        <Tab icon={<EmailIcon fontSize="small" />} iconPosition="start" label="Email" />
        <Tab icon={<TuneIcon fontSize="small" />} iconPosition="start" label="Form Options & States" />
        <Tab icon={<AccountTreeIcon fontSize="small" />} iconPosition="start" label="Volunteer Pipeline" />
      </Tabs>

      {/* Organization Tab */}
      {tab === 0 && (
        <Card>
          <CardHeader title="Trust / Organization Details" subheader="Used in 80G receipts and official documents" />
          <Divider />
          <CardContent>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Organization Logo
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {settings.org_logo ? (
                    <Box
                      component="img"
                      src={settings.org_logo}
                      alt="Logo"
                      sx={{
                        width: 64,
                        height: 64,
                        objectFit: 'contain',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: 'grey.100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px dashed',
                        borderColor: 'grey.400',
                        borderRadius: 1,
                      }}
                    >
                      <BusinessIcon color="disabled" />
                    </Box>
                  )}
                  {canEdit && (
                    <Button variant="outlined" component="label" size="small">
                      Upload Logo
                      <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                    </Button>
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
                  helperText="Printed on receipts & formal communications"
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
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Receipt Number Prefix"
                  fullWidth
                  value={settings.receipt_prefix}
                  onChange={(e) => set('receipt_prefix', e.target.value.toUpperCase())}
                  disabled={!canEdit}
                  helperText="Generated receipts will look like: FMF-2024-0001"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
      )}

      {/* Email Tab */}
      {tab === 2 && (
        <Card>
          <CardHeader
            title="Email Provider Settings"
            subheader="Configure transactional email delivery (Brevo / SendGrid / SMTP)"
          />
          <Divider />
          <CardContent>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!canEdit}>
                  <InputLabel>Email Provider</InputLabel>
                  <Select
                    label="Email Provider"
                    value={settings.email_provider}
                    onChange={(e) => set('email_provider', e.target.value)}
                  >
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
      )}

      {/* Form Options & States Tab */}
      {tab === 3 && (
        <Card>
          <CardHeader
            title="Form Options & State Master"
            subheader="Manage states dropdown and predefined options available across member & volunteer registration forms"
          />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              {/* States Management */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    State & Union Territory Options
                  </Typography>
                  {canEdit && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<RestartAltIcon />}
                      onClick={() => set('form_states', JSON.stringify(DEFAULT_INDIAN_STATES))}
                    >
                      Reset to All 36 Indian States & UTs
                    </Button>
                  )}
                </Box>
                <Autocomplete
                  multiple
                  freeSolo
                  options={DEFAULT_INDIAN_STATES}
                  value={JSON.parse(settings.form_states || JSON.stringify(DEFAULT_INDIAN_STATES))}
                  onChange={(_, newValue) => set('form_states', JSON.stringify(newValue))}
                  disabled={!canEdit}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index })
                      return <Chip variant="outlined" color="primary" label={option} key={key} {...tagProps} />
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Available States & UTs"
                      placeholder="Type state name and press Enter to add"
                      helperText="Used in public Member & Volunteer registration forms, and admin management forms"
                    />
                  )}
                />
              </Grid>

              {/* District Management */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  District Options by State
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Autocomplete
                      options={JSON.parse(settings.form_states || JSON.stringify(DEFAULT_INDIAN_STATES))}
                      value={selectedDistrictState || null}
                      onChange={(_, newValue) => setSelectedDistrictState(newValue || '')}
                      renderInput={(params) => (
                        <TextField {...params} label="Select State" placeholder="Select a state first" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <Autocomplete
                      multiple
                      freeSolo
                      disabled={!selectedDistrictState || !canEdit}
                      options={[]}
                      value={(JSON.parse(settings.form_districts || '{}')[selectedDistrictState] || []) as string[]}
                      onChange={(_, newValue) => {
                        const currentDistricts = JSON.parse(settings.form_districts || '{}');
                        currentDistricts[selectedDistrictState] = newValue;
                        set('form_districts', JSON.stringify(currentDistricts));
                      }}
                      renderTags={(value: readonly string[], getTagProps) =>
                        value.map((option: string, index: number) => {
                          const { key, ...tagProps } = getTagProps({ index })
                          return <Chip variant="outlined" color="primary" label={option} key={key} {...tagProps} />
                        })
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Districts"
                          placeholder={selectedDistrictState ? "Type district name and press Enter to add" : "Select a state to add districts"}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider />
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
    </Box>
  )
}
