/* eslint-disable react-hooks/exhaustive-deps */
// app/rooms/join/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/navbar'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, Users, Clock, Calendar, Filter, Loader2, AlertCircle, 
  CheckCircle2, Globe, Shield, Zap, Star, Trophy, Play, Eye,
  Hash, UserCheck, Timer, BookOpen, Target, Sparkles, ArrowRight
} from 'lucide-react'

interface Room {
  id: string
  code: string
  title: string
  description: string
  status: 'waiting' | 'active' | 'completed'
  currentParticipants: number
  maxParticipants: number
  creatorName: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit: number
  isPublic: boolean
  allowLateJoin: boolean
  scheduledStartTime: string | null
  createdAt: string
  statistics?: {
    totalQuestions: number
    averageScore: number
    completionRate: number
  }
}

interface RoomPreview {
  code: string
  title: string
  description: string
  status: string
  currentParticipants: number
  maxParticipants: number
  creatorName: string
  allowLateJoin: boolean
  isPublic: boolean
  category: string
  difficulty: string
  timeLimit: number
  scheduledStartTime: string | null
}

const CATEGORIES = [
  'Programming', 'Web Development', 'Database', 'Algorithms', 
  'System Design', 'DevOps', 'Mobile Development', 'AI/ML', 
  'Cybersecurity', 'General Knowledge'
]

