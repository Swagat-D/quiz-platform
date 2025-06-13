// app/rooms/[roomId]/manage/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/navbar'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Copy, Share2, Play, Settings, Users, MessageSquare, BarChart3, 
  Edit, Trash2, Calendar, Clock, AlertTriangle, CheckCircle2,
  ClipboardCopy, Send, Plus, X, Eye, Download
} from 'lucide-react'
import { toast } from '@/lib/toast'

interface Room {
  id: string
  code: string
  title: string
  description: string
  status: 'waiting' | 'active' | 'completed' | 'cancelled'
  currentParticipants: number
  maxParticipants: number
  creatorId: string
  creatorName: string
  participants: Participant[]
  settings: RoomSettings
  statistics: RoomStatistics
  isPublic: boolean
  allowLateJoin: boolean
  showLeaderboard: boolean
  shuffleQuestions: boolean
  category: string
  difficulty: string
  timeLimit: number
  scheduledStartTime: string | null
  createdAt: string
  updatedAt: string
  startedAt: string | null
  completedAt: string | null
}

interface Participant {
  userId: string | null
  userName: string
  email: string | null
  isAuthenticated: boolean
  joinedAt: string
  isActive: boolean
  score: number
  answeredQuestions: number
  lastActivity: string
}

interface RoomSettings {
  allowChat: boolean
  allowQuestionSkip: boolean
  showCorrectAnswers: boolean
  instantFeedback: boolean
}

interface RoomStatistics {
  totalQuestions: number
  averageScore: number
  completionRate: number
}

