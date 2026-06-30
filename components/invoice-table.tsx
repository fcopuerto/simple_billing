import type { Client, WorkEntry } from '@/lib/types'
import { formatDate, formatCurrency, formatHours, quarterLabel, lastDayOfPreviousQuarter } from '@/lib/utils'
import type { Quarter } from '@/lib/utils'

interface InvoiceTableProps {
  client: Client
  quarter: Quarter
  year: number
  entries: WorkEntry[]
}

export default function InvoiceTable({ client, quarter, year, entries }: InvoiceTableProps) {
  const quarterInfo = { quarter, year }
  const label = quarterLabel(quarterInfo)
  const lastDay = lastDayOfPreviousQuarter(quarterInfo)

  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)
  const totalAmount = entries.reduce((sum, e) => sum + e.hours * client.hourly_rate, 0)

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Invoice header */}
      <div className="bg-blue-700 text-white px-6 py-5">
        <h2 className="text-xl font-bold">{client.name} — {label}</h2>
        <p className="text-blue-200 text-sm mt-1">
          Última liquidación: {formatDate(lastDay)}
        </p>
        <p className="text-blue-200 text-sm">
          Precio/hora: {formatCurrency(client.hourly_rate)}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 w-28">Fecha</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Descripción</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 w-24"># Horas</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 w-32">Precio (€/h)</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700 w-32">Importe (€)</th>
            </tr>
          </thead>
          <tbody>
            {sortedEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400">
                  No hay registros para este período
                </td>
              </tr>
            ) : (
              sortedEntries.map((entry, i) => (
                <tr
                  key={entry.id}
                  className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(entry.date)}</td>
                  <td className="px-4 py-3 text-gray-800">{entry.description}</td>
                  <td className="px-4 py-3 text-right text-gray-700 tabular-nums">{formatHours(entry.hours)}</td>
                  <td className="px-4 py-3 text-right text-gray-600 tabular-nums">{formatCurrency(client.hourly_rate)}</td>
                  <td className="px-4 py-3 text-right text-gray-800 tabular-nums font-medium">{formatCurrency(entry.hours * client.hourly_rate)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-blue-50 border-t-2 border-blue-200">
              <td className="px-4 py-3 font-bold text-gray-900" colSpan={2}>TOTAL</td>
              <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">{formatHours(totalHours)}</td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3 text-right font-bold text-blue-700 text-base tabular-nums">{formatCurrency(totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
