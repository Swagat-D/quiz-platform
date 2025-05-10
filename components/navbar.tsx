'use client'

import { useState, useRef, useEffect } from 'react'
import { Code, Settings, Menu, X, ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
import { ProfileDropdown } from './profile-dropdown'
import { SettingsSubpage } from './settings-subpage'
import { useSession } from "next-auth/react"
import { LogoutButton } from './logout-button'

interface NavbarProps {
  showBack?: boolean
}

export default function Navbar({ showBack }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const showBackButton = pathname !== '/' && pathname !== '/dashboard'
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [settingsRef])

  return (
    <nav className="border-b bg-[#1a1f2e] border-purple-500/20 relative">
      <div className="flex h-16 items-center px-4 md:px-6">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 text-[#e0e0e0] hover:text-white hover:bg-purple-500/10"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden text-[#e0e0e0] hover:text-white hover:bg-purple-500/10"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 ml-2">
          <Code className="h-6 w-6 text-[#b388ff]" />
          <span className="text-xl font-bold text-[#b388ff] tracking-wider">DevQuizWare</span>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="text-[#e0e0e0] hover:text-white hover:bg-purple-500/10" asChild>
              <Link href="/dashboard">Home</Link>
            </Button>
            <Button variant="ghost" className="text-[#e0e0e0] hover:text-white hover:bg-purple-500/10" asChild>
              <Link href="/about">About</Link>
            </Button>
            <Button variant="ghost" className="text-[#e0e0e0] hover:text-white hover:bg-purple-500/10" asChild>
              <Link href="/contact">Contact</Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <ProfileDropdown />
            <div ref={settingsRef}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-[#e0e0e0] hover:text-white hover:bg-purple-500/10"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              >
                <Settings className="h-5 w-5" />
              </Button>
              {isSettingsOpen && <SettingsSubpage onClose={() => setIsSettingsOpen(false)} />}
            </div>
            <LogoutButton 
              variant="default" 
              size="sm" 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              text="Logout"
              showIcon={false}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-50 md:hidden transition-opacity duration-300",
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMenuOpen(false)}
      />

      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 w-[280px] bg-[#242b3d] z-50 md:hidden transition-transform duration-300 ease-in-out",
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
            <div className="flex items-center gap-2">
              <Code className="h-6 w-6 text-[#b388ff]" />
              <span className="text-xl font-bold text-[#b388ff]">DevQuizWare</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-[#e0e0e0] hover:text-white hover:bg-purple-500/10"
              onClick={() => setIsMenuOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Sidebar Content */}
          <div className="flex flex-col gap-2 p-4">
            <Button variant="ghost" className="w-full justify-start text-[#e0e0e0] hover:text-white hover:bg-purple-500/10" asChild>
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>Home</Link>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-[#e0e0e0] hover:text-white hover:bg-purple-500/10 h-12" asChild>
              <Link href="/about" onClick={() => setIsMenuOpen(false)}>About</Link>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-[#e0e0e0] hover:text-white hover:bg-purple-500/10 h-12" asChild>
              <Link href="/contact" onClick={() => setIsMenuOpen(false)}>Contact</Link>
            </Button>
          </div>

          {/* Sidebar Footer */}
          <div className="mt-auto p-4 border-t border-purple-500/20">
            <LogoutButton 
              variant="default" 
              size="lg" 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            />
          </div>
        </div>
      </div>
    </nav>
  )
}