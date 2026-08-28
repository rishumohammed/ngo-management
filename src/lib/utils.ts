import dayjs from 'dayjs'

/**
 * Generates the next sequential donation receipt number.
 * Format: FMF/YYYY-YY/NNNN (e.g. FMF/2026-27/0042)
 * Uses the format stored in OrgSettings, falls back to default.
 */
export function getFiscalYear(date: Date = new Date(), fyStartMonth = 4): string {
  const d = dayjs(date)
  const month = d.month() + 1 // dayjs months are 0-indexed
  const year = d.year()

  if (month >= fyStartMonth) {
    return `${year}-${String(year + 1).slice(2)}`
  } else {
    return `${year - 1}-${String(year).slice(2)}`
  }
}

export function getFiscalYearDateRange(fiscalYear: string): { startDate: Date; endDate: Date } | null {
  if (!fiscalYear || fiscalYear === 'ALL') return null
  const parts = fiscalYear.split('-')
  if (parts.length !== 2) return null
  const startYear = parseInt(parts[0], 10)
  if (isNaN(startYear)) return null

  const startDate = new Date(startYear, 3, 1, 0, 0, 0, 0) // April 1st of startYear
  const endDate = new Date(startYear + 1, 2, 31, 23, 59, 59, 999) // March 31st of startYear + 1
  return { startDate, endDate }
}

export function getFiscalYearOptions(pastYears = 4, futureYears = 3): string[] {
  const currentFY = getFiscalYear(new Date())
  const startYear = parseInt(currentFY.split('-')[0], 10)
  const options = new Set<string>()

  for (let i = -pastYears; i <= futureYears; i++) {
    const y = startYear + i
    const nextY = String(y + 1).slice(2)
    options.add(`${y}-${nextY}`)
  }

  return Array.from(options).sort().reverse()
}

export function formatReceiptNumber(
  prefix: string,
  fiscalYear: string,
  sequence: number
): string {
  return `${prefix}/${fiscalYear}/${String(sequence).padStart(4, '0')}`
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatDate(date: Date | string, format = 'DD MMM YYYY'): string {
  return dayjs(date).format(format)
}

export function formatDateTime(date: Date | string): string {
  return dayjs(date).format('DD MMM YYYY, hh:mm A')
}

export function isTermExpired(termEnd: Date | null | undefined): boolean {
  if (!termEnd) return false
  return dayjs(termEnd).isBefore(dayjs())
}

export function isTermExpiringSoon(
  termEnd: Date | null | undefined,
  withinDays = 30
): boolean {
  if (!termEnd) return false
  const end = dayjs(termEnd)
  const now = dayjs()
  return end.isAfter(now) && end.diff(now, 'day') <= withinDays
}

export function getMemberNumber(sequence: number): string {
  return `FMF-M-${String(sequence).padStart(4, '0')}`
}

export function numberToWords(amount: number | string): string {
  const num = Math.floor(Math.abs(typeof amount === 'string' ? parseFloat(amount) : amount))
  if (isNaN(num) || num === 0) return 'Zero Rupees Only'

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ]
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convertChunk(n: number): string {
    if (n === 0) return ''
    if (n < 20) return units[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '')
    return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertChunk(n % 100) : '')
  }

  let result = ''
  let remaining = num

  const crore = Math.floor(remaining / 10000000)
  remaining %= 10000000
  const lakh = Math.floor(remaining / 100000)
  remaining %= 100000
  const thousand = Math.floor(remaining / 1000)
  remaining %= 1000

  if (crore > 0) result += convertChunk(crore) + ' Crore '
  if (lakh > 0) result += convertChunk(lakh) + ' Lakh '
  if (thousand > 0) result += convertChunk(thousand) + ' Thousand '
  if (remaining > 0) result += convertChunk(remaining) + ' '

  return result.trim() + ' Rupees Only'
}

