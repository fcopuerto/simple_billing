'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import ClientForm from '@/components/client-form'
import type { Client } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

export default function ClientsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('clients')
      .select('*')
      .order('name')
    if (err) {
      setError(err.message)
    } else {
      setClients(data ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  async function handleDelete(id: string) {
    if (!confirm('¿Seguro que quieres eliminar este cliente? También se eliminarán todos sus registros.')) return
    setDeletingId(id)
    const { error: err } = await supabase.from('clients').delete().eq('id', id)
    if (err) {
      setError(err.message)
    } else {
      await fetchClients()
    }
    setDeletingId(null)
  }

  function handleFormSuccess() {
    setShowForm(false)
    setEditingClient(null)
    fetchClients()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona tus clientes y sus tarifas</p>
        </div>
        {!showForm && !editingClient && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
          >
            + Nuevo cliente
          </button>
        )}
      </div>

      {/* Form panel */}
      {(showForm || editingClient) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {editingClient ? 'Editar cliente' : 'Nuevo cliente'}
          </h2>
          <ClientForm
            client={editingClient ?? undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false)
              setEditingClient(null)
            }}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      {/* Clients list */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Cargando...</div>
        ) : clients.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No hay clientes. Crea el primero con el botón de arriba.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Nombre</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Precio/hora</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700 w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{client.name}</td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {formatCurrency(client.hourly_rate)}/h
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingClient(client)
                          setShowForm(false)
                        }}
                        className="text-xs px-2.5 py-1 text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        disabled={deletingId === client.id}
                        className="text-xs px-2.5 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        {deletingId === client.id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
