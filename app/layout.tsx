import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/nav'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'FPS IT — Control de horas',
  description: 'Gestión de horas y facturación freelance',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">
        {user && <Nav />}
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
