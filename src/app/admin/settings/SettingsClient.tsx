'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box, Typography, TextField, Button, Grid, Card, CardContent, CardHeader,
  Divider, Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel,
  Tab, Tabs, Chip, Autocomplete
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import BusinessIcon from '@mui/icons-material/Business'
import EmailIcon from '@mui/icons-material/Email'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import PeopleIcon from '@mui/icons-material/People'
import { can } from '@/lib/permissions'

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
  volunteer_availabilities: '[]',
  volunteer_skills: '[]',
  volunteer_interests: '[]',
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

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setSettings({ ...DEFAULT_SETTINGS, ...data })
        setLoading(false)
      })
  }, [])

  const set = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }))

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
    setSaving(true); setMsg(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      setMsg(res.ok
        ? { type: 'success', text: 'Settings saved successfully.' }
        : { type: 'error', text: 'Failed to save settings.' })
    } finally { setSaving(false) }
    setTimeout(() => setMsg(null), 5000)
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>

  if (!isSuperAdmin) {
    return (
      <Box>
        
        <Alert severity="warning">Settings are accessible to Super Admin only.</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
        {canEdit && (
          <Button id="save-settings-btn" variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save All Changes'}
          </Button>
        )}
      </Box>

      {msg && <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<BusinessIcon fontSize="small" />} iconPosition="start" label="Organization" />
        <Tab icon={<ReceiptLongIcon fontSize="small" />} iconPosition="start" label="Donations & 80G" />
        <Tab icon={<EmailIcon fontSize="small" />} iconPosition="start" label="Email" />
        <Tab icon={<PeopleIcon fontSize="small" />} iconPosition="start" label="Volunteer Forms" />
      </Tabs>

      {/* Organization Tab */}
      {tab === 0 && (
        <Card>
          <CardHeader title="Trust / Organization Details" subheader="Used in 80G receipts and official documents" />
          <Divider />
          <CardContent>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Organization Logo</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {settings.org_logo ? (
                    <Box component="img" src={settings.org_logo} alt="Logo" sx={{ width: 64, height: 64, objectFit: 'contain', border: '1px solid', borderColor: 'divider', borderRadius: 1 }} />
                  ) : (
                    <Box sx={{ width: 64, height: 64, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed', borderColor: 'grey.400', borderRadius: 1 }}>
                      <BusinessIcon color="disabled" />
                    </Box>
                  )}
                  {canEdit && (
                    <Button variant="outlined" component="label" size="small">
                      Upload Logo
                      <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                    </Button>
                  )}
                  {settings.org_logo && canEdit && (
                    <Button variant="text" color="error" size="small" onClick={() => set('org_logo', '')}>Remove</Button>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Organization Name" fullWidth value={settings.org_name} onChange={e => set('org_name', e.target.value)} disabled={!canEdit} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="PAN" fullWidth value={settings.org_pan} onChange={e => set('org_pan', e.target.value.toUpperCase())} disabled={!canEdit} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Registered Address" fullWidth multiline rows={3} value={settings.org_address} onChange={e => set('org_address', e.target.value)} disabled={!canEdit} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="80G Registration Number" fullWidth value={settings.eighty_g_number} onChange={e => set('eighty_g_number', e.target.value)} disabled={!canEdit} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="80G Validity (expiry date)"
                  type="date"
                  fullWidth
                  value={settings.eighty_g_validity}
                  onChange={e => set('eighty_g_validity', e.target.value)}
                  disabled={!canEdit}
                  InputLabelProps={{ shrink: true }}
                  helperText="Dashboard shows warning 90 days before expiry"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="FCRA Number" fullWidth value={settings.fcra_number} onChange={e => set('fcra_number', e.target.value)} disabled={!canEdit} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Authorized Signatory Name" fullWidth value={settings.signatory_name} onChange={e => set('signatory_name', e.target.value)} disabled={!canEdit} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Donations Tab */}
      {tab === 1 && (
        <Card>
          <CardHeader title="Receipt Numbering" subheader="Controls how 80G receipt numbers are generated" />
          <Divider />
          <CardContent>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Receipt Prefix"
                  fullWidth
                  value={settings.receipt_prefix}
                  onChange={e => set('receipt_prefix', e.target.value)}
                  disabled={!canEdit}
                  helperText={`Example: ${settings.receipt_prefix}/2026-27/0001`}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Financial Year Start Month</InputLabel>
                  <Select
                    label="Financial Year Start Month"
                    value={settings.fy_start_month}
                    onChange={e => set('fy_start_month', e.target.value)}
                    disabled={!canEdit}
                  >
                    {Array.from({ length: 12 }, (_, i) => ({
                      value: String(i + 1),
                      label: new Date(2000, i, 1).toLocaleString('en', { month: 'long' }),
                    })).map(({ value, label }) => (
                      <MenuItem key={value} value={value}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  Receipt numbers reset to 0001 at the start of each financial year.
                  Current format preview: <Chip label={`${settings.receipt_prefix}/2026-27/0001`} size="small" sx={{ ml: 1 }} />
                </Alert>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Email Tab */}
      {tab === 2 && (
        <Card>
          <CardHeader
            title="Email Provider Configuration"
            subheader="Switch providers with a config change — no code changes required"
          />
          <Divider />
          <CardContent>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Email Provider</InputLabel>
                  <Select
                    label="Email Provider"
                    value={settings.email_provider}
                    onChange={e => set('email_provider', e.target.value)}
                    disabled={!canEdit}
                  >
                    <MenuItem value="brevo">Brevo (300/day free)</MenuItem>
                    <MenuItem value="resend">Resend (3,000/month free)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="API Key"
                  fullWidth
                  type="password"
                  value={settings.email_api_key}
                  onChange={e => set('email_api_key', e.target.value)}
                  disabled={!canEdit}
                  helperText="Stored securely. Get API key from provider dashboard."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="From Email Address"
                  fullWidth
                  type="email"
                  value={settings.email_from}
                  onChange={e => set('email_from', e.target.value)}
                  disabled={!canEdit}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="From Name"
                  fullWidth
                  value={settings.email_from_name}
                  onChange={e => set('email_from_name', e.target.value)}
                  disabled={!canEdit}
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  Used for volunteer invite emails, 80G receipt delivery, and other notifications.
                </Alert>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Volunteer Forms Tab */}
      {tab === 3 && (
        <Card>
          <CardHeader
            title="Volunteer Form Options"
            subheader="Manage the predefined options available on the public volunteer registration form"
          />
          <Divider />
          <CardContent>
            <Grid container spacing={2.5}>
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
                      const { key, ...tagProps } = getTagProps({ index });
                      return <Chip variant="outlined" label={option} key={key} {...tagProps} />;
                    })
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Availability Options" placeholder="Type and press enter" helperText="e.g. Weekends, Evenings, 5 hours/week" />
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
                      const { key, ...tagProps } = getTagProps({ index });
                      return <Chip variant="outlined" label={option} key={key} {...tagProps} />;
                    })
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Skills Options" placeholder="Type and press enter" helperText="e.g. Counselling, Social Media" />
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
                      const { key, ...tagProps } = getTagProps({ index });
                      return <Chip variant="outlined" label={option} key={key} {...tagProps} />;
                    })
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Interests Options" placeholder="Type and press enter" helperText="e.g. Youth Programs, Mental Health Awareness" />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
