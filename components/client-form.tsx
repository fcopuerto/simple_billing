'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/types'

interface ClientFormProps {
  client?: Client
  onSuccess: () => void
  onCancel: () => void
}

export default function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const supabase = createClient()
  const [name, setName] = useState(client?.name ?? '')
  const [hourlyRate, setHourlyRate] = useState(client?.hourly_rate?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const rate = parseFloat(hourlyRate)
    if (isNaN(rate) || rate <= 0) {
      setError('El precio por hora debe ser un número positivo.')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('No autenticado.')
      setLoading(false)
      return
    }

    if (client) {
      const { error: err } = await supabase
        .from('clients')
        .update({ name: name.trim(), hourly_rate: rate })
        .eq('id', client.id)
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
    } else {
      const { error: err } = await supabase
        .from('clients')
        .insert({ name: name.trim(), hourly_rate: rate, user_id: user.id })
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del cliente
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Ej: Cobaltax"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Precio por hora (€/h)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
          required
          placeholder="Ej: 16.00"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
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
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Guardando...' : client ? 'Actualizar' : 'Crear cliente'}
        </button>
      </div>
    </form>
  )
}
