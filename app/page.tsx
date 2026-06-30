import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  getCurrentQuarter,
  quarterLabel,
  quarterDateRange,
  formatCurrency,
  formatDate,
} from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch stats
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  const currentQ = getCurrentQuarter()
  const { start, end } = quarterDateRange(currentQ)

  const { data: currentEntries } = await supabase
    .from('work_entries')
    .select('*, clients(name, hourly_rate)')
    .gte('date', start.toISOString().slice(0, 10))
    .lte('date', end.toISOString().slice(0, 10))

  const totalHoursCurrentQ = (currentEntries ?? []).reduce(
    (sum, e) => sum + (e.hours ?? 0),
    0
  )
  const totalAmountCurrentQ = (currentEntries ?? []).reduce(
    (sum, e) => sum + (e.hours ?? 0) * ((e.clients as { hourly_rate: number })?.hourly_rate ?? 0),
    0
  )

  const { data: recentEntries } = await supabase
    .from('work_entries')
    .select('*, clients(name, hourly_rate)')
    .order('date', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel principal</h1>
        <p className="text-gray-500 text-sm mt-1">
          Trimestre actual: {quarterLabel(currentQ)} &mdash; {formatDate(start)} al {formatDate(end)}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Clientes</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{clients?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Horas {quarterLabel(currentQ)}
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {totalHoursCurrentQ.toFixed(2)} h
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Facturado {quarterLabel(currentQ)}
          </p>
          <p className="text-3xl font-bold text-blue-700 mt-1">
            {formatCurrency(totalAmountCurrentQ)}
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/entries"
          className="bg-blue-700 text-white rounded-lg px-5 py-4 hover:bg-blue-800 transition-colors flex items-center justify-between group"
        >
          <div>
            <p className="font-semibold">Añadir registro</p>
            <p className="text-blue-200 text-xs mt-0.5">Registrar horas trabajadas</p>
          </div>
          <svg className="w-5 h-5 text-blue-300 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href="/invoices"
          className="bg-white text-gray-800 border border-gray-200 rounded-lg px-5 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between group"
        >
          <div>
            <p className="font-semibold">Ver factura</p>
            <p className="text-gray-400 text-xs mt-0.5">Exportar PDF o Excel</p>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href="/clients"
          className="bg-white text-gray-800 border border-gray-200 rounded-lg px-5 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between group"
        >
          <div>
            <p className="font-semibold">Gestionar clientes</p>
            <p className="text-gray-400 text-xs mt-0.5">Tarifas por cliente</p>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Recent entries */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Últimos registros</h2>
          <Link href="/entries" className="text-sm text-blue-600 hover:underline">
            Ver todos
          </Link>
        </div>
        {!recentEntries || recentEntries.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            No hay registros todavía.{' '}
            <Link href="/entries" className="text-blue-600 hover:underline">
              Añadir el primero
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentEntries.map((entry) => {
              const client = entry.clients as { name: string; hourly_rate: number } | null
              return (
                <div key={entry.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">
                      {formatDate(entry.date)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate">{entry.description}</p>
                      <p className="text-xs text-gray-400">{client?.name}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-medium text-gray-800">
                      {formatCurrency((entry.hours ?? 0) * (client?.hourly_rate ?? 0))}
                    </p>
                    <p className="text-xs text-gray-400">{entry.hours} h</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
