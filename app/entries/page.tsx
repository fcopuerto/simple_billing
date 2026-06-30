'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
import EntryForm from '@/components/entry-form'
import type { Client, WorkEntry, WorkEntryWithClient } from '@/lib/types'
import {
  formatDate,
  formatCurrency,
  formatHours,
  getQuarterFromDate,
  quarterLabel,
  getAvailableQuarters,
  quarterDateRange,
} from '@/lib/utils'

export default function EntriesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [entries, setEntries] = useState<WorkEntryWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filterClientId, setFilterClientId] = useState<string>('all')
  const availableQuarters = getAvailableQuarters()
  const [filterQuarterIdx, setFilterQuarterIdx] = useState<number>(0) // 0 = current

  const filterQuarter = availableQuarters[filterQuarterIdx]
  const { start, end } = quarterDateRange(filterQuarter)
  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  const fetchClients = useCallback(async () => {
    const { data } = await supabase.from('clients').select('*').order('name')
    setClients(data ?? [])
  }, [])

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('work_entries')
      .select('*, clients(name, hourly_rate)')
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: false })

    if (filterClientId !== 'all') {
      query = query.eq('client_id', filterClientId)
    }

    const { data, error: err } = await query
    if (err) {
      setError(err.message)
    } else {
      setEntries((data ?? []) as WorkEntryWithClient[])
    }
    setLoading(false)
  }, [startStr, endStr, filterClientId])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  async function handleDelete(id: string) {
    if (!confirm('¿Seguro que quieres eliminar este registro?')) return
    setDeletingId(id)
    const { error: err } = await supabase.from('work_entries').delete().eq('id', id)
    if (err) {
      setError(err.message)
    } else {
      await fetchEntries()
    }
    setDeletingId(null)
  }

  function handleFormSuccess() {
    setShowForm(false)
    setEditingEntry(null)
    fetchEntries()
  }

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)
  const totalAmount = entries.reduce(
    (sum, e) => sum + e.hours * (e.clients?.hourly_rate ?? 0),
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registros de trabajo</h1>
          <p className="text-gray-500 text-sm mt-1">
            {quarterLabel(filterQuarter)}: {formatDate(start)} — {formatDate(end)}
          </p>
        </div>
        {!showForm && !editingEntry && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
          >
            + Nuevo registro
          </button>
        )}
      </div>

      {/* Form panel */}
      {(showForm || editingEntry) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {editingEntry ? 'Editar registro' : 'Nuevo registro'}
          </h2>
          <EntryForm
            entry={editingEntry ?? undefined}
            clients={clients}
            defaultClientId={filterClientId !== 'all' ? filterClientId : undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false)
              setEditingEntry(null)
            }}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Trimestre:</label>
          <select
            value={filterQuarterIdx}
            onChange={(e) => setFilterQuarterIdx(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {availableQuarters.map((q, i) => (
              <option key={i} value={i}>
                {quarterLabel(q)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Cliente:</label>
          <select
            value={filterClientId}
            onChange={(e) => setFilterClientId(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">Todos</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary bar */}
      {!loading && entries.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Registros</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{entries.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total horas</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatHours(totalHours)} h</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total importe</p>
            <p className="text-xl font-bold text-blue-700 mt-1">{formatCurrency(totalAmount)}</p>
          </div>
        </div>
      )}

      {/* Entries table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Cargando...</div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No hay registros para este período.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-28">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Descripción</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 w-28">Cliente</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700 w-20">Horas</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700 w-28">Importe</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700 w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => {
                const client = entry.clients
                const amount = entry.hours * (client?.hourly_rate ?? 0)
                return (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{entry.description}</td>
                    <td className="px-4 py-3 text-gray-600">{client?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                      {formatHours(entry.hours)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800 tabular-nums">
                      {formatCurrency(amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingEntry(entry)
                            setShowForm(false)
                          }}
                          className="text-xs px-2.5 py-1 text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={deletingId === entry.id}
                          className="text-xs px-2.5 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          {deletingId === entry.id ? '...' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td colSpan={3} className="px-4 py-3 font-semibold text-gray-700">
                  TOTAL
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800 tabular-nums">
                  {formatHours(totalHours)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-blue-700 tabular-nums">
                  {formatCurrency(totalAmount)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