export default function JoinRoomPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  const [roomCode, setRoomCode] = useState(searchParams?.get('code') || '')
  const [userName, setUserName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [roomPreview, setRoomPreview] = useState<RoomPreview | null>(null)
  const [publicRooms, setPublicRooms] = useState<Room[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('waiting')
  const [activeTab, setActiveTab] = useState('code')

  // Load public rooms
  useEffect(() => {
    fetchPublicRooms()
  }, [searchQuery, categoryFilter, difficultyFilter, statusFilter])

  // Check room code from URL params
  useEffect(() => {
    const codeFromUrl = searchParams?.get('code')
    if (codeFromUrl) {
      setRoomCode(codeFromUrl)
      setActiveTab('code')
      checkRoom(codeFromUrl)
    }
  }, [searchParams])

  const fetchPublicRooms = async () => {
    try {
      const params = new URLSearchParams({
        type: 'public',
        page: '1',
        limit: '20',
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(difficultyFilter && { difficulty: difficultyFilter }),
        ...(statusFilter && { status: statusFilter }),
      })

      const response = await fetch(`/api/rooms?${params}`)
      const data = await response.json()

      if (data.success) {
        setPublicRooms(data.rooms)
      }
    } catch (error) {
      console.error('Failed to fetch public rooms:', error)
    }
  }

  const checkRoom = async (code: string) => {
    if (!code || code.length !== 6) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/rooms/join?code=${code.toUpperCase()}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setRoomPreview(data.room)
      } else {
        setRoomPreview(null)
      }
    } catch (error) {
      console.error('Room check error:', error)
      setRoomPreview(null)
    } finally {
      setIsLoading(false)
    }
  }

  const joinRoom = async (targetRoomCode?: string) => {
    const codeToJoin = targetRoomCode || roomCode
    
    if (!codeToJoin) {
      alert('Please enter a room code')
      return
    }

    if (!session && !userName.trim()) {
      alert('Please enter your name to join as a guest')
      return
    }

    setIsJoining(true)
    try {
      // Store guest participant ID if not authenticated
      if (!session && userName.trim()) {
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('guestParticipantId', guestId)
        localStorage.setItem('guestUserName', userName.trim())
      }

      const response = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode: codeToJoin.toUpperCase(),
          userName: userName.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join room')
      }

      // Navigate to quiz page based on room status
      if (data.room.status === 'waiting') {
        router.push(`/rooms/${data.room.id}/waiting`)
      } else if (data.room.status === 'active') {
        router.push(`/rooms/${data.room.id}/quiz`)
      } else {
        router.push(`/rooms/${data.room.id}/results`)
      }
    } catch (error) {
      console.error('Join room error:', error)
      alert(error instanceof Error ? error.message : 'Failed to join room')
    } finally {
      setIsJoining(false)
    }
  }

  const getDifficultyConfig = (difficulty: string) => {
    const configs = {
      easy: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
      medium: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Target },
      hard: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: Zap }
    }
    return configs[difficulty as keyof typeof configs] || configs.easy
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      waiting: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock, label: 'Starting Soon' },
      active: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Play, label: 'Live Now' },
      completed: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Trophy, label: 'Completed' }
    }
    return configs[status as keyof typeof configs] || configs.waiting
  }

  const formatTimeLeft = (scheduledTime: string | null) => {
    if (!scheduledTime) return null
    
    const now = new Date()
    const scheduled = new Date(scheduledTime)
    const diff = scheduled.getTime() - now.getTime()
    
    if (diff <= 0) return 'Starting now'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) return `Starts in ${hours}h ${minutes}m`
    return `Starts in ${minutes}m`
  }

  const canJoinRoom = (room: Room | RoomPreview) => {
    if (room.currentParticipants >= room.maxParticipants) return false
    if (room.status === 'completed') return false
    if (room.status === 'active' && !room.allowLateJoin) return false
    return true
  }

  const getJoinButtonText = (room: Room | RoomPreview) => {
    if (room.currentParticipants >= room.maxParticipants) return 'Room Full'
    if (room.status === 'completed') return 'Quiz Ended'
    if (room.status === 'active' && !room.allowLateJoin) return 'Cannot Join (In Progress)'
    if (room.status === 'active') return 'Join Live Quiz'
    return 'Join Room'
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#242b3d] to-[#2a3042] border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-[#b388ff]/10 px-4 py-2 rounded-full border border-[#b388ff]/20 mb-6">
              <Sparkles className="h-4 w-4 text-[#b388ff]" />
              <span className="text-[#b388ff] text-sm font-medium">Join thousands of learners</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Join a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b388ff] to-purple-400">Quiz Room</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Enter a room code to join an existing quiz or browse available public rooms to test your knowledge
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span>Secure & Fair</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-blue-400" />
                <span>Real-time Results</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span>Leaderboards</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-[#242b3d] h-12">
            <TabsTrigger 
              value="code" 
              className="data-[state=active]:bg-[#b388ff] data-[state=active]:text-white transition-all duration-300"
            >
              <Hash className="h-4 w-4 mr-2" />
              Join by Code
            </TabsTrigger>
            <TabsTrigger 
              value="browse" 
              className="data-[state=active]:bg-[#b388ff] data-[state=active]:text-white transition-all duration-300"
            >
              <Globe className="h-4 w-4 mr-2" />
              Browse Rooms
            </TabsTrigger>
          </TabsList>

          {/* Join by Code Tab */}
          <TabsContent value="code" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Join Form */}
              <Card className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#b388ff] flex items-center gap-2">
                    <Hash className="h-6 w-6" />
                    Enter Room Code
                  </CardTitle>
                  <p className="text-gray-400">Enter the 6-character code shared by your quiz host</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="roomCode" className="text-[#e0e0e0] text-sm font-medium">Room Code</Label>
                    <Input
                      id="roomCode"
                      placeholder="ABC123"
                      value={roomCode}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
                        setRoomCode(value)
                        if (value.length === 6) {
                          checkRoom(value)
                        } else {
                          setRoomPreview(null)
                        }
                      }}
                      className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] font-mono text-2xl tracking-widest text-center h-14 mt-2 transition-all duration-300 focus:border-[#b388ff] focus:ring-2 focus:ring-[#b388ff]/20"
                      maxLength={6}
                    />
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Code will be automatically validated as you type
                    </p>
                  </div>

                  {!session && (
                    <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <UserCheck className="h-5 w-5 text-blue-400" />
                        <Label htmlFor="userName" className="text-blue-400 font-medium">Join as Guest</Label>
                      </div>
                      <Input
                        id="userName"
                        placeholder="Enter your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="bg-[#1a1f2e] border-blue-500/20 text-[#e0e0e0] transition-all duration-300 focus:border-blue-400"
                      />
                      <p className="text-xs text-blue-300 mt-2">
                        💡 <strong>Sign in</strong> to save your progress and access advanced features
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={() => joinRoom()}
                    disabled={!!(isJoining || !roomCode || (!session && !userName.trim()) || (roomPreview && !canJoinRoom(roomPreview)))}
                    className="w-full bg-gradient-to-r from-[#b388ff] to-purple-600 hover:from-[#9c5cff] hover:to-purple-700 text-white font-semibold py-4 text-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Joining Quiz...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="mr-2 h-5 w-5" />
                        {roomPreview ? getJoinButtonText(roomPreview) : 'Join Room'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Room Preview */}
              <Card className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#b388ff] flex items-center gap-2">
                    <Eye className="h-6 w-6" />
                    Room Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-[#b388ff] mx-auto mb-4" />
                        <p className="text-gray-400">Checking room...</p>
                      </div>
                    </div>
                  ) : roomPreview ? (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                      {/* Room Header */}
                      <div className="bg-gradient-to-r from-[#1a1f2e] to-[#242b3d] rounded-xl p-6 border border-gray-700">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-[#e0e0e0] text-xl mb-2">{roomPreview.title}</h3>
                            {roomPreview.description && (
                              <p className="text-gray-400 text-sm mb-3">{roomPreview.description}</p>
                            )}
                          </div>
                          <Badge className={getStatusConfig(roomPreview.status).color}>
                            {(() => {
                              const Icon = getStatusConfig(roomPreview.status).icon;
                              return <Icon className="h-3 w-3 mr-1" />;
                            })()}
                            {getStatusConfig(roomPreview.status).label}
                          </Badge>
                        </div>

                        {/* Room Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#1a1f2e] rounded-lg p-3 hover:bg-[#1e2332] transition-colors duration-300">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="h-4 w-4 text-[#b388ff]" />
                              <span className="text-gray-400 text-sm">Participants</span>
                            </div>
                            <p className="text-[#e0e0e0] font-semibold">
                              {roomPreview.currentParticipants}/{roomPreview.maxParticipants}
                            </p>
                          </div>
                          
                          <div className="bg-[#1a1f2e] rounded-lg p-3 hover:bg-[#1e2332] transition-colors duration-300">
                            <div className="flex items-center gap-2 mb-1">
                              <Timer className="h-4 w-4 text-[#b388ff]" />
                              <span className="text-gray-400 text-sm">Duration</span>
                            </div>
                            <p className="text-[#e0e0e0] font-semibold">{roomPreview.timeLimit} minutes</p>
                          </div>
                          
                          <div className="bg-[#1a1f2e] rounded-lg p-3 hover:bg-[#1e2332] transition-colors duration-300">
                            <div className="flex items-center gap-2 mb-1">
                              <BookOpen className="h-4 w-4 text-[#b388ff]" />
                              <span className="text-gray-400 text-sm">Category</span>
                            </div>
                            <p className="text-[#e0e0e0] font-semibold">{roomPreview.category}</p>
                          </div>
                          
                          <div className="bg-[#1a1f2e] rounded-lg p-3 hover:bg-[#1e2332] transition-colors duration-300">
                            <div className="flex items-center gap-2 mb-1">
                              {(() => {
                                const Icon = getDifficultyConfig(roomPreview.difficulty).icon;
                                return <Icon className="h-4 w-4 text-[#b388ff]" />;
                              })()}
                              <span className="text-gray-400 text-sm">Difficulty</span>
                            </div>
                            <Badge className={getDifficultyConfig(roomPreview.difficulty).color}>
                              {roomPreview.difficulty}
                            </Badge>
                          </div>
                        </div>

                        {/* Host Info */}
                        <div className="mt-4 pt-4 border-t border-gray-600">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#b388ff] to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">
                                {roomPreview.creatorName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-[#e0e0e0] text-sm font-medium">Hosted by {roomPreview.creatorName}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                {roomPreview.isPublic ? (
                                  <>
                                    <Globe className="h-3 w-3" />
                                    <span>Public Quiz</span>
                                  </>
                                ) : (
                                  <>
                                    <Shield className="h-3 w-3" />
                                    <span>Private Quiz</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Special Notices */}
                        {roomPreview.scheduledStartTime && (
                          <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <div className="flex items-center gap-2 text-blue-400 text-sm">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">
                                {formatTimeLeft(roomPreview.scheduledStartTime)}
                              </span>
                            </div>
                          </div>
                        )}

                        {roomPreview.status === 'active' && roomPreview.allowLateJoin && (
                          <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                            <div className="flex items-center gap-2 text-green-400 text-sm">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Late join allowed - You can still participate!</span>
                            </div>
                          </div>
                        )}

                        {!canJoinRoom(roomPreview) && (
                          <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <div className="flex items-center gap-2 text-red-400 text-sm">
                              <AlertCircle className="h-4 w-4" />
                              <span>
                                {roomPreview.currentParticipants >= roomPreview.maxParticipants 
                                  ? 'Room is full' 
                                  : roomPreview.status === 'completed'
                                  ? 'Quiz has ended'
                                  : 'Quiz is in progress and late join is disabled'
                                }
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : roomCode.length === 6 ? (
                    <div className="text-center py-12 text-gray-400 animate-in fade-in duration-500">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                      <h4 className="text-lg font-medium text-red-400 mb-2">Room Not Found</h4>
                      <p className="text-sm">
                        The room code &quot;<span className="font-mono text-red-400">{roomCode}</span>&quot; doesn&apos;t exist or has expired.
                      </p>
                      <p className="text-xs mt-2">Please check the code and try again.</p>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h4 className="text-lg font-medium mb-2">Enter Room Code</h4>
                      <p className="text-sm">Enter a 6-character room code to see quiz details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Browse Rooms Tab */}
          <TabsContent value="browse" className="space-y-8">
            {/* Filters */}
            <Card className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-xl text-[#b388ff] flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Find the Perfect Quiz
                </CardTitle>
                <p className="text-gray-400">Browse available public quizzes and join instantly</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-[#e0e0e0] text-sm font-medium">Search</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search quizzes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] pl-10 transition-all duration-300 focus:border-[#b388ff]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[#e0e0e0] text-sm font-medium">Status</Label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full h-10 bg-[#1a1f2e] border border-purple-500/20 rounded-md px-3 text-[#e0e0e0] text-sm mt-1 transition-all duration-300 focus:border-[#b388ff] focus:outline-none"
                    >
                      <option value="">All Status</option>
                      <option value="waiting">Starting Soon</option>
                      <option value="active">Live Now</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-[#e0e0e0] text-sm font-medium">Category</Label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full h-10 bg-[#1a1f2e] border border-purple-500/20 rounded-md px-3 text-[#e0e0e0] text-sm mt-1 transition-all duration-300 focus:border-[#b388ff] focus:outline-none"
                    >
                      <option value="">All Categories</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-[#e0e0e0] text-sm font-medium">Difficulty</Label>
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="w-full h-10 bg-[#1a1f2e] border border-purple-500/20 rounded-md px-3 text-[#e0e0e0] text-sm mt-1 transition-all duration-300 focus:border-[#b388ff] focus:outline-none"
                    >
                      <option value="">All Levels</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guest Name Input */}
            {!session && (
              <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                <CardContent className="pt-6">
                  <div className="max-w-md mx-auto">
                    <div className="flex items-center gap-2 mb-3">
                      <UserCheck className="h-5 w-5 text-blue-400" />
                      <Label htmlFor="browseUserName" className="text-blue-400 font-medium">Your Name (Required for joining)</Label>
                    </div>
                    <Input
                      id="browseUserName"
                      placeholder="Enter your name to join quizzes"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="bg-[#1a1f2e] border-blue-500/20 text-[#e0e0e0] transition-all duration-300 focus:border-blue-400"
                    />
                    <p className="text-xs text-blue-300 mt-2 text-center">
                      💡 <strong>Sign in</strong> to save your progress and compete on leaderboards
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Public Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicRooms.map((room, index) => (
                <Card 
                  key={room.id} 
                  className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-[1.02] group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-[#e0e0e0] line-clamp-2 group-hover:text-[#b388ff] transition-colors duration-300">
                          {room.title}
                        </CardTitle>
                        {room.description && (
                          <p className="text-sm text-gray-400 line-clamp-2 mt-1">{room.description}</p>
                        )}
                      </div>
                      <Badge className={getStatusConfig(room.status).color}>
                        {(() => {
                          const Icon = getStatusConfig(room.status).icon;
                          return <Icon className="h-3 w-3 mr-1" />;
                        })()}
                        {getStatusConfig(room.status).label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-6 h-6 bg-gradient-to-br from-[#b388ff] to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {room.creatorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span>By {room.creatorName}</span>
                      <span>•</span>
                      <code className="text-[#b388ff] font-mono text-xs">{room.code}</code>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Room Stats */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-[#e0e0e0]">{room.currentParticipants}/{room.maxParticipants}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-[#e0e0e0]">{room.timeLimit}m</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="text-[#e0e0e0]">{room.statistics?.totalQuestions || 0}Q</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-gray-400" />
                        <span className="text-[#e0e0e0]">{room.statistics?.averageScore || 0}%</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[#e0e0e0] border-gray-500/30 text-xs">
                        {room.category}
                      </Badge>
                      <Badge className={getDifficultyConfig(room.difficulty).color}>
                        {room.difficulty}
                      </Badge>
                      {room.allowLateJoin && room.status === 'active' && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          Late join OK
                        </Badge>
                      )}
                    </div>

                    {/* Special notices */}
                    {room.scheduledStartTime && room.status === 'waiting' && (
                      <div className="bg-blue-500/10 rounded-lg p-2 border border-blue-500/20">
                        <div className="flex items-center gap-2 text-blue-400 text-xs">
                          <Calendar className="h-3 w-3" />
                          <span>{formatTimeLeft(room.scheduledStartTime)}</span>
                        </div>
                      </div>
                    )}

                    {/* Progress bar for room capacity */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Capacity</span>
                        <span className="text-[#e0e0e0]">
                          {Math.round((room.currentParticipants / room.maxParticipants) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${
                            room.currentParticipants / room.maxParticipants >= 0.8 
                              ? 'bg-red-500' 
                              : room.currentParticipants / room.maxParticipants >= 0.6 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${(room.currentParticipants / room.maxParticipants) * 100}%`,
                            animationDelay: `${index * 200}ms`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Join Button */}
                    <Button
                      onClick={() => joinRoom(room.code)}
                      disabled={
                        isJoining || 
                        !canJoinRoom(room) ||
                        (!session && !userName.trim())
                      }
                      className={`w-full font-semibold py-2.5 transition-all duration-300 ${
                        canJoinRoom(room)
                          ? 'bg-gradient-to-r from-[#b388ff] to-purple-600 hover:from-[#9c5cff] hover:to-purple-700 text-white hover:shadow-lg hover:shadow-purple-500/25'
                          : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {isJoining ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          {canJoinRoom(room) ? (
                            room.status === 'active' ? (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Join Live Quiz
                              </>
                            ) : (
                              <>
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Join Room
                              </>
                            )
                          ) : (
                            getJoinButtonText(room)
                          )}
                        </>
                      )}
                    </Button>

                    {/* Additional info */}
                    <div className="text-xs text-gray-400 text-center">
                      Created {new Date(room.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {publicRooms.length === 0 && (
                <div className="col-span-full">
                  <Card className="bg-[#242b3d] border-purple-500/20">
                    <CardContent className="py-16 text-center">
                      <Search className="h-16 w-16 mx-auto mb-6 text-gray-400 opacity-50" />
                      <h3 className="text-xl font-semibold text-[#e0e0e0] mb-3">No Quizzes Found</h3>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        No public quizzes match your current filters. Try adjusting your search criteria or check back later for new quizzes.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          onClick={() => {
                            setSearchQuery('')
                            setCategoryFilter('')
                            setDifficultyFilter('')
                            setStatusFilter('')
                          }}
                          variant="outline"
                          className="border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10"
                        >
                          Clear Filters
                        </Button>
                        <Button
                          onClick={() => setActiveTab('code')}
                          className="bg-[#b388ff] hover:bg-[#9c5cff]"
                        >
                          <Hash className="h-4 w-4 mr-2" />
                          Join by Code Instead
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Show more button if there are many rooms */}
            {publicRooms.length >= 20 && (
              <div className="text-center">
                <Button
                  onClick={fetchPublicRooms}
                  variant="outline"
                  className="border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10"
                >
                  Load More Quizzes
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Features Section */}
        <div className="mt-16 pt-16 border-t border-gray-700">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why Choose Our Quiz Platform?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Experience the most advanced and fair quiz platform with real-time features and comprehensive analytics
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Secure & Fair</h3>
              <p className="text-gray-400">
                Advanced anti-cheating measures ensure fair competition. Once completed, quizzes cannot be retaken to maintain integrity.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Timer className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Experience</h3>
              <p className="text-gray-400">
                Live leaderboards, instant feedback, and real-time participant tracking create an engaging quiz experience.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Comprehensive Analytics</h3>
              <p className="text-gray-400">
                Detailed performance analytics, progress tracking, and achievement systems help you improve over time.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[#b388ff]/10 to-purple-600/10 rounded-2xl p-8 border border-purple-500/20">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Test Your Knowledge?</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Join thousands of learners already participating in engaging quizzes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setActiveTab('code')}
                className="bg-gradient-to-r from-[#b388ff] to-purple-600 hover:from-[#9c5cff] hover:to-purple-700 text-white px-8"
              >
                <Hash className="h-4 w-4 mr-2" />
                Enter Room Code
              </Button>
              <Button
                onClick={() => setActiveTab('browse')}
                variant="outline"
                className="border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10 px-8"
              >
                <Globe className="h-4 w-4 mr-2" />
                Browse Public Quizzes
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}