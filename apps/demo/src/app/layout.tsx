import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/Header'
import { Cart } from '@/components/Cart'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'zustand-lite | Лёгкая библиотека управления состоянием',
  description:
    'Лёгкая библиотека управления состоянием для React, вдохновлённая Zustand. Создана с TypeScript, принципами SOLID и лучшими практиками.',
  keywords: ['state management', 'react', 'zustand', 'typescript', 'hooks'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Cart />
      </body>
    </html>
  )
}
