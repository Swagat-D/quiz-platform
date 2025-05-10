'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
  redirectPath?: string
  text?: string
}

export function LogoutButton({
  variant = 'default',
  size = 'default',
  className = '',
  showIcon = true,
  redirectPath = '/',
  text = 'Logout'
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      
      // First call our API route to clear cookies
      await fetch('/api/auth/logout', { method: 'GET' })
      
      // Then use NextAuth signOut with redirect
      await signOut({ 
        callbackUrl: redirectPath,
        redirect: true
      })
      
      // Clear any persisted state in localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('next-auth.session-state')
        localStorage.removeItem('next-auth.csrf-token')
        localStorage.removeItem('next-auth.callback-url')
        
        // Add a small delay to ensure cookies are cleared
        setTimeout(() => {
          window.location.href = redirectPath
        }, 300)
      }
    } catch (error) {
      console.error('Error during logout:', error)
      // Fallback to force redirect even if there's an error
      window.location.href = redirectPath
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? <Spinner className="mr-2 h-4 w-4" /> : showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {text}
    </Button>
  )
}