"use client"

import { useState } from "react"
import Link from "next/link"
import { Code, Menu } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { LogoutButton } from "./logout-button"

export default function LandingNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[#1a1f2e] border-purple-500/20">
      <div className="container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
        {/* Logo and Mobile Menu Trigger */}
        <div className="flex items-center gap-3">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="p-2 text-[#e0e0e0] hover:text-white hover:bg-purple-500/10 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[280px] sm:w-[320px] bg-[#1a1f2e] border-r border-purple-500/20 p-0"
            >
              <SheetHeader className="border-b border-purple-500/20 p-4">
                <SheetTitle className="flex items-center gap-2 text-[#b388ff]">
                  <Code className="h-6 w-6" />
                  <span className="text-xl font-bold tracking-tight">DevQuizWare</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full">
                <nav className="flex-1 p-4 space-y-2">
                  {navItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="block py-2 px-3 text-[#e0e0e0] hover:text-[#b388ff] text-base font-medium rounded-md hover:bg-purple-500/10 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="border-t border-purple-500/20 p-4 space-y-3">
                  {session ? (
                    <>
                      <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                        <Button
                          variant="secondary"
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2"
                        >
                          Dashboard
                        </Button>
                      </Link>
                      <LogoutButton
                        variant="outline"
                        className="w-full text-[#e0e0e0] hover:text-white border-purple-500/30 hover:bg-purple-500/10 py-2"
                      />
                    </>
                  ) : (
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button
                        variant="secondary"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2"
                      >
                        Log In / Sign Up
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Link className="flex items-center gap-2" href="/">
            <Code className="h-6 w-6 text-[#b388ff]" />
            <span className="text-lg sm:text-xl font-bold text-[#b388ff] tracking-tight">DevQuizWare</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="flex flex-1 items-center justify-end gap-4">
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="text-sm font-medium text-[#e0e0e0] hover:text-[#b388ff] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {session ? (
              <>
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-[#e0e0e0] hover:text-white hover:bg-purple-500/10 px-3 py-2 text-sm font-medium"
                  >
                    Dashboard
                  </Button>
                </Link>
                <LogoutButton
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm font-medium rounded-md"
                  text="Sign Out"
                />
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-[#e0e0e0] hover:text-white hover:bg-purple-500/10 px-3 py-2 text-sm font-medium"
                  >
                    Log In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm font-medium rounded-md"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}