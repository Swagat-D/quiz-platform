import { useState } from 'react'
import { Bell, Moon, Sun, Volume2 } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface SettingsSubpageProps {
  onClose: () => void;
}

export function SettingsSubpage({ onClose }: SettingsSubpageProps) {
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [sound, setSound] = useState(true)

  return (
    <Card className="absolute right-0 top-full mt-2 w-64 bg-[#242b3d] border-purple-500/20 text-[#e0e0e0] shadow-lg rounded-md overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <Label htmlFor="dark-mode" className="text-sm">Dark Mode</Label>
          </div>
          <Switch
            id="dark-mode"
            checked={darkMode}
            onCheckedChange={setDarkMode}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <Label htmlFor="notifications" className="text-sm">Notifications</Label>
          </div>
          <Switch
            id="notifications"
            checked={notifications}
            onCheckedChange={setNotifications}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4" />
            <Label htmlFor="sound" className="text-sm">Sound Effects</Label>
          </div>
          <Switch
            id="sound"
            checked={sound}
            onCheckedChange={setSound}
          />
        </div>
      </CardContent>
    </Card>
  )
}

