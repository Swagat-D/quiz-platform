'use client'

import { useState } from 'react'
import { Bell, Moon, Sun, Volume2 } from 'lucide-react'
import Navbar from '@/components/navbar'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function Settings() {
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [sound, setSound] = useState(true)

  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      <Navbar showBack />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-[#242b3d] border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-2xl text-[#b388ff]">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {darkMode ? <Moon className="h-5 w-5 text-[#e0e0e0]" /> : <Sun className="h-5 w-5 text-[#e0e0e0]" />}
                  <Label htmlFor="dark-mode" className="text-[#e0e0e0]">Dark Mode</Label>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Bell className="h-5 w-5 text-[#e0e0e0]" />
                  <Label htmlFor="notifications" className="text-[#e0e0e0]">Notifications</Label>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Volume2 className="h-5 w-5 text-[#e0e0e0]" />
                  <Label htmlFor="sound" className="text-[#e0e0e0]">Sound Effects</Label>
                </div>
                <Switch
                  id="sound"
                  checked={sound}
                  onCheckedChange={setSound}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

