export const PROJECT_MANAGERS = [
  'Ahmed Al Mansoori',
  'Khalid Al Hashmi',
  'Mohamed Al Rashidi',
  'Salem Al Mazrouei',
  'Yousef Al Shamsi',
  'Other',
]

export const STATUS_CHOICES = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const HANDING_OVER_STATUS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Done', label: 'Done' },
  { value: 'N/A', label: 'N/A' },
]

export const PAYMENT_SLOTS = Array.from({ length: 14 }, (_, i) => ({
  value: `Payment_${i + 1}`,
  label: `Payment ${i + 1}`,
}))

export const VARIATION_FIELDS = [
  { key: 'Main_Contract_Value', label: 'Main Contract' },
  { key: 'Variation_1', label: 'Variation 1' },
  { key: 'Variation_2', label: 'Variation 2' },
  { key: 'Variation_3', label: 'Variation 3' },
  { key: 'Variation_4', label: 'Variation 4' },
  { key: 'Variation_5', label: 'Variation 5' },
  { key: 'Variation_6', label: 'Variation 6' },
  { key: 'Variation_7', label: 'Variation 7' },
]

export const ATTACHMENT_FIELDS = [
  'Contract',
  'Drawing',
  'Specification',
  'BOQ',
  'Correspondence',
  'Invoice',
  'Other',
]

export const ROLES = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
]

export const CHART_COLORS = [
  '#1e40af', '#3b82f6', '#60a5fa', '#93c5fd',
  '#1d4ed8', '#2563eb', '#0ea5e9', '#0284c7',
  '#0369a1', '#075985',
]
