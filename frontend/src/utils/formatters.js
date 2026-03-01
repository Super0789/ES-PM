export const formatCurrency = (value) => {
  if (value == null) return 'AED 0'
  return 'AED ' + Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB')
}

export const formatPercent = (value) => {
  if (value == null) return '0%'
  return (Number(value) * 100).toFixed(1) + '%'
}

export const formatNumber = (value) => {
  if (value == null) return '0'
  return Number(value).toLocaleString('en-US')
}
