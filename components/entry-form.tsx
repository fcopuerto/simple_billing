'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Client, WorkEntry } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface EntryFormProps {
  entry?: WorkEntry
  clients: Client[]
  defaultClientId?: string
  onSuccess: () => void
  onCancel: () => void
}

export default function EntryForm({
  entry,
  clients,
  defaultClientId,
  onSuccess,
  onCancel,
}: EntryFormProps) {
  const supabase = createClient()
  const [clientId, setClientId] = useState(entry?.client_id ?? defaultClientId ?? (clients[0]?.id ?? ''))
  const [date, setDate] = useState(entry?.date ?? new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState(entry?.description ?? '')
  const [hours, setHours] = useState(entry?.hours?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedClient = clients.find((c) => c.id === clientId)
  const parsedHours = parseFloat(hours)
  const amount =
    selectedClient && !isNaN(parsedHours) && parsedHours > 0
      ? parsedHours * selectedClient.hourly_rate
      : null

  useEffect(() => {
    if (!entry && defaultClientId) {
      setClientId(defaultClientId)
    }
  }, [defaultClientId, entry])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const h = parseFloat(hours)
    if (isNaN(h) || h <= 0) {
      setError('Las horas deben ser un número positivo.')
      setLoading(false)
      return
    }

    if (!clientId) {
      setError('Selecciona un cliente.')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('No autenticado.')
      setLoading(false)
      return
    }

    if (entry) {
      const { error: err } = await supabase
        .from('work_entries')
        .update({
          client_id: clientId,
          date,
          description: description.trim(),
          hours: h,
        })
        .eq('id', entry.id)
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
    } else {
      const { error: err } = await supabase
        .from('work_entries')
        .insert({
          client_id: clientId,
          user_id: user.id,
          date,
          description: description.trim(),
          hours: h,
        })
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {clients.length === 0 && (
            <option value="">Sin clientes</option>
          )}
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({formatCurrency(c.hourly_rate)}/h)
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          placeholder="Describe el trabajo realizado..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Horas / Unidades
        </label>
        <input
          type="number"
          step="0.25"
          min="0.25"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          required
          placeholder="Ej: 2.5"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Live calculation */}
      {amount !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-blue-700">
            {parsedHours.toFixed(2)} h × {formatCurrency(selectedClient!.hourly_rate)}/h
          </span>
          <span className="text-base font-bold text-blue-800">{formatCurrency(amount)}</span>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || clients.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Guardando...' : entry ? 'Actualizar' : 'Añadir registro'}
        </button>
      </div>
    </form>
  )
}
