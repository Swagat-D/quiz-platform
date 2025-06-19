/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/rooms/create/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/navbar'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"
import { toast } from "sonner"

interface CreateRoomForm {
  title: string
  description: string
  maxParticipants: number
  timeLimit: number
  isPublic: boolean
  allowLateJoin: boolean
  showLeaderboard: boolean
  shuffleQuestions: boolean
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  scheduledStartTime: string
}

const CATEGORIES = [
  'Programming',
  'Web Development',
  'Database',
  'Algorithms',
  'System Design',
  'DevOps',
  'Mobile Development',
  'AI/ML',
  'Cybersecurity',
  'General Knowledge'
]

export default function CreateRoomPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CreateRoomForm>({
    title: '',
    description: '',
    maxParticipants: 50,
    timeLimit: 30,
    isPublic: true,
    allowLateJoin: true,
    showLeaderboard: true,
    shuffleQuestions: false,
    category: '',
    difficulty: 'medium',
    scheduledStartTime: ''
  })

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex justify-center items-center">
        <div className="text-[#b388ff] text-xl">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  const handleInputChange = (field: keyof CreateRoomForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Room title is required'
    if (formData.title.length < 3) return 'Room title must be at least 3 characters'
    if (formData.title.length > 100) return 'Room title must be less than 100 characters'
    if (formData.maxParticipants < 2) return 'Minimum 2 participants required'
    if (formData.maxParticipants > 1000) return 'Maximum 1000 participants allowed'
    if (formData.timeLimit < 5) return 'Minimum time limit is 5 minutes'
    if (formData.timeLimit > 180) return 'Maximum time limit is 180 minutes'
    if (!formData.category) return 'Please select a category'
    
    if (formData.scheduledStartTime) {
      const scheduledTime = new Date(formData.scheduledStartTime)
      const now = new Date()
      if (scheduledTime <= now) return 'Scheduled start time must be in the future'
    }
    
    return null
  }

  const handleCreateRoom = async () => {
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          scheduledStartTime: formData.scheduledStartTime || null
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create room')
      }

      toast.success('Room created successfully!')
      router.push(`/rooms/${data.room.id}/manage`)
    } catch (error) {
      console.error('Create room error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create room')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#b388ff] mb-2">Create New Quiz Room</h1>
          <p className="text-[#e0e0e0]">Set up your quiz room with custom settings and invite participants</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-[#b388ff]">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-[#e0e0e0]">Room Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter an engaging title for your quiz room"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-400 mt-1">{formData.title.length}/100 characters</p>
                </div>

                <div>
                  <Label htmlFor="description" className="text-[#e0e0e0]">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this quiz is about (optional)"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-400 mt-1">{formData.description.length}/500 characters</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category" className="text-[#e0e0e0]">Category *</Label>
                    <Select value={formData.category} onValueChange={(value: string) => handleInputChange('category', value)}>
                      <SelectTrigger className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#242b3d] border-purple-500/20">
                        {CATEGORIES.map(category => (
                          <SelectItem key={category} value={category} className="text-[#e0e0e0]">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="difficulty" className="text-[#e0e0e0]">Difficulty Level</Label>
                    <Select value={formData.difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => handleInputChange('difficulty', value)}>
                      <SelectTrigger className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#242b3d] border-purple-500/20">
                        <SelectItem value="easy" className="text-[#e0e0e0]">Easy</SelectItem>
                        <SelectItem value="medium" className="text-[#e0e0e0]">Medium</SelectItem>
                        <SelectItem value="hard" className="text-[#e0e0e0]">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Room Settings */}
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-[#b388ff]">Room Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxParticipants" className="text-[#e0e0e0]">Max Participants *</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      min="2"
                      max="1000"
                      value={formData.maxParticipants}
                      onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 2)}
                      className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="timeLimit" className="text-[#e0e0e0]">Time Limit (minutes) *</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      min="5"
                      max="180"
                      value={formData.timeLimit}
                      onChange={(e) => handleInputChange('timeLimit', parseInt(e.target.value) || 5)}
                      className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="scheduledStartTime" className="text-[#e0e0e0]">Scheduled Start Time (Optional)</Label>
                  <Input
                    id="scheduledStartTime"
                    type="datetime-local"
                    value={formData.scheduledStartTime}
                    onChange={(e) => handleInputChange('scheduledStartTime', e.target.value)}
                    className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave empty to start immediately</p>
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Behavior */}
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-[#b388ff]">Privacy & Behavior</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-[#e0e0e0]">Public Room</Label>
                      <p className="text-sm text-gray-400">Allow anyone to discover and join this room</p>
                    </div>
                    <Switch
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-[#e0e0e0]">Allow Late Join</Label>
                      <p className="text-sm text-gray-400">Participants can join after the quiz has started</p>
                    </div>
                    <Switch
                      checked={formData.allowLateJoin}
                      onCheckedChange={(checked) => handleInputChange('allowLateJoin', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-[#e0e0e0]">Show Leaderboard</Label>
                      <p className="text-sm text-gray-400">Display live rankings to participants</p>
                    </div>
                    <Switch
                      checked={formData.showLeaderboard}
                      onCheckedChange={(checked) => handleInputChange('showLeaderboard', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-[#e0e0e0]">Shuffle Questions</Label>
                      <p className="text-sm text-gray-400">Randomize question order for each participant</p>
                    </div>
                    <Switch
                      checked={formData.shuffleQuestions}
                      onCheckedChange={(checked) => handleInputChange('shuffleQuestions', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-[#242b3d] border-purple-500/20 sticky top-8">
              <CardHeader>
                <CardTitle className="text-xl text-[#b388ff]">Room Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-[#1a1f2e] rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-[#e0e0e0] truncate">
                    {formData.title || 'Untitled Room'}
                  </h3>
                  
                  {formData.description && (
                    <p className="text-sm text-gray-400 line-clamp-3">
                      {formData.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Category:</span>
                      <span className="text-[#e0e0e0]">{formData.category || 'Not selected'}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Difficulty:</span>
                      <span className={`capitalize ${
                        formData.difficulty === 'easy' ? 'text-green-400' :
                        formData.difficulty === 'medium' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {formData.difficulty}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Max Participants:</span>
                      <span className="text-[#e0e0e0]">{formData.maxParticipants}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time Limit:</span>
                      <span className="text-[#e0e0e0]">{formData.timeLimit} min</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Visibility:</span>
                      <span className="text-[#e0e0e0]">{formData.isPublic ? 'Public' : 'Private'}</span>
                    </div>
                  </div>

                  {formData.scheduledStartTime && (
                    <div className="border-t border-gray-600 pt-3 mt-3">
                      <div className="flex items-center gap-2 text-sm text-[#b388ff]">
                        <Calendar className="h-4 w-4" />
                        <span>Scheduled for:</span>
                      </div>
                      <p className="text-sm text-[#e0e0e0] mt-1">
                        {new Date(formData.scheduledStartTime).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-gray-600 pt-3 mt-3">
                    <h4 className="text-sm font-medium text-[#e0e0e0] mb-2">Features Enabled:</h4>
                    <div className="space-y-1 text-xs">
                      {formData.allowLateJoin && (
                        <div className="text-green-400">✓ Late join allowed</div>
                      )}
                      {formData.showLeaderboard && (
                        <div className="text-green-400">✓ Live leaderboard</div>
                      )}
                      {formData.shuffleQuestions && (
                        <div className="text-green-400">✓ Shuffled questions</div>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCreateRoom}
                  disabled={isLoading || !formData.title.trim() || !formData.category}
                  className="w-full bg-[#b388ff] hover:bg-[#9c5cff] text-white font-semibold py-3"
                >
                  {isLoading ? 'Creating Room...' : 'Create Room'}
                </Button>

                <p className="text-xs text-gray-400 text-center">
                  You&#39;ll be redirected to the room management page after creation
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}