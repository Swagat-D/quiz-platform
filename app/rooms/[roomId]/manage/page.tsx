/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/navbar'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import RoomQuestionsManagement from '@/components/RoomQuestionsManagement'
import { Textarea } from "@/components/ui/textarea"
import { 
  Copy, Share2, Play, Settings, Users, BarChart3, 
   Calendar, Clock, AlertTriangle, CheckCircle2,
  ClipboardCopy, Send, X, Eye,  BookOpen,
  Target, Trophy, TrendingUp, Bell, Globe, Shield, Timer,
  MoreVertical, Download, RefreshCw, Pause, Square
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Room {
  id: string
  code: string
  title: string
  description: string
  status: 'waiting' | 'active' | 'completed' | 'cancelled' | 'paused'
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
  scheduledEndTime?: string | null
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
  const [activeTab, setActiveTab] = useState('overview')
  const [alertMessage, setAlertMessage] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  // Real-time updates
  useEffect(() => {
    if (roomId) {
      fetchRoom()
      const interval = setInterval(fetchRoom, 10000) // Update every 10 seconds
      return () => clearInterval(interval)
    }
  }, [roomId])

  // Timer for active rooms
  useEffect(() => {
    if (room?.status === 'active' && room.scheduledEndTime) {
      const timer = setInterval(() => {
        const now = new Date().getTime()
        const end = new Date(room.scheduledEndTime!).getTime()
        const remaining = Math.max(0, end - now)
        setTimeRemaining(remaining)
        
        if (remaining === 0) {
          clearInterval(timer)
          fetchRoom() // Refresh room status
        }
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [room?.scheduledEndTime])

  const fetchRoom = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch room')
      }

      if (data.room.creatorId !== session?.user?.id) {
        alert('You are not authorized to manage this room')
        router.push('/dashboard')
        return
      }

      setRoom(data.room)
    } catch (error) {
      console.error('Fetch room error:', error)
      alert('Failed to load room')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const controlRoom = async (action: 'start' | 'pause' | 'resume' | 'end') => {
    try {
      const endpoint = action === 'start' ? `/api/rooms/${roomId}/start` : `/api/rooms/${roomId}/start`
      const method = action === 'start' ? 'POST' : 'PUT'
      const body = action !== 'start' ? JSON.stringify({ action }) : undefined

      const response = await fetch(endpoint, {
        method,
        headers: action !== 'start' ? { 'Content-Type': 'application/json' } : undefined,
        body,
      })

      if (response.ok) {
        if (action === 'start') {
          router.push(`/rooms/${roomId}/live`)
        } else if (action === 'end') {
          router.push(`/rooms/${roomId}/results`)
        } else {
          fetchRoom()
        }
      } else {
        const error = await response.json()
        alert(error.error || `Failed to ${action} room`)
      }
    } catch (error) {
      console.error(`${action} room error:`, error)
      alert(`Failed to ${action} room`)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      waiting: { 
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: Clock,
        label: 'Waiting to Start'
      },
      active: { 
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: Play,
        label: 'Active'
      },
      paused: { 
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        icon: Pause,
        label: 'Paused'
      },
      completed: { 
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        icon: Trophy,
        label: 'Completed'
      },
      cancelled: { 
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        icon: X,
        label: 'Cancelled'
      }
    }
    return configs[status as keyof typeof configs] || configs.waiting
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b388ff] mx-auto mb-4"></div>
          <div className="text-[#e0e0e0] text-lg">Loading room...</div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex justify-center items-center">
        <Card className="bg-[#242b3d] border-red-500/20 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#e0e0e0] mb-2">Room Not Found</h3>
            <p className="text-gray-400 mb-4">This room doesn&apos;t exist or you don&apos;t have permission to access it.</p>
            <Button onClick={() => router.push('/dashboard')} className="bg-[#b388ff] hover:bg-[#9c5cff]">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusConfig = getStatusConfig(room.status)
  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}/rooms/join?code=${room.code}` : ''

  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#242b3d] to-[#2a3042] border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#b388ff]/10 rounded-xl">
                <statusConfig.icon className="h-8 w-8 text-[#b388ff]" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">{room.title}</h1>
                  <Badge className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-gray-300 text-lg">{room.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span>Room {room.code}</span>
                  <span>•</span>
                  <span>{room.category}</span>
                  <span>•</span>
                  <span>Created {new Date(room.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Status-specific actions */}
              {room.status === 'waiting' && (
                <Button 
                  onClick={() => controlRoom('start')} 
                  className="bg-green-600 hover:bg-green-700 text-white px-6"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Room
                </Button>
              )}
              
              {room.status === 'active' && (
                <>
                  <Button 
                    onClick={() => router.push(`/rooms/${roomId}/live`)} 
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Live
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-purple-500/30 text-[#e0e0e0]">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#242b3d] border-purple-500/20">
                      <DropdownMenuItem onClick={() => controlRoom('pause')} className="text-yellow-400">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause Room
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => controlRoom('end')} className="text-red-400">
                        <Square className="h-4 w-4 mr-2" />
                        End Room
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

              {room.status === 'paused' && (
                <>
                  <Button 
                    onClick={() => controlRoom('resume')} 
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Resume Room
                  </Button>
                  <Button 
                    onClick={() => controlRoom('end')} 
                    variant="outline" 
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    End Room
                  </Button>
                </>
              )}

              {room.status === 'completed' && (
                <Button 
                  onClick={() => router.push(`/rooms/${roomId}/results`)} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Results
                </Button>
              )}

              {/* Share button */}
              <Button 
                onClick={() => copyToClipboard(shareLink)} 
                variant="outline" 
                className="border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-[#1a1f2e]/50 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-[#b388ff]" />
                <div>
                  <p className="text-sm text-gray-400">Participants</p>
                  <p className="text-xl font-bold text-white">{room.currentParticipants}/{room.maxParticipants}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1a1f2e]/50 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-[#b388ff]" />
                <div>
                  <p className="text-sm text-gray-400">Questions</p>
                  <p className="text-xl font-bold text-white">{room.statistics.totalQuestions}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1a1f2e]/50 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-[#b388ff]" />
                <div>
                  <p className="text-sm text-gray-400">Duration</p>
                  <p className="text-xl font-bold text-white">{room.timeLimit}m</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1a1f2e]/50 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                {timeRemaining !== null ? (
                  <Clock className="h-5 w-5 text-amber-400" />
                ) : (
                  <Trophy className="h-5 w-5 text-[#b388ff]" />
                )}
                <div>
                  <p className="text-sm text-gray-400">
                    {timeRemaining !== null ? 'Time Left' : 'Score'}
                  </p>
                  <p className="text-xl font-bold text-white">
                    {timeRemaining !== null ? formatTime(timeRemaining) : `${room.statistics.averageScore}%`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-2xl grid-cols-5 bg-[#242b3d] h-12">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#b388ff] data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="participants" className="data-[state=active]:bg-[#b388ff] data-[state=active]:text-white">
              Participants
            </TabsTrigger>
            <TabsTrigger value="questions" className="data-[state=active]:bg-[#b388ff] data-[state=active]:text-white">
              Questions
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#b388ff] data-[state=active]:text-white">
              Settings
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#b388ff] data-[state=active]:text-white">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Room Details */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-[#242b3d] border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-xl text-[#b388ff] flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Room Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-400 text-sm">Room Code</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="bg-[#1a1f2e] px-4 py-2 rounded-lg text-[#b388ff] font-mono text-lg font-bold flex-1">
                              {room.code}
                            </code>
                            <Button
                              onClick={() => copyToClipboard(room.code)}
                              size="sm"
                              variant="outline"
                              className="border-purple-500/30"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-gray-400 text-sm">Category</Label>
                          <p className="text-[#e0e0e0] font-medium mt-1">{room.category}</p>
                        </div>
                        
                        <div>
                          <Label className="text-gray-400 text-sm">Difficulty</Label>
                          <Badge className={`mt-1 ${
                            room.difficulty === 'easy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            room.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}>
                            {room.difficulty}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-400 text-sm">Visibility</Label>
                          <div className="flex items-center gap-2 mt-1">
                            {room.isPublic ? (
                              <>
                                <Globe className="h-4 w-4 text-green-400" />
                                <span className="text-green-400">Public</span>
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-400">Private</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-gray-400 text-sm">Created</Label>
                          <p className="text-[#e0e0e0] mt-1">{new Date(room.createdAt).toLocaleString()}</p>
                        </div>
                        
                        {room.scheduledStartTime && (
                          <div>
                            <Label className="text-gray-400 text-sm">Scheduled Start</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-4 w-4 text-blue-400" />
                              <span className="text-[#e0e0e0]">{new Date(room.scheduledStartTime).toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Room Features */}
                    <div className="border-t border-gray-600 pt-6">
                      <h4 className="text-sm font-medium text-[#e0e0e0] mb-4">Room Features</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`h-4 w-4 ${room.allowLateJoin ? 'text-green-400' : 'text-gray-400'}`} />
                          <span className={room.allowLateJoin ? 'text-green-400' : 'text-gray-400'}>
                            Late Join {room.allowLateJoin ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`h-4 w-4 ${room.showLeaderboard ? 'text-green-400' : 'text-gray-400'}`} />
                          <span className={room.showLeaderboard ? 'text-green-400' : 'text-gray-400'}>
                            Leaderboard {room.showLeaderboard ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`h-4 w-4 ${room.settings.instantFeedback ? 'text-green-400' : 'text-gray-400'}`} />
                          <span className={room.settings.instantFeedback ? 'text-green-400' : 'text-gray-400'}>
                            Instant Feedback {room.settings.instantFeedback ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`h-4 w-4 ${room.shuffleQuestions ? 'text-green-400' : 'text-gray-400'}`} />
                          <span className={room.shuffleQuestions ? 'text-green-400' : 'text-gray-400'}>
                            Shuffle Questions {room.shuffleQuestions ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Live Activity Feed */}
                <Card className="bg-[#242b3d] border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-xl text-[#b388ff] flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Live Activity
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 ml-auto">
                        Live
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {/* Mock activity items */}
                      <div className="flex items-center gap-3 p-3 bg-[#1a1f2e] rounded-lg">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-[#e0e0e0] text-sm">John Doe joined the room</span>
                        <span className="text-gray-400 text-xs ml-auto">2 min ago</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-[#1a1f2e] rounded-lg">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-[#e0e0e0] text-sm">Room settings updated</span>
                        <span className="text-gray-400 text-xs ml-auto">5 min ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card className="bg-[#242b3d] border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#b388ff]">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => copyToClipboard(shareLink)} 
                      variant="outline" 
                      className="w-full border-purple-500/30 text-[#e0e0e0] justify-start"
                    >
                      <ClipboardCopy className="h-4 w-4 mr-2" />
                      Copy Share Link
                    </Button>
                    
                    <Button 
                      onClick={() => setActiveTab('participants')} 
                      variant="outline" 
                      className="w-full border-purple-500/30 text-[#e0e0e0] justify-start"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage Participants
                    </Button>
                    
                    <Button 
                      onClick={() => setActiveTab('questions')} 
                      variant="outline" 
                      className="w-full border-purple-500/30 text-[#e0e0e0] justify-start"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Manage Questions
                    </Button>
                    
                    {room.status === 'completed' && (
                      <Button 
                        onClick={() => router.push(`/rooms/${roomId}/results`)} 
                        variant="outline" 
                        className="w-full border-purple-500/30 text-[#e0e0e0] justify-start"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Results
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Participant Status */}
                <Card className="bg-[#242b3d] border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#b388ff] flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Participants ({room.currentParticipants})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {room.participants.length === 0 ? (
                      <div className="text-center py-6 text-gray-400">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No participants yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {room.participants.slice(0, 5).map((participant, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#b388ff] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {participant.userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[#e0e0e0] text-sm font-medium truncate">{participant.userName}</p>
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${participant.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                                <span className="text-xs text-gray-400">
                                  {participant.isActive ? 'Online' : 'Offline'}
                                </span>
                              </div>
                            </div>
                            {room.status === 'completed' && (
                              <div className="text-right">
                                <p className="text-[#e0e0e0] text-sm font-semibold">{participant.score}%</p>
                              </div>
                            )}
                          </div>
                        ))}
                        {room.participants.length > 5 && (
                          <div className="text-center pt-2">
                            <Button 
                              onClick={() => setActiveTab('participants')} 
                              variant="ghost" 
                              size="sm" 
                              className="text-[#b388ff] hover:bg-purple-500/10"
                            >
                              View all {room.participants.length} participants
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Send Alert */}
                <Card className="bg-[#242b3d] border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#b388ff]">Send Alert</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder="Type your message to participants..."
                      value={alertMessage}
                      onChange={(e) => setAlertMessage(e.target.value)}
                      className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] resize-none"
                      rows={3}
                    />
                    <Button 
                      onClick={() => {
                        if (alertMessage.trim()) {
                          alert('Alert sent to all participants!')
                          setAlertMessage('')
                        }
                      }}
                      disabled={!alertMessage.trim()}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Alert
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants" className="space-y-6">
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-[#b388ff] flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participants ({room.currentParticipants}/{room.maxParticipants})
                  </CardTitle>
                  <Button 
                    onClick={fetchRoom} 
                    variant="outline" 
                    size="sm" 
                    className="border-purple-500/30 text-[#e0e0e0]"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {room.participants.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No participants yet</h3>
                    <p>Share the room code to get people to join</p>
                    <div className="mt-4">
                      <Button 
                        onClick={() => copyToClipboard(shareLink)} 
                        className="bg-[#b388ff] hover:bg-[#9c5cff]"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Room
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Participant list */}
                    <div className="grid gap-4">
                      {room.participants.map((participant, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-[#1a1f2e] rounded-lg border border-gray-700 hover:border-purple-500/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-[#b388ff] to-[#9c5cff] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {participant.userName.charAt(0).toUpperCase()}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#1a1f2e] ${participant.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#e0e0e0] text-lg">{participant.userName}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>{participant.isAuthenticated ? 'Authenticated User' : 'Guest User'}</span>
                                <span>•</span>
                                <span>Joined {new Date(participant.joinedAt).toLocaleString()}</span>
                              </div>
                              {participant.email && (
                                <p className="text-sm text-gray-400 mt-1">{participant.email}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            {room.status === 'completed' ? (
                              <div>
                                <p className="text-2xl font-bold text-[#e0e0e0]">{participant.score}%</p>
                                <p className="text-sm text-gray-400">{participant.answeredQuestions} questions</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Last active: {new Date(participant.lastActivity).toLocaleString()}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${participant.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                  <div className={`w-2 h-2 rounded-full ${participant.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                                  {participant.isActive ? 'Online' : 'Offline'}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                  Last seen: {new Date(participant.lastActivity).toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-6">
            <RoomQuestionsManagement 
              roomId={roomId}
              roomStatus={room.status}
              onQuestionsUpdate={fetchRoom}
            />
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
                  <CardTitle className="text-xl text-[#b388ff]">Room Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-8 text-gray-400">
                    <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Settings management panel will be implemented here</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-[#b388ff]">Room Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {room.status === 'completed' ? (
                  <div className="space-y-8">
                    {/* Performance Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-[#1a1f2e] rounded-lg">
                        <TrendingUp className="h-8 w-8 text-[#b388ff] mx-auto mb-3" />
                        <p className="text-3xl font-bold text-[#e0e0e0]">{room.statistics.averageScore}%</p>
                        <p className="text-gray-400">Average Score</p>
                      </div>
                      <div className="text-center p-6 bg-[#1a1f2e] rounded-lg">
                        <Target className="h-8 w-8 text-green-400 mx-auto mb-3" />
                        <p className="text-3xl font-bold text-[#e0e0e0]">{room.statistics.completionRate}%</p>
                        <p className="text-gray-400">Completion Rate</p>
                      </div>
                      <div className="text-center p-6 bg-[#1a1f2e] rounded-lg">
                        <Users className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                        <p className="text-3xl font-bold text-[#e0e0e0]">{room.currentParticipants}</p>
                        <p className="text-gray-400">Total Participants</p>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <Button
                        onClick={() => router.push(`/rooms/${roomId}/results`)}
                        className="bg-[#b388ff] hover:bg-[#9c5cff] px-8"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Detailed Results
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Analytics Available After Completion</h3>
                    <p>Detailed analytics and insights will be shown here once the quiz is completed</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#242b3d] rounded-xl p-6 max-w-md w-full border border-red-500/20">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <h3 className="text-xl font-semibold text-red-400">Delete Room</h3>
              </div>
              <p className="text-[#e0e0e0] mb-6">
                Are you sure you want to delete this room? This action cannot be undone and will remove all associated data including participants and results.
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
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    // Handle delete room
                    alert('Room deletion functionality will be implemented')
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Room
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}