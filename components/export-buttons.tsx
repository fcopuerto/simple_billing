'use client'

import { useState } from 'react'
import { exportPDF, exportExcel } from '@/lib/export'
import type { Client, WorkEntry } from '@/lib/types'
import type { Quarter } from '@/lib/utils'

interface ExportButtonsProps {
  client: Client
  quarter: Quarter
  year: number
  entries: WorkEntry[]
}

export default function ExportButtons({ client, quarter, year, entries }: ExportButtonsProps) {
  const [loadingPDF, setLoadingPDF] = useState(false)
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePDF() {
    setLoadingPDF(true)
    setError(null)
    try {
      await exportPDF({ client, quarter, year, entries })
    } catch (err) {
      setError('Error al generar el PDF. Inténtalo de nuevo.')
      console.error(err)
    } finally {
      setLoadingPDF(false)
    }
  }

  async function handleExcel() {
    setLoadingExcel(true)
    setError(null)
    try {
      await exportExcel({ client, quarter, year, entries })
    } catch (err) {
      setError('Error al generar el Excel. Inténtalo de nuevo.')
      console.error(err)
    } finally {
      setLoadingExcel(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={handlePDF}
          disabled={loadingPDF || entries.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          {loadingPDF ? 'Generando...' : 'Exportar PDF'}
        </button>
        <button
          onClick={handleExcel}
          disabled={loadingExcel || entries.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-md hover:bg-green-800 disabled:opacity-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {loadingExcel ? 'Generando...' : 'Exportar Excel'}
        </button>
      </div>
      {entries.length === 0 && (
        <p className="text-xs text-gray-400">Sin registros para exportar</p>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}
    </div>
  )
}
