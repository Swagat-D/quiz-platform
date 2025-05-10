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
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="md:hidden text-[#e0e0e0] hover:text-white hover:bg-purple-500/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[300px] bg-[#1a1f2e] p-0"
            >
              <SheetHeader className="border-b border-purple-500/20 p-4">
                <SheetTitle className="flex items-center gap-2 text-[#b388ff]">
                  <Code className="h-6 w-6" />
                  <span className="text-xl font-bold tracking-wider">DevQuizWare</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full">
                <nav className="flex-1 p-4">
                  {navItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="flex items-center h-12 text-[#e0e0e0] hover:text-[#b388ff] transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="border-t border-purple-500/20 p-4">
                  {session ? (
                    <>
                      <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                        <Button
                          variant="secondary"
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white mb-2"
                        >
                          Dashboard
                        </Button>
                      </Link>
                      <LogoutButton
                        variant="outline"
                        className="w-full text-[#e0e0e0] hover:text-white border-purple-500/20 hover:bg-purple-500/10"
                      />
                    </>
                  ) : (
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button
                        variant="secondary"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white mb-2"
                      >
                        Log In / Sign Up
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Link className="flex items-center justify-center" href="/">
            <Code className="h-6 w-6 text-[#b388ff]" />
            <span className="ml-2 text-xl font-bold text-[#b388ff] tracking-wider">DevQuizWare</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2">
          <nav className="hidden md:flex items-center space-x-6 flex-1 justify-center">
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
          <div className="hidden md:flex items-center space-x-2">
            {session ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-[#e0e0e0] hover:text-white hover:bg-purple-500/10">
                    Dashboard
                  </Button>
                </Link>
                <LogoutButton 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  text="Sign Out"
                />
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-[#e0e0e0] hover:text-white hover:bg-purple-500/10">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
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