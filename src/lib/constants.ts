export interface PipelineStageConfig {
  key: 'APPLICATION' | 'DOCUMENT_VERIFICATION' | 'INTERVIEW' | 'TRAINING' | 'APPROVED'
  label: string
  description?: string
  enabled: boolean
  required?: boolean
}

export const DEFAULT_PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    key: 'APPLICATION',
    label: 'Application',
    description: 'Initial volunteer registration form submission and screening',
    enabled: true,
    required: true,
  },
  {
    key: 'DOCUMENT_VERIFICATION',
    label: 'Document Verification',
    description: 'Review and verify identity, address, and supporting documents',
    enabled: true,
    required: false,
  },
  {
    key: 'INTERVIEW',
    label: 'Interview',
    description: 'Interaction or interview session with coordinator/counselor',
    enabled: true,
    required: false,
  },
  {
    key: 'TRAINING',
    label: 'Training',
    description: 'Volunteer induction, foundation guidelines, and orientation',
    enabled: true,
    required: false,
  },
  {
    key: 'APPROVED',
    label: 'Approved',
    description: 'Final acceptance and volunteer portal account activation',
    enabled: true,
    required: true,
  },
]

export const DEFAULT_INDIAN_STATES: string[] = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
]
