'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Stack,
  Avatar,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  InputAdornment,
  Autocomplete,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import KeyIcon from '@mui/icons-material/Key'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import SendIcon from '@mui/icons-material/Send'
import LockResetIcon from '@mui/icons-material/LockReset'
import PersonIcon from '@mui/icons-material/Person'
import EditIcon from '@mui/icons-material/Edit'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import EventIcon from '@mui/icons-material/Event'
import RefreshIcon from '@mui/icons-material/Refresh'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import AddIcon from '@mui/icons-material/Add'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { can } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { DEFAULT_INDIAN_STATES, DEFAULT_PIPELINE_STAGES, PipelineStageConfig } from '@/lib/constants'

const STAGE_LABELS: Record<string, string> = {
  APPLICATION: 'Application',
  DOCUMENT_VERIFICATION: 'Document Verification',
  INTERVIEW: 'Interview',
  TRAINING: 'Training',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

const STAGE_STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  PENDING: 'default',
  IN_PROGRESS: 'primary',
  PASSED: 'success',
  FAILED: 'error',
  APPROVED: 'success',
  REJECTED: 'error',
}

interface VolunteerDetailClientProps {
  id: string
}

export default function VolunteerDetailClient({ id }: VolunteerDetailClientProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const role = session?.user?.role || ''
  const canUpdate = can(role, 'volunteers', 'update')
  const canDelete = can(role, 'volunteers', 'delete')

  const [volunteer, setVolunteer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Pipeline configuration from settings
  const [pipelineStages, setPipelineStages] = useState<PipelineStageConfig[]>(DEFAULT_PIPELINE_STAGES)

  // Pipeline stage advancing
  const [stageNotes, setStageNotes] = useState('')
  const [stageConductedBy, setStageConductedBy] = useState('')
  const [stageAdvancing, setStageAdvancing] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Edit Profile Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [statesList, setStatesList] = useState<string[]>(DEFAULT_INDIAN_STATES)
  const [districtsMap, setDistrictsMap] = useState<Record<string, string[]>>({})

  // Credentials Management
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordActionLoading, setPasswordActionLoading] = useState(false)
  const [generatedSuccessData, setGeneratedSuccessData] = useState<{ email: string; password?: string; inviteUrl?: string } | null>(null)

  // Add Hours Dialog
  const [hoursDialogOpen, setHoursDialogOpen] = useState(false)
  const [hoursForm, setHoursForm] = useState({ date: new Date().toISOString().split('T')[0], hours: '2', activity: '', notes: '' })
  const [savingHours, setSavingHours] = useState(false)

  // Notification Snackbar
  const [toastMessage, setToastMessage] = useState('')

  // Suspend Dialog
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [suspensionReason, setSuspensionReason] = useState('')
  const [suspending, setSuspending] = useState(false)

  // Reset Account Dialog
  const [resetAccountDialogOpen, setResetAccountDialogOpen] = useState(false)
  const [resetCustomPassword, setResetCustomPassword] = useState('')
  const [resetSendEmail, setResetSendEmail] = useState(true)
  const [showResetPassword, setShowResetPassword] = useState(false)

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchVolunteer = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/volunteers/${id}`)
      if (!res.ok) {
        if (res.status === 404) setError('Volunteer not found')
        else if (res.status === 403) setError('You do not have permission to view this volunteer')
        else setError('Failed to load volunteer details')
        return
      }
      const data = await res.json()
      setVolunteer(data)
    } catch (err) {
      setError('An unexpected error occurred while loading data')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchVolunteer()
  }, [fetchVolunteer])

  useEffect(() => {
    fetch('/api/public/form-options')
      .then((res) => res.json())
      .then((data) => {
        if (data?.states && Array.isArray(data.states) && data.states.length > 0) {
          setStatesList(data.states)
        }
        if (data?.districts) {
          setDistrictsMap(data.districts)
        }
        if (data?.pipelineStages && Array.isArray(data.pipelineStages) && data.pipelineStages.length > 0) {
          setPipelineStages(data.pipelineStages)
        }
      })
      .catch(() => {})
  }, [])

  // Build active enabled pipeline stages list
  const activeEnabledStages = pipelineStages.filter((s) => s.enabled !== false)
  const activeStageKeys = activeEnabledStages.map((s) => s.key)

  // Stage labels map merging default and customized labels from settings
  const dynamicStageLabels: Record<string, string> = { ...STAGE_LABELS }
  pipelineStages.forEach((s) => {
    dynamicStageLabels[s.key] = s.label
  })

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setToastMessage(`${label} copied to clipboard!`)
  }

  // Generate strong random password
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
    let pass = ''
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(pass)
  }

  // Advance pipeline stage
  const handleAdvanceStage = async (pass: boolean) => {
    if (!volunteer) return
    setStageAdvancing(true)
    try {
      const res = await fetch(`/api/volunteers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: volunteer.currentStage,
          status: pass ? 'PASSED' : 'FAILED',
          notes: stageNotes,
          conductedBy: stageConductedBy,
          conductedAt: new Date().toISOString(),
          rejectionReason: !pass ? (rejectReason || stageNotes) : undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setToastMessage(d.error || 'Failed to update pipeline stage')
        return
      }
      setStageNotes('')
      setStageConductedBy('')
      setRejectDialogOpen(false)
      setToastMessage(pass ? 'Stage passed successfully! Next stage activated.' : 'Volunteer marked as rejected.')
      fetchVolunteer()
    } finally {
      setStageAdvancing(false)
    }
  }

  // Handle Credentials Action (Direct Password Set / Generate Invite / Create Account / Reset Account)
  const handleCredentialsAction = async (action: 'SET_PASSWORD' | 'GENERATE_INVITE' | 'CREATE_ACCOUNT' | 'TOGGLE_ACTIVE' | 'RESET_ACCOUNT', sendEmail = false) => {
    setPasswordActionLoading(true)
    try {
      const res = await fetch(`/api/volunteers/${id}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          password: (action === 'RESET_ACCOUNT' ? resetCustomPassword : newPassword) || undefined,
          sendEmail,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setToastMessage(data.error || 'Failed to update credentials')
        return
      }

      if ((action === 'SET_PASSWORD' || action === 'RESET_ACCOUNT') && data.credentials) {
        setGeneratedSuccessData({
          email: data.credentials.email,
          password: data.credentials.password,
          inviteUrl: data.inviteUrl,
        })
        setPasswordDialogOpen(false)
        setResetAccountDialogOpen(false)
        setToastMessage(data.message || (action === 'RESET_ACCOUNT' ? 'Volunteer account successfully reset!' : 'Volunteer password updated successfully!'))
      } else if (action === 'GENERATE_INVITE') {
        setGeneratedSuccessData({
          email: volunteer.email,
          inviteUrl: data.inviteUrl,
        })
        setToastMessage(sendEmail ? 'Invite email sent with setup link!' : 'New invite link generated!')
      } else if (action === 'CREATE_ACCOUNT') {
        setToastMessage('Portal account successfully activated!')
      } else if (action === 'TOGGLE_ACTIVE') {
        setToastMessage(`Account is now ${data.isActive ? 'Active' : 'Disabled'}`)
      }

      fetchVolunteer()
    } finally {
      setPasswordActionLoading(false)
    }
  }

  // Save Edit Volunteer details
  const handleSaveEdit = async () => {
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/volunteers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          skills: typeof editForm.skills === 'string' ? editForm.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : editForm.skills,
          interests: typeof editForm.interests === 'string' ? editForm.interests.split(',').map((s: string) => s.trim()).filter(Boolean) : editForm.interests,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setToastMessage(d.error || 'Failed to save changes')
        return
      }
      setEditDialogOpen(false)
      setToastMessage('Volunteer profile updated successfully!')
      fetchVolunteer()
    } finally {
      setSavingEdit(false)
    }
  }

  // Add Logged Hours
  const handleAddHours = async () => {
    setSavingHours(true)
    try {
      const res = await fetch(`/api/volunteers/${id}/hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: parseFloat(hoursForm.hours),
          date: hoursForm.date,
          activity: hoursForm.activity,
          notes: hoursForm.notes,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setToastMessage(d.error || 'Failed to log hours')
        return
      }
      setHoursDialogOpen(false)
      setHoursForm({ date: new Date().toISOString().split('T')[0], hours: '2', activity: '', notes: '' })
      setToastMessage('Volunteer hours logged successfully!')
      fetchVolunteer()
    } finally {
      setSavingHours(false)
    }
  }

  // Handle Suspend / Reactivate
  const handleToggleSuspend = async (suspend: boolean) => {
    setSuspending(true)
    try {
      const res = await fetch(`/api/volunteers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: suspend ? 'SUSPEND' : 'REACTIVATE',
          reason: suspend ? (suspensionReason || 'Suspended by administrator') : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setToastMessage(data.error || 'Failed to update volunteer status')
        return
      }
      setSuspendDialogOpen(false)
      setSuspensionReason('')
      setToastMessage(suspend ? 'Volunteer suspended successfully' : 'Volunteer reactivated successfully')
      fetchVolunteer()
    } finally {
      setSuspending(false)
    }
  }

  // Handle Delete Volunteer
  const handleDeleteVolunteer = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/volunteers/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        setToastMessage(data.error || 'Failed to delete volunteer')
        return
      }
      setDeleteDialogOpen(false)
      router.push('/admin/volunteers')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12 }}>
        <CircularProgress size={48} sx={{ color: '#12446A', mb: 2 }} />
        <Typography variant="body1" color="text.secondary">Loading volunteer profile & credentials...</Typography>
      </Box>
    )
  }

  if (error || !volunteer) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Volunteer not found'}</Alert>
        <Button component={Link} href="/admin/volunteers" startIcon={<ArrowBackIcon />}>
          Back to Volunteers
        </Button>
      </Box>
    )
  }

  const stageIndex = activeStageKeys.indexOf(volunteer.currentStage)
  const isApproved = volunteer.currentStage === 'APPROVED'
  const isRejected = volunteer.currentStage === 'REJECTED'
  const userAccount = volunteer.user
  const hasAccount = !!volunteer.userId
  const totalHours = (volunteer.hoursLogs || []).reduce((sum: number, h: any) => sum + (h.hours || 0), 0)

  return (
    <Box sx={{ pb: 6 }}>
      {/* ── Top Header / Navigation ── */}
      <Box sx={{ mb: 3 }}>
        <Button
          component={Link}
          href="/admin/volunteers"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 1.5, color: 'text.secondary' }}
        >
          Back to Volunteers List
        </Button>

        {/* Suspended Alert Banner */}
        {volunteer.isSuspended && (
          <Alert
            severity="warning"
            sx={{
              mb: 2,
              border: '1px solid #FDE68A',
              bgcolor: '#FFFBEB',
              color: '#92400E',
              alignItems: 'center',
            }}
            action={
              canUpdate && (
                <Button
                  color="warning"
                  size="small"
                  variant="outlined"
                  onClick={() => handleToggleSuspend(false)}
                  disabled={suspending}
                  sx={{ borderColor: '#F59E0B' }}
                >
                  Reactivate Volunteer
                </Button>
              )
            }
          >
            <Typography variant="subtitle2" fontWeight={700}>
              ⚠️ This volunteer is currently suspended.
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {volunteer.suspensionReason ? `Reason: ${volunteer.suspensionReason}. ` : ''}
              {volunteer.suspendedAt ? `(Suspended on ${formatDate(volunteer.suspendedAt)}) ` : ''}
              Volunteer portal login is disabled and activity is paused.
            </Typography>
          </Alert>
        )}

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', xl: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', xl: 'center' },
            gap: 2.5,
            bgcolor: 'background.paper',
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3,
            border: '1px solid #E1E6EB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
            <Avatar
              sx={{
                bgcolor: volunteer.isSuspended ? '#F59E0B' : isApproved ? 'success.main' : isRejected ? 'error.main' : 'primary.main',
                width: 60,
                height: 60,
                fontSize: '1.5rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {volunteer.name.charAt(0)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.75 }}>
                <Typography variant="h5" fontWeight={800} color="#12446A">
                  {volunteer.name}
                </Typography>
                {volunteer.isSuspended ? (
                  <Chip
                    label="Suspended"
                    color="warning"
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: '#FEF3C7',
                      color: '#92400E',
                      border: '1px solid #FDE68A',
                    }}
                  />
                ) : (
                  <Chip
                    label={dynamicStageLabels[volunteer.currentStage] || volunteer.currentStage}
                    color={STAGE_STATUS_COLORS[volunteer.currentStage] || 'default'}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <span>Application ID: <code style={{ backgroundColor: '#F1F5F9', padding: '2px 8px', borderRadius: 4, fontSize: '0.85rem' }}>{volunteer.id}</code></span>
                <span>•</span>
                <span>Applied on {formatDate(volunteer.createdAt)}</span>
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 1.25,
              mt: { xs: 1, xl: 0 },
            }}
          >
            {canUpdate && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 2,
                    py: 0.75,
                    height: 38,
                  }}
                  onClick={() => {
                    setEditForm({
                      name: volunteer.name,
                      phone: volunteer.phone || '',
                      address: volunteer.address || '',
                      city: volunteer.city || '',
                      district: volunteer.district || '',
                      state: volunteer.state || '',
                      skills: Array.isArray(volunteer.skills) ? volunteer.skills.join(', ') : volunteer.skills || '',
                      interests: Array.isArray(volunteer.interests) ? volunteer.interests.join(', ') : volunteer.interests || '',
                      contributionType: volunteer.contributionType || '',
                      availability: volunteer.availability || '',
                      motivation: volunteer.motivation || '',
                    })
                    setEditDialogOpen(true)
                  }}
                >
                  Edit Details
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 2,
                    py: 0.75,
                    height: 38,
                    bgcolor: '#12446A',
                    '&:hover': { bgcolor: '#0d3250' },
                  }}
                  onClick={() => setHoursDialogOpen(true)}
                >
                  Log Hours
                </Button>
                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<RestartAltIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 2,
                    py: 0.75,
                    height: 38,
                  }}
                  onClick={() => {
                    setResetCustomPassword('')
                    setResetSendEmail(true)
                    setResetAccountDialogOpen(true)
                  }}
                >
                  Reset Account
                </Button>
                {volunteer.isSuspended ? (
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<CheckCircleOutlineIcon />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 2,
                      py: 0.75,
                      height: 38,
                    }}
                    onClick={() => handleToggleSuspend(false)}
                    disabled={suspending}
                  >
                    Reactivate
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<BlockIcon />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 2,
                      py: 0.75,
                      height: 38,
                      borderColor: '#F59E0B',
                      color: '#D97706',
                      '&:hover': { borderColor: '#D97706', bgcolor: '#FFFBEB' },
                    }}
                    onClick={() => {
                      setSuspensionReason('')
                      setSuspendDialogOpen(true)
                    }}
                  >
                    Suspend
                  </Button>
                )}
              </>
            )}

            {canDelete && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2,
                  py: 0.75,
                  height: 38,
                }}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* ── Main 2-Column Content Grid ── */}
      <Grid container spacing={3}>
        {/* Left Column: Onboarding Pipeline & Credentials */}
        <Grid item xs={12} lg={7}>
          <Stack spacing={3}>
            {/* 1. Onboarding Pipeline Card */}
            <Card elevation={0} sx={{ border: '1px solid #E1E6EB', borderRadius: 3 }}>
              <CardHeader
                title={
                  <Typography variant="h6" fontWeight={700} color="#12446A">
                    Onboarding Pipeline
                  </Typography>
                }
                subheader="Application stages & review verification workflow (managed in Settings)"
                action={
                  <Button
                    component={Link}
                    href="/admin/settings"
                    size="small"
                    color="inherit"
                    sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.75rem' }}
                  >
                    Configure Pipeline
                  </Button>
                }
              />
              <Divider />
              <CardContent sx={{ p: 3 }}>
                <Stepper
                  activeStep={isRejected ? -1 : stageIndex}
                  orientation="vertical"
                >
                  {activeEnabledStages.map((stageConfig, idx) => {
                    const s = stageConfig.key
                    const stageRecord = volunteer.stages?.find((sr: any) => sr.stage === s)
                    const isCompleted = stageIndex > idx || isApproved
                    const isCurrent = stageIndex === idx && !isApproved && !isRejected

                    return (
                      <Step key={s} completed={isCompleted}>
                        <StepLabel
                          StepIconProps={{
                            icon: isCompleted ? (
                              <CheckCircleIcon color="success" />
                            ) : (
                              idx + 1
                            ),
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight={isCompleted || isCurrent ? 700 : 500}
                              color={isCurrent ? 'primary.main' : 'text.primary'}
                            >
                              {stageConfig.label}
                            </Typography>
                            {stageRecord && (
                              <Chip
                                label={stageRecord.status}
                                size="small"
                                color={STAGE_STATUS_COLORS[stageRecord.status] || 'default'}
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </StepLabel>
                        <StepContent>
                          <Box sx={{ pl: 1, py: 1 }}>
                            {stageConfig.description && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
                                Guideline: {stageConfig.description}
                              </Typography>
                            )}
                            {stageRecord?.notes && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Notes:</strong> {stageRecord.notes}
                              </Typography>
                            )}
                            {stageRecord?.conductedBy && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Conducted by: {stageRecord.conductedBy}
                              </Typography>
                            )}
                            {stageRecord?.completedAt && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Completed: {formatDate(stageRecord.completedAt)}
                              </Typography>
                            )}
                          </Box>
                        </StepContent>
                      </Step>
                    )
                  })}
                </Stepper>

                {/* Stage Action Box */}
                {canUpdate && !isApproved && !isRejected && (
                  <Box sx={{ mt: 3, p: 2.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                    <Typography variant="subtitle2" fontWeight={700} color="#12446A" sx={{ mb: 1.5 }}>
                      Action for Current Stage ({dynamicStageLabels[volunteer.currentStage] || volunteer.currentStage})
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Conducted By / Reviewer"
                          size="small"
                          fullWidth
                          value={stageConductedBy}
                          onChange={(e) => setStageConductedBy(e.target.value)}
                          placeholder="e.g. Dr. Sharma / Admin"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Review Notes / Remarks"
                          size="small"
                          fullWidth
                          value={stageNotes}
                          onChange={(e) => setStageNotes(e.target.value)}
                          placeholder="Passed document check / interview observations"
                        />
                      </Grid>
                    </Grid>

                    <Stack direction="row" spacing={1.5} sx={{ mt: 2 }} justifyContent="flex-end">
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<CancelIcon />}
                        onClick={() => setRejectDialogOpen(true)}
                        disabled={stageAdvancing}
                      >
                        Reject Application
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={stageAdvancing ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                        onClick={() => handleAdvanceStage(true)}
                        disabled={stageAdvancing}
                      >
                        {stageIndex === activeEnabledStages.length - 2 || volunteer.currentStage === 'TRAINING'
                          ? 'Approve & Activate Account'
                          : 'Pass & Advance Stage'}
                      </Button>
                    </Stack>
                  </Box>
                )}

                {isApproved && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <strong>Volunteer Approved & Onboarded!</strong> Portal credentials and access are active below.
                  </Alert>
                )}

                {isRejected && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    <strong>Application Rejected.</strong> {volunteer.rejectionReason && `Reason: ${volunteer.rejectionReason}`}
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* 2. Portal Credentials & Security Card */}
            <Card elevation={0} sx={{ border: '1px solid #E1E6EB', borderRadius: 3 }}>
              <CardHeader
                avatar={<KeyIcon sx={{ color: '#12446A' }} />}
                title={
                  <Typography variant="h6" fontWeight={700} color="#12446A">
                    Volunteer Portal Credentials
                  </Typography>
                }
                subheader="Login account access, password provisioning, and invite links"
              />
              <Divider />
              <CardContent sx={{ p: 3 }}>
                {/* Account Status Banner */}
                <Box
                  sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 2,
                    bgcolor: hasAccount ? '#F0FDF4' : '#FFFBEB',
                    border: `1px solid ${hasAccount ? '#BBF7D0' : '#FDE68A'}`,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} color={hasAccount ? '#166534' : '#92400E'}>
                      {hasAccount ? 'Portal Account Active' : 'No User Account Linked'}
                    </Typography>
                    <Typography variant="body2" color={hasAccount ? '#15803D' : '#B45309'}>
                      {hasAccount
                        ? `Login Email: ${userAccount?.email || volunteer.email}`
                        : 'Generate an account or invite link so this volunteer can log in to log hours & view assignments.'}
                    </Typography>
                  </Box>
                  {hasAccount && (
                    <Chip
                      label={userAccount?.isActive ? 'Active' : 'Disabled'}
                      color={userAccount?.isActive ? 'success' : 'error'}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  )}
                </Box>

                {/* Account Details & Quick Actions */}
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Login Email Address
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography variant="body1" fontWeight={600}>
                        {userAccount?.email || volunteer.email}
                      </Typography>
                      <Tooltip title="Copy Email">
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(userAccount?.email || volunteer.email, 'Email')}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Portal Role
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                      {userAccount?.role || 'VOLUNTEER'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Last Portal Login
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {userAccount?.lastLoginAt ? formatDate(userAccount.lastLoginAt) : 'Never logged in yet'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Account Created
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {userAccount?.createdAt ? formatDate(userAccount.createdAt) : 'Not created'}
                    </Typography>
                  </Grid>

                  {/* Active Setup Link if any */}
                  {volunteer.credentials?.latestInviteUrl && (
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                          Active Password Setup Link (Valid for 48 Hours)
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={volunteer.credentials.latestInviteUrl}
                            InputProps={{ readOnly: true }}
                          />
                          <Button
                            variant="outlined"
                            startIcon={<ContentCopyIcon />}
                            onClick={() => copyToClipboard(volunteer.credentials.latestInviteUrl, 'Setup Link')}
                            sx={{ whiteSpace: 'nowrap' }}
                          >
                            Copy Link
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  )}
                </Grid>

                {/* Action Buttons */}
                {canUpdate && (
                  <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #E1E6EB' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center' }}>
                      {!hasAccount ? (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<KeyIcon />}
                          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2, py: 0.75, height: 38 }}
                          onClick={() => handleCredentialsAction('CREATE_ACCOUNT')}
                          disabled={passwordActionLoading}
                        >
                          Create Volunteer Account
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="contained"
                            color="info"
                            startIcon={<RestartAltIcon />}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2, py: 0.75, height: 38 }}
                            onClick={() => {
                              setResetCustomPassword('')
                              setResetSendEmail(true)
                              setResetAccountDialogOpen(true)
                            }}
                            disabled={passwordActionLoading}
                          >
                            Reset Account
                          </Button>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<LockResetIcon />}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 600,
                              borderRadius: 2,
                              px: 2,
                              py: 0.75,
                              height: 38,
                              bgcolor: '#12446A',
                              '&:hover': { bgcolor: '#0d3250' },
                            }}
                            onClick={() => {
                              generateStrongPassword()
                              setPasswordDialogOpen(true)
                            }}
                            disabled={passwordActionLoading}
                          >
                            Set / Reset Password
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2, py: 0.75, height: 38 }}
                            onClick={() => handleCredentialsAction('GENERATE_INVITE', false)}
                            disabled={passwordActionLoading}
                          >
                            Generate Setup Link
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<SendIcon />}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2, py: 0.75, height: 38 }}
                            onClick={() => handleCredentialsAction('GENERATE_INVITE', true)}
                            disabled={passwordActionLoading}
                          >
                            Email Setup Invite
                          </Button>
                          <Button
                            variant="outlined"
                            color={userAccount?.isActive ? 'warning' : 'success'}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 600,
                              borderRadius: 2,
                              px: 2,
                              py: 0.75,
                              height: 38,
                              borderColor: userAccount?.isActive ? '#F59E0B' : undefined,
                              color: userAccount?.isActive ? '#D97706' : undefined,
                            }}
                            onClick={() => handleCredentialsAction('TOGGLE_ACTIVE')}
                            disabled={passwordActionLoading}
                          >
                            {userAccount?.isActive ? 'Disable Access' : 'Enable Access'}
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Column: Contact Info, Hours Logged & Event Assignments */}
        <Grid item xs={12} lg={5}>
          <Stack spacing={3}>
            {/* 1. Contact & Profile Information Card */}
            <Card elevation={0} sx={{ border: '1px solid #E1E6EB', borderRadius: 3 }}>
              <CardHeader
                title={
                  <Typography variant="h6" fontWeight={700} color="#12446A">
                    Profile & Contact Details
                  </Typography>
                }
              />
              <Divider />
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <EmailIcon sx={{ color: 'text.secondary', mt: 0.2 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Email Address
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {volunteer.email}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <PhoneIcon sx={{ color: 'text.secondary', mt: 0.2 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Phone Number
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {volunteer.phone || 'Not provided'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <LocationOnIcon sx={{ color: 'text.secondary', mt: 0.2 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Location / Address
                      </Typography>
                      <Typography variant="body2">
                        {[volunteer.address, volunteer.city, volunteer.district, volunteer.state].filter(Boolean).join(', ') || 'Not provided'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <AccessTimeIcon sx={{ color: 'text.secondary', mt: 0.2 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Availability
                      </Typography>
                      <Typography variant="body2">
                        {volunteer.availability || 'Flexible'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Skills */}
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.8 }}>
                      Skills & Expertise
                    </Typography>
                    {Array.isArray(volunteer.skills) && volunteer.skills.length > 0 ? (
                      <Stack direction="row" spacing={0.8} flexWrap="wrap" gap={0.5}>
                        {volunteer.skills.map((skill: string, idx: number) => (
                          <Chip key={idx} label={skill} size="small" variant="outlined" color="primary" />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">None specified</Typography>
                    )}
                  </Box>

                  {/* Interests */}
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.8 }}>
                      Program Interests
                    </Typography>
                    {Array.isArray(volunteer.interests) && volunteer.interests.length > 0 ? (
                      <Stack direction="row" spacing={0.8} flexWrap="wrap" gap={0.5}>
                        {volunteer.interests.map((interest: string, idx: number) => (
                          <Chip key={idx} label={interest} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">None specified</Typography>
                    )}
                  </Box>

                  {/* Contribution Type */}
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.8 }}>
                      Contribution Preference
                    </Typography>
                    <Typography variant="body2">
                      {volunteer.contributionType || 'None specified'}
                    </Typography>
                  </Box>

                  {/* Motivation */}
                  {volunteer.motivation && (
                    <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                        Statement of Motivation
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        &quot;{volunteer.motivation}&quot;
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* 2. Service Hours Logged Card */}
            <Card elevation={0} sx={{ border: '1px solid #E1E6EB', borderRadius: 3 }}>
              <CardHeader
                avatar={<AccessTimeIcon sx={{ color: '#12446A' }} />}
                title={
                  <Typography variant="h6" fontWeight={700} color="#12446A">
                    Volunteer Service Hours
                  </Typography>
                }
                subheader={`Total Logged: ${totalHours} Hours`}
                action={
                  canUpdate && (
                    <Button size="small" startIcon={<AddIcon />} onClick={() => setHoursDialogOpen(true)}>
                      Log Hours
                    </Button>
                  )
                }
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                {volunteer.hoursLogs && volunteer.hoursLogs.length > 0 ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Activity</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Hours</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {volunteer.hoursLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell>{formatDate(log.date)}</TableCell>
                          <TableCell>{log.activity || log.notes || 'Volunteering'}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>{log.hours} hrs</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No service hours logged yet.</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* 3. Event Assignments Card */}
            <Card elevation={0} sx={{ border: '1px solid #E1E6EB', borderRadius: 3 }}>
              <CardHeader
                avatar={<EventIcon sx={{ color: '#12446A' }} />}
                title={
                  <Typography variant="h6" fontWeight={700} color="#12446A">
                    Event Assignments
                  </Typography>
                }
                subheader={`${(volunteer.eventAssignments || []).length} events assigned`}
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                {volunteer.eventAssignments && volunteer.eventAssignments.length > 0 ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Event</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {volunteer.eventAssignments.map((ea: any) => (
                        <TableRow key={ea.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {ea.event?.title || 'Event'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {ea.event?.startDate ? formatDate(ea.event.startDate) : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>{ea.role || 'Volunteer'}</TableCell>
                          <TableCell align="right">
                            <Chip label={ea.status || 'CONFIRMED'} size="small" color="primary" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No event assignments assigned yet.</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* 4. Danger Zone / Account & Status Actions */}
            {(canUpdate || canDelete) && (
              <Card elevation={0} sx={{ border: '1px solid #FCA5A5', borderRadius: 3, bgcolor: '#FFF5F5' }}>
                <CardHeader
                  avatar={<WarningAmberIcon color="error" />}
                  title={
                    <Typography variant="h6" fontWeight={700} color="error.main">
                      Account & Status Actions
                    </Typography>
                  }
                  subheader="Manage volunteer activity status or remove records"
                />
                <Divider sx={{ borderColor: '#FECACA' }} />
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    {canUpdate && (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="#1E293B">
                              Reset Volunteer Account
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Re-generate credentials, reactivate login access, and restore volunteer portal functionality.
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            color="info"
                            size="small"
                            startIcon={<RestartAltIcon />}
                            onClick={() => {
                              setResetCustomPassword('')
                              setResetSendEmail(true)
                              setResetAccountDialogOpen(true)
                            }}
                            disabled={passwordActionLoading}
                          >
                            Reset Account
                          </Button>
                        </Box>
                        <Divider sx={{ borderColor: '#FECACA' }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="#1E293B">
                              {volunteer.isSuspended ? 'Reactivate Volunteer' : 'Suspend Volunteer'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {volunteer.isSuspended
                                ? 'Restore login access and enable active participation.'
                                : 'Pause volunteer assignments and disable portal login access.'}
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            color={volunteer.isSuspended ? 'success' : 'warning'}
                            size="small"
                            onClick={() => {
                              if (volunteer.isSuspended) {
                                handleToggleSuspend(false)
                              } else {
                                setSuspensionReason('')
                                setSuspendDialogOpen(true)
                              }
                            }}
                            disabled={suspending}
                          >
                            {volunteer.isSuspended ? 'Reactivate Volunteer' : 'Suspend Volunteer'}
                          </Button>
                        </Box>
                      </>
                    )}

                    {canDelete && (
                      <>
                        <Divider sx={{ borderColor: '#FECACA' }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="error.main">
                              Delete Volunteer
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Permanently delete volunteer records, logged hours, and portal login account.
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => setDeleteDialogOpen(true)}
                          >
                            Delete Volunteer
                          </Button>
                        </Box>
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* ── Dialog: Set / Reset Password ── */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockResetIcon color="primary" /> Set Volunteer Password
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Set a new direct password for <strong>{volunteer.name}</strong> ({volunteer.email}).
          </Typography>
          <TextField
            label="New Password *"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText="At least 6 characters. Use the button below to generate a secure random password."
            sx={{ mb: 2 }}
          />
          <Button variant="outlined" size="small" onClick={generateStrongPassword} fullWidth>
            Generate Random Password
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPasswordDialogOpen(false)} disabled={passwordActionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleCredentialsAction('SET_PASSWORD')}
            disabled={!newPassword || newPassword.length < 6 || passwordActionLoading}
          >
            {passwordActionLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Generated Credentials Success Modal ── */}
      <Dialog open={!!generatedSuccessData} onClose={() => setGeneratedSuccessData(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
          <CheckCircleIcon color="success" /> Credentials Generated
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="success" sx={{ mb: 2 }}>
            Credentials updated. Copy or share these credentials with the volunteer:
          </Alert>

          <Stack spacing={2} sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>Portal Login URL</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <TextField
                  size="small"
                  fullWidth
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/login`}
                  InputProps={{ readOnly: true }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => copyToClipboard(`${window.location.origin}/login`, 'Login URL')}
                >
                  Copy
                </Button>
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>Email Address</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <TextField
                  size="small"
                  fullWidth
                  value={generatedSuccessData?.email || ''}
                  InputProps={{ readOnly: true }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => copyToClipboard(generatedSuccessData?.email || '', 'Email')}
                >
                  Copy
                </Button>
              </Box>
            </Box>

            {generatedSuccessData?.password && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>Direct Password</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={generatedSuccessData.password}
                    InputProps={{ readOnly: true }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => copyToClipboard(generatedSuccessData!.password!, 'Password')}
                  >
                    Copy
                  </Button>
                </Box>
              </Box>
            )}

            {generatedSuccessData?.inviteUrl && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>Invite Setup Link</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={generatedSuccessData.inviteUrl}
                    InputProps={{ readOnly: true }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => copyToClipboard(generatedSuccessData!.inviteUrl!, 'Setup Link')}
                  >
                    Copy
                  </Button>
                </Box>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={() => setGeneratedSuccessData(null)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Reject Application ── */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Reject Application</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to reject <strong>{volunteer.name}</strong>&apos;s application?
          </Typography>
          <TextField
            label="Rejection Reason"
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Verification documents incomplete / Criteria not met"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={stageAdvancing}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleAdvanceStage(false)}
            disabled={stageAdvancing}
          >
            {stageAdvancing ? <CircularProgress size={20} color="inherit" /> : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Edit Volunteer Details ── */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Volunteer Profile</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Full Name *"
                fullWidth
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                fullWidth
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={statesList}
                value={editForm.state || null}
                onChange={(_, newValue) => setEditForm({ ...editForm, state: newValue || '', district: '' })}
                renderInput={(params) => (
                  <TextField {...params} label="State / UT" placeholder="Select state" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={editForm.state ? (districtsMap[editForm.state] || []) : []}
                value={editForm.district || null}
                disabled={!editForm.state}
                onChange={(_, newValue) => setEditForm({ ...editForm, district: newValue || '' })}
                renderInput={(params) => (
                  <TextField {...params} label="District" placeholder={editForm.state ? "Select district" : "Select a state first"} fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                multiline
                rows={2}
                value={editForm.address || ''}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="City"
                fullWidth
                value={editForm.city || ''}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Availability"
                fullWidth
                value={editForm.availability || ''}
                onChange={(e) => setEditForm({ ...editForm, availability: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Skills (comma separated)"
                fullWidth
                value={editForm.skills || ''}
                onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Interests (comma separated)"
                fullWidth
                value={editForm.interests || ''}
                onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Contribution Preference"
                fullWidth
                value={editForm.contributionType || ''}
                onChange={(e) => setEditForm({ ...editForm, contributionType: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Motivation"
                fullWidth
                multiline
                rows={3}
                value={editForm.motivation || ''}
                onChange={(e) => setEditForm({ ...editForm, motivation: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} disabled={savingEdit}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={savingEdit}>
            {savingEdit ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Log Hours ── */}
      <Dialog open={hoursDialogOpen} onClose={() => setHoursDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeIcon color="primary" /> Log Volunteer Hours
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date *"
                type="date"
                fullWidth
                value={hoursForm.date}
                onChange={(e) => setHoursForm({ ...hoursForm, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Hours *"
                type="number"
                fullWidth
                inputProps={{ min: '0.5', step: '0.5' }}
                value={hoursForm.hours}
                onChange={(e) => setHoursForm({ ...hoursForm, hours: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Activity / Program"
                fullWidth
                value={hoursForm.activity}
                onChange={(e) => setHoursForm({ ...hoursForm, activity: e.target.value })}
                placeholder="e.g. Youth Counselling / Field Outreach"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={hoursForm.notes}
                onChange={(e) => setHoursForm({ ...hoursForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setHoursDialogOpen(false)} disabled={savingHours}>Cancel</Button>
          <Button variant="contained" onClick={handleAddHours} disabled={savingHours || !hoursForm.hours}>
            {savingHours ? <CircularProgress size={20} color="inherit" /> : 'Log Hours'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Suspend Volunteer ── */}
      <Dialog open={suspendDialogOpen} onClose={() => setSuspendDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#B45309' }}>
          <BlockIcon color="warning" /> Suspend Volunteer
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Suspending <strong>{volunteer.name}</strong> will disable their login access to the volunteer portal and pause their participation.
          </Typography>
          <TextField
            label="Suspension Reason"
            fullWidth
            multiline
            rows={3}
            value={suspensionReason}
            onChange={(e) => setSuspensionReason(e.target.value)}
            placeholder="e.g. Inactive for extended period / Policy violation"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSuspendDialogOpen(false)} disabled={suspending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => handleToggleSuspend(true)}
            disabled={suspending}
          >
            {suspending ? <CircularProgress size={20} color="inherit" /> : 'Confirm Suspension'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Delete Volunteer ── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <WarningAmberIcon color="error" /> Delete Volunteer
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action is permanent and cannot be undone!
          </Alert>
          <Typography variant="body2">
            Are you sure you want to permanently delete <strong>{volunteer.name}</strong>? This will remove all associated records including logged hours, pipeline verification stages, event assignments, and their login account.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteVolunteer}
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Reset Volunteer Account ── */}
      <Dialog open={resetAccountDialogOpen} onClose={() => setResetAccountDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'info.main' }}>
          <RestartAltIcon color="info" /> Reset Volunteer Account
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2.5 }}>
            Resetting the account will generate a new secure password, activate or re-link the volunteer portal user, and clear any suspensions.
          </Alert>

          <Typography variant="body2" sx={{ mb: 2 }}>
            Target Volunteer: <strong>{volunteer.name}</strong> ({volunteer.email})
          </Typography>

          <TextField
            label="Custom Password (Optional)"
            type={showResetPassword ? 'text' : 'password'}
            fullWidth
            placeholder="Leave blank to auto-generate a strong password"
            value={resetCustomPassword}
            onChange={(e) => setResetCustomPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowResetPassword(!showResetPassword)}>
                    {showResetPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText="If blank, a secure random password will automatically be generated."
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={resetSendEmail}
                onChange={(e) => setResetSendEmail(e.target.checked)}
                color="primary"
              />
            }
            label="Send login instructions and credentials email to volunteer"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResetAccountDialogOpen(false)} disabled={passwordActionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="info"
            startIcon={<RestartAltIcon />}
            onClick={() => handleCredentialsAction('RESET_ACCOUNT', resetSendEmail)}
            disabled={passwordActionLoading}
          >
            {passwordActionLoading ? <CircularProgress size={20} color="inherit" /> : 'Confirm & Reset Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar for Toast Feedback ── */}
      <Snackbar
        open={!!toastMessage}
        autoHideDuration={4000}
        onClose={() => setToastMessage('')}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
