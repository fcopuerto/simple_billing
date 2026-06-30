export interface Client {
  id: string
  user_id: string
  name: string
  hourly_rate: number
  created_at: string
}

export interface WorkEntry {
  id: string
  client_id: string
  user_id: string
  date: string // ISO date string: YYYY-MM-DD
  description: string
  hours: number
  created_at: string
}

export interface WorkEntryWithClient extends WorkEntry {
  clients: Pick<Client, 'name' | 'hourly_rate'>
}
