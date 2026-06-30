// One-time import script for Cobaltax historical data
// Usage: node scripts/import-cobaltax.mjs <email> <password>
//
// NOTE: date 2025-05-01 (Instalación ordenador portátil Rafel) appears in the
// 2T 2026 sheet — assumed to be a typo and corrected to 2026-05-01.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')

// Parse .env.local
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
)

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SUPABASE_KEY = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

const [,, email, password] = process.argv
if (!email || !password) {
  console.error('Usage: node scripts/import-cobaltax.mjs <email> <password>')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ---------------------------------------------------------------------------
// Historical data extracted from Cobaltax_Trimestres.xlsx
// ---------------------------------------------------------------------------
const CLIENT = { name: 'Cobaltax Universal', hourly_rate: 16 }

const ENTRIES = [
  // 4T 2025
  { date: '2025-10-15', description: 'Instalar Web este',              hours: 2    },
  { date: '2025-12-20', description: 'Publicar web de Oriol',          hours: 2    },
  // 1T 2026
  { date: '2026-02-05', description: 'Redirecciones cobaltax',         hours: 1.5  },
  { date: '2026-02-11', description: 'Rafel VPN',                      hours: 0.25 },
  { date: '2026-02-20', description: 'Rafel Portátil investigar',      hours: 0.5  },
  // 2T 2026
  { date: '2026-04-18', description: 'Tienda',                         hours: 4    },
  { date: '2026-04-25', description: 'Tienda',                         hours: 4    },
  { date: '2026-05-01', description: 'Instalación ordenador portátil Rafel', hours: 2 }, // typo corrected: was 2025
  { date: '2026-05-02', description: 'Tienda',                         hours: 4    },
  { date: '2026-05-09', description: 'Tienda',                         hours: 4    },
  { date: '2026-05-16', description: 'Tienda',                         hours: 4    },
  { date: '2026-05-23', description: 'Tienda',                         hours: 4    },
  { date: '2026-05-30', description: 'Tienda',                         hours: 4    },
  { date: '2026-06-06', description: 'Tienda',                         hours: 4    },
  { date: '2026-06-27', description: 'Tienda',                         hours: 4    },
]

// ---------------------------------------------------------------------------

async function main() {
  console.log(`Signing in as ${email}...`)
  const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
  if (authErr) {
    console.error('Login failed:', authErr.message)
    process.exit(1)
  }

  const { data: { user } } = await supabase.auth.getUser()
  console.log(`Logged in as ${user.email} (${user.id})`)

  // Create client
  console.log(`\nCreating client "${CLIENT.name}" @ ${CLIENT.hourly_rate}€/h...`)
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .insert({ ...CLIENT, user_id: user.id })
    .select()
    .single()

  if (clientErr) {
    console.error('Failed to create client:', clientErr.message)
    process.exit(1)
  }
  console.log(`Client created with id: ${client.id}`)

  // Insert entries
  console.log(`\nInserting ${ENTRIES.length} work entries...`)
  const rows = ENTRIES.map(e => ({
    ...e,
    client_id: client.id,
    user_id: user.id,
  }))

  const { error: entriesErr } = await supabase.from('work_entries').insert(rows)
  if (entriesErr) {
    console.error('Failed to insert entries:', entriesErr.message)
    process.exit(1)
  }

  const totalHours = ENTRIES.reduce((s, e) => s + e.hours, 0)
  const totalAmount = totalHours * CLIENT.hourly_rate
  console.log(`Done! ${ENTRIES.length} entries imported.`)
  console.log(`Total: ${totalHours}h = ${totalAmount}€`)
}

main()
