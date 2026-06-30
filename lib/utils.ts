import { format, startOfMonth, endOfMonth, subDays } from 'date-fns'

export type Quarter = 1 | 2 | 3 | 4

export interface QuarterInfo {
  quarter: Quarter
  year: number
}

export function getQuarterFromDate(date: Date): QuarterInfo {
  const month = date.getMonth() + 1 // 1-12
  let quarter: Quarter
  if (month <= 3) quarter = 1
  else if (month <= 6) quarter = 2
  else if (month <= 9) quarter = 3
  else quarter = 4
  return { quarter, year: date.getFullYear() }
}

export function getCurrentQuarter(): QuarterInfo {
  return getQuarterFromDate(new Date())
}

export function quarterLabel({ quarter, year }: QuarterInfo): string {
  return `${quarter}T ${year}`
}

export function quarterDateRange({ quarter, year }: QuarterInfo): {
  start: Date
  end: Date
} {
  const startMonth = (quarter - 1) * 3 // 0-indexed: 0, 3, 6, 9
  const start = startOfMonth(new Date(year, startMonth, 1))
  const end = endOfMonth(new Date(year, startMonth + 2, 1))
  return { start, end }
}

export function lastDayOfPreviousQuarter({ quarter, year }: QuarterInfo): Date {
  const { start } = quarterDateRange({ quarter, year })
  return subDays(start, 1)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  return format(d, 'dd/MM/yyyy')
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatHours(hours: number): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(hours)
}

export function getAvailableQuarters(): QuarterInfo[] {
  const current = getCurrentQuarter()
  const quarters: QuarterInfo[] = []
  // Go back 8 quarters (2 years)
  for (let i = 0; i < 8; i++) {
    let q = current.quarter - i
    let y = current.year
    while (q <= 0) {
      q += 4
      y -= 1
    }
    quarters.push({ quarter: q as Quarter, year: y })
  }
  return quarters
}
