'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import InvoiceTable from '@/components/invoice-table'
import ExportButtons from '@/components/export-buttons'
import type { Client, WorkEntry } from '@/lib/types'
import {
  getCurrentQuarter,
  getAvailableQuarters,
  quarterLabel,
  quarterDateRange,
  formatDate,
} from '@/lib/utils'
import type { Quarter } from '@/lib/utils'

const supabase = createClient()

export default function InvoicesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [entries, setEntries] = useState<WorkEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [clientsLoading, setClientsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentQ = getCurrentQuarter()
  const availableQuarters = getAvailableQuarters()
  const [selectedQuarterIdx, setSelectedQuarterIdx] = useState(0)

  const selectedQuarter = availableQuarters[selectedQuarterIdx]
  const { start, end } = quarterDateRange(selectedQuarter)
  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null

  const fetchClients = useCallback(async () => {
    setClientsLoading(true)
    const { data, error: err } = await supabase.from('clients').select('*').order('name')
    if (err) {
      setError(err.message)
    } else {
      const clientList = data ?? []
      setClients(clientList)
      if (clientList.length > 0 && !selectedClientId) {
        setSelectedClientId(clientList[0].id)
      }
    }
    setClientsLoading(false)
  }, [])

  const fetchEntries = useCallback(async () => {
    if (!selectedClientId) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('work_entries')
      .select('*')
      .eq('client_id', selectedClientId)
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: true })

    if (err) {
      setError(err.message)
    } else {
      setEntries(data ?? [])
    }
    setLoading(false)
  }, [selectedClientId, startStr, endStr])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  if (clientsLoading) {
    return (
      <div className="py-20 text-center text-gray-400 text-sm">Cargando...</div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">No hay clientes. Crea uno primero en la sección Clientes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
        <p className="text-gray-500 text-sm mt-1">
          Genera y exporta facturas por cliente y trimestre
        </p>
      </div>

      {/* Selectors */}
      <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
        <div className="flex flex-wrap gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cliente</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-40"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Trimestre</label>
            <select
              value={selectedQuarterIdx}
              onChange={(e) => setSelectedQuarterIdx(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-32"
            >
              {availableQuarters.map((q, i) => (
                <option key={i} value={i}>
                  {quarterLabel(q)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <span className="text-xs text-gray-400">
              Período: {formatDate(start)} – {formatDate(end)}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Cargando registros...</div>
      ) : selectedClient ? (
        <>
          <InvoiceTable
            client={selectedClient}
            quarter={selectedQuarter.quarter as Quarter}
            year={selectedQuarter.year}
            entries={entries}
          />
          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-5 py-4">
            <p className="text-sm text-gray-500">
              {entries.length} registro{entries.length !== 1 ? 's' : ''} en {quarterLabel(selectedQuarter)}
            </p>
            <ExportButtons
              client={selectedClient}
              quarter={selectedQuarter.quarter as Quarter}
              year={selectedQuarter.year}
              entries={entries}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
