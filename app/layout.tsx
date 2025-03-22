import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import AuthProvider from "../providers/auth-provider";
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DevQuizWare',
  description: 'Level up your dev skills with interactive quizzes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider> 
      </body>
    </html>
  )
}

