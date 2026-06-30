import { Client, WorkEntry } from './types'
import { formatDate, formatCurrency, quarterLabel, lastDayOfPreviousQuarter, quarterDateRange } from './utils'
import type { Quarter } from './utils'

interface ExportParams {
  client: Client
  quarter: Quarter
  year: number
  entries: WorkEntry[]
}

export async function exportPDF({ client, quarter, year, entries }: ExportParams) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()
  const quarterInfo = { quarter, year }
  const label = quarterLabel(quarterInfo)
  const lastDay = lastDayOfPreviousQuarter(quarterInfo)

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)
  const totalAmount = entries.reduce((sum, e) => sum + e.hours * client.hourly_rate, 0)

  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(`${client.name} — ${label}`, 14, 22)

  // Subtitle
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`Última liquidación: ${formatDate(lastDay)}`, 14, 32)
  doc.setTextColor(0)

  // Info row
  doc.setFontSize(10)
  doc.text(`Precio/hora: ${formatCurrency(client.hourly_rate)}`, 14, 42)

  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date))

  const body = sortedEntries.map((e) => [
    formatDate(e.date),
    e.description,
    e.hours.toFixed(2).replace('.', ','),
    formatCurrency(client.hourly_rate),
    formatCurrency(e.hours * client.hourly_rate),
  ])

  // Total row
  body.push([
    'TOTAL',
    '',
    totalHours.toFixed(2).replace('.', ','),
    '',
    formatCurrency(totalAmount),
  ])

  autoTable(doc, {
    head: [['Fecha', 'Descripción', '# Horas', 'Precio (€/h)', 'Importe (€)']],
    body,
    startY: 50,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 80 },
      2: { halign: 'right', cellWidth: 22 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 28 },
    },
    didParseCell: (data) => {
      // Style total row
      if (data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [241, 245, 249]
      }
    },
  })

  doc.save(`${client.name}_${quarter}T_${year}.pdf`)
}

export async function exportExcel({ client, quarter, year, entries }: ExportParams) {
  const XLSX = await import('xlsx')

  const quarterInfo = { quarter, year }
  const label = quarterLabel(quarterInfo)
  const lastDay = lastDayOfPreviousQuarter(quarterInfo)
  const { start, end } = quarterDateRange(quarterInfo)

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)
  const totalAmount = entries.reduce((sum, e) => sum + e.hours * client.hourly_rate, 0)

  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date))

  // Build rows
  const headerRows = [
    [`${client.name} — ${label}`],
    [`Última liquidación: ${formatDate(lastDay)}`],
    [`Período: ${formatDate(start)} – ${formatDate(end)}`],
    [`Precio/hora: ${client.hourly_rate} €/h`],
    [],
    ['Fecha', 'Descripción', '# Horas', 'Precio (€/h)', 'Importe (€)'],
  ]

  const dataRows = sortedEntries.map((e) => [
    formatDate(e.date),
    e.description,
    e.hours,
    client.hourly_rate,
    e.hours * client.hourly_rate,
  ])

  const totalRow = ['TOTAL', '', totalHours, '', totalAmount]

  const allRows = [...headerRows, ...dataRows, [], totalRow]

  const ws = XLSX.utils.aoa_to_sheet(allRows)

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // Fecha
    { wch: 45 }, // Descripción
    { wch: 10 }, // Horas
    { wch: 14 }, // Precio
    { wch: 14 }, // Importe
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, label)

  XLSX.writeFile(wb, `${client.name}_${quarter}T_${year}.xlsx`)
}