export default function RoomManagePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const roomId = params?.roomId as string

  const [room, setRoom] = useState<Room | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [alertMessage, setAlertMessage] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Form state for room updates
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maxParticipants: 50,
    timeLimit: 30,
    isPublic: true,
    allowLateJoin: true,
    showLeaderboard: true,
    shuffleQuestions: false,
    scheduledStartTime: '',
    settings: {
      allowChat: true,
      allowQuestionSkip: false,
      showCorrectAnswers: true,
      instantFeedback: true,
    }
  })

  useEffect(() => {
    if (roomId) {
      fetchRoom()
    }
  }, [roomId])

  useEffect(() => {
    if (room) {
      setFormData({
        title: room.title,
        description: room.description,
        maxParticipants: room.maxParticipants,
        timeLimit: room.timeLimit,
        isPublic: room.isPublic,
        allowLateJoin: room.allowLateJoin,
        showLeaderboard: room.showLeaderboard,
        shuffleQuestions: room.shuffleQuestions,
        scheduledStartTime: room.scheduledStartTime || '',
        settings: room.settings,
      })
    }
  }, [room])

  const fetchRoom = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch room')
      }

      if (data.room.creatorId !== session?.user?.id) {
        toast.error('You are not authorized to manage this room')
        router.push('/dashboard')
        return
      }

      setRoom(data.room)
    } catch (error) {
      console.error('Fetch room error:', error)
      toast.error('Failed to load room')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const updateRoom = async () => {
    if (!room) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update room')
      }

      toast.success('Room updated successfully!')
      await fetchRoom() // Refresh room data
    } catch (error) {
      console.error('Update room error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update room')
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteRoom = async () => {
    if (!room) return

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete room')
      }

      toast.success('Room deleted successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Delete room error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete room')
    }
  }

  const startRoom = async () => {
    if (!room) return

    try {
      const response = await fetch(`/api/rooms/${roomId}/start`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start room')
      }

      toast.success('Room started successfully!')
      router.push(`/rooms/${roomId}/live`)
    } catch (error) {
      console.error('Start room error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start room')
    }
  }

  const sendAlert = async () => {
    if (!alertMessage.trim()) {
      toast.error('Please enter an alert message')
      return
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}/alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: alertMessage }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send alert')
      }

      toast.success('Alert sent to all participants!')
      setAlertMessage('')
    } catch (error) {
      console.error('Send alert error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send alert')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('Failed to copy to clipboard')
    }
  }

  const shareLink = `${window.location.origin}/rooms/join?code=${room?.code}`

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex justify-center items-center">
        <div className="text-[#b388ff] text-xl">Loading room...</div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex justify-center items-center">
        <div className="text-red-400 text-xl">Room not found</div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'completed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-[#b388ff]">{room.title}</h1>
                <Badge className={getStatusColor(room.status)}>
                  {room.status}
                </Badge>
              </div>
              <p className="text-[#e0e0e0]">Manage your quiz room settings and monitor participants</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {room.status === 'waiting' && (
                <Button onClick={startRoom} className="bg-green-600 hover:bg-green-700 text-white">
                  <Play className="h-4 w-4 mr-2" />
                  Start Room
                </Button>
              )}
              
              {room.status === 'active' && (
                <Button onClick={() => router.push(`/rooms/${roomId}/live`)} className="bg-green-600 hover:bg-green-700 text-white">
                  <Eye className="h-4 w-4 mr-2" />
                  View Live
                </Button>
              )}

              <Button onClick={() => copyToClipboard(shareLink)} variant="outline" className="border-purple-500/30 text-[#e0e0e0]">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Room Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Room Code</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <p className="text-xl font-bold text-[#b388ff] font-mono">{room.code}</p>
                    <Button
                      onClick={() => copyToClipboard(room.code)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Participants</p>
                  <p className="text-xl font-bold text-[#e0e0e0]">{room.currentParticipants}/{room.maxParticipants}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Time Limit</p>
                  <p className="text-xl font-bold text-[#e0e0e0]">{room.timeLimit}m</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Questions</p>
                  <p className="text-xl font-bold text-[#e0e0e0]">{room.statistics.totalQuestions}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-[#242b3d]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#b388ff]">Overview</TabsTrigger>
            <TabsTrigger value="participants" className="data-[state=active]:bg-[#b388ff]">Participants</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#b388ff]">Settings</TabsTrigger>
            <TabsTrigger value="questions" className="data-[state=active]:bg-[#b388ff]">Questions</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#b388ff]">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Room Details */}
              <Card className="bg-[#242b3d] border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-xl text-[#b388ff]">Room Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-gray-400">Title</Label>
                      <p className="text-[#e0e0e0] font-medium">{room.title}</p>
                    </div>
                    
                    {room.description && (
                      <div>
                        <Label className="text-gray-400">Description</Label>
                        <p className="text-[#e0e0e0]">{room.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-400">Category</Label>
                        <p className="text-[#e0e0e0]">{room.category}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Difficulty</Label>
                        <p className="text-[#e0e0e0] capitalize">{room.difficulty}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-400">Visibility</Label>
                        <p className="text-[#e0e0e0]">{room.isPublic ? 'Public' : 'Private'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Late Join</Label>
                        <p className="text-[#e0e0e0]">{room.allowLateJoin ? 'Allowed' : 'Not Allowed'}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-400">Created</Label>
                      <p className="text-[#e0e0e0]">{new Date(room.createdAt).toLocaleString()}</p>
                    </div>

                    {room.scheduledStartTime && (
                      <div>
                        <Label className="text-gray-400">Scheduled Start</Label>
                        <p className="text-[#e0e0e0]">{new Date(room.scheduledStartTime).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-[#242b3d] border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-xl text-[#b388ff]">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Share Room */}
                  <div className="space-y-2">
                    <Label className="text-[#e0e0e0]">Share Room</Label>
                    <div className="flex gap-2">
                      <Input
                        value={shareLink}
                        readOnly
                        className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] text-sm"
                      />
                      <Button
                        onClick={() => copyToClipboard(shareLink)}
                        size="sm"
                        className="bg-[#b388ff] hover:bg-[#9c5cff]"
                      >
                        <ClipboardCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Send Alert */}
                  <div className="space-y-2">
                    <Label className="text-[#e0e0e0]">Send Alert to Participants</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter alert message..."
                        value={alertMessage}
                        onChange={(e) => setAlertMessage(e.target.value)}
                        className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                      />
                      <Button
                        onClick={sendAlert}
                        size="sm"
                        disabled={!alertMessage.trim()}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Room Actions */}
                  <div className="space-y-2 pt-4 border-t border-gray-600">
                    {room.status === 'waiting' && (
                      <>
                        <Button
                          onClick={() => setActiveTab('questions')}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Manage Questions
                        </Button>
                        <Button
                          onClick={startRoom}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Room Now
                        </Button>
                      </>
                    )}

                    {room.status === 'active' && (
                      <Button
                        onClick={() => router.push(`/rooms/${roomId}/live`)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Live Room
                      </Button>
                    )}

                    {room.status === 'completed' && (
                      <Button
                        onClick={() => router.push(`/rooms/${roomId}/results`)}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Results
                      </Button>
                    )}

                    {(room.status === 'waiting' || room.status === 'completed') && (
                      <Button
                        onClick={() => setShowDeleteConfirm(true)}
                        variant="outline"
                        className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Room
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Room Statistics */}
            {room.status === 'completed' && (
              <Card className="bg-[#242b3d] border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-xl text-[#b388ff]">Room Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#e0e0e0]">{room.statistics.averageScore}%</p>
                      <p className="text-gray-400">Average Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#e0e0e0]">{room.statistics.completionRate}%</p>
                      <p className="text-gray-400">Completion Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#e0e0e0]">{room.statistics.totalQuestions}</p>
                      <p className="text-gray-400">Total Questions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-6">
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-[#b388ff] flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants ({room.currentParticipants}/{room.maxParticipants})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {room.participants.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No participants yet</h3>
                    <p>Share the room code to get people to join</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {room.participants.map((participant, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-[#1a1f2e] rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#b388ff] rounded-full flex items-center justify-center text-white font-semibold">
                            {participant.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[#e0e0e0]">{participant.userName}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              {participant.isAuthenticated ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                  Authenticated
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                                  Guest
                                </Badge>
                              )}
                              <span>•</span>
                              <span>Joined {new Date(participant.joinedAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {room.status === 'completed' && (
                            <div>
                              <p className="text-lg font-semibold text-[#e0e0e0]">{participant.score}%</p>
                              <p className="text-sm text-gray-400">{participant.answeredQuestions} questions</p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1 text-xs">
                            {participant.isActive ? (
                              <div className="flex items-center gap-1 text-green-400">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span>Online</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-gray-400">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span>Offline</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {room.participants.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-600">
                    <Button className="w-full bg-[#b388ff] hover:bg-[#9c5cff]">
                      <Download className="h-4 w-4 mr-2" />
                      Export Participant List
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {room.status === 'active' || room.status === 'completed' ? (
              <Card className="bg-[#242b3d] border-amber-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 text-amber-400">
                    <AlertTriangle className="h-6 w-6" />
                    <div>
                      <h3 className="font-semibold">Settings Locked</h3>
                      <p className="text-sm">Room settings cannot be modified after the quiz has started or completed.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-[#242b3d] border-purple-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-[#b388ff]">Room Settings</CardTitle>
                    <Button
                      onClick={updateRoom}
                      disabled={isUpdating}
                      className="bg-[#b388ff] hover:bg-[#9c5cff]"
                    >
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#e0e0e0]">Basic Information</h3>
                    
                    <div>
                      <Label htmlFor="title" className="text-[#e0e0e0]">Room Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-[#e0e0e0]">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="maxParticipants" className="text-[#e0e0e0]">Max Participants</Label>
                        <Input
                          id="maxParticipants"
                          type="number"
                          min="2"
                          max="1000"
                          value={formData.maxParticipants}
                          onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 2 }))}
                          className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="timeLimit" className="text-[#e0e0e0]">Time Limit (minutes)</Label>
                        <Input
                          id="timeLimit"
                          type="number"
                          min="5"
                          max="180"
                          value={formData.timeLimit}
                          onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 5 }))}
                          className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#e0e0e0]">Privacy & Access</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-[#e0e0e0]">Public Room</Label>
                          <p className="text-sm text-gray-400">Allow anyone to discover and join this room</p>
                        </div>
                        <Switch
                          checked={formData.isPublic}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-[#e0e0e0]">Allow Late Join</Label>
                          <p className="text-sm text-gray-400">Participants can join after the quiz has started</p>
                        </div>
                        <Switch
                          checked={formData.allowLateJoin}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowLateJoin: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-[#e0e0e0]">Show Leaderboard</Label>
                          <p className="text-sm text-gray-400">Display live rankings to participants</p>
                        </div>
                        <Switch
                          checked={formData.showLeaderboard}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showLeaderboard: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-[#e0e0e0]">Shuffle Questions</Label>
                          <p className="text-sm text-gray-400">Randomize question order for each participant</p>
                        </div>
                        <Switch
                          checked={formData.shuffleQuestions}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, shuffleQuestions: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quiz Behavior */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#e0e0e0]">Quiz Behavior</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-[#e0e0e0]">Allow Chat</Label>
                          <p className="text-sm text-gray-400">Enable participant chat during quiz</p>
                        </div>
                        <Switch
                          checked={formData.settings.allowChat}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, allowChat: checked }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-[#e0e0e0]">Show Correct Answers</Label>
                          <p className="text-sm text-gray-400">Display correct answers after each question</p>
                        </div>
                        <Switch
                          checked={formData.settings.showCorrectAnswers}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, showCorrectAnswers: checked }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-[#e0e0e0]">Instant Feedback</Label>
                          <p className="text-sm text-gray-400">Show if answer is correct immediately</p>
                        </div>
                        <Switch
                          checked={formData.settings.instantFeedback}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, instantFeedback: checked }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-[#e0e0e0]">Allow Question Skip</Label>
                          <p className="text-sm text-gray-400">Participants can skip difficult questions</p>
                        </div>
                        <Switch
                          checked={formData.settings.allowQuestionSkip}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, allowQuestionSkip: checked }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-6">
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-[#b388ff]">Quiz Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <Plus className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No questions added yet</h3>
                  <p className="mb-6">Add questions to make your quiz interactive</p>
                  <Button className="bg-[#b388ff] hover:bg-[#9c5cff]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Questions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-[#b388ff]">Room Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-400">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Analytics available after quiz completion</h3>
                  <p>Detailed analytics will be shown here once the quiz is completed</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-[#242b3d] border-red-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Room
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[#e0e0e0]">
                  Are you sure you want to delete this room? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    className="flex-1 border-gray-500/30 text-[#e0e0e0]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={deleteRoom}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete Room
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}