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
import { Search, Users, Clock, Calendar, Filter, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from "sonner"

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

  // Load public rooms
  useEffect(() => {
    fetchPublicRooms()
  }, [searchQuery, categoryFilter, difficultyFilter, statusFilter])

  // Check room code from URL params
  useEffect(() => {
    const codeFromUrl = searchParams?.get('code')
    if (codeFromUrl) {
      setRoomCode(codeFromUrl)
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
        toast.error(data.error || 'Room not found')
      }
    } catch (error) {
      console.error('Room check error:', error)
      setRoomPreview(null)
      toast.error('Failed to check room')
    } finally {
      setIsLoading(false)
    }
  }

  const joinRoom = async (targetRoomCode?: string) => {
    const codeToJoin = targetRoomCode || roomCode
    
    if (!codeToJoin) {
      toast.error('Please enter a room code')
      return
    }

    if (!session && !userName.trim()) {
      toast.error('Please enter your name to join as a guest')
      return
    }

    setIsJoining(true)
    try {
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

      toast.success('Successfully joined the room!')
      router.push(`/rooms/${data.room.id}/quiz`)
    } catch (error) {
      console.error('Join room error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to join room')
    } finally {
      setIsJoining(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatTimeLeft = (scheduledTime: string | null) => {
    if (!scheduledTime) return null
    
    const now = new Date()
    const scheduled = new Date(scheduledTime)
    const diff = scheduled.getTime() - now.getTime()
    
    if (diff <= 0) return 'Starting soon'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) return `Starts in ${hours}h ${minutes}m`
    return `Starts in ${minutes}m`
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#b388ff] mb-2">Join Quiz Room</h1>
          <p className="text-[#e0e0e0]">Enter a room code or browse available public rooms</p>
        </div>

        <Tabs defaultValue="code" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-[#242b3d]">
            <TabsTrigger value="code" className="data-[state=active]:bg-[#b388ff]">Join by Code</TabsTrigger>
            <TabsTrigger value="browse" className="data-[state=active]:bg-[#b388ff]">Browse Rooms</TabsTrigger>
          </TabsList>

          {/* Join by Code Tab */}
          <TabsContent value="code" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Join Form */}
              <Card className="bg-[#242b3d] border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-xl text-[#b388ff]">Enter Room Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="roomCode" className="text-[#e0e0e0]">Room Code</Label>
                    <Input
                      id="roomCode"
                      placeholder="Enter 6-character room code"
                      value={roomCode}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().slice(0, 6)
                        setRoomCode(value)
                        if (value.length === 6) {
                          checkRoom(value)
                        } else {
                          setRoomPreview(null)
                        }
                      }}
                      className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] font-mono text-lg tracking-wider text-center"
                      maxLength={6}
                    />
                  </div>

                  {!session && (
                    <div>
                      <Label htmlFor="userName" className="text-[#e0e0e0]">Your Name (Guest)</Label>
                      <Input
                        id="userName"
                        placeholder="Enter your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                      />
                      <p className="text-xs text-gray-400 mt-1">Join as a guest or sign in for full features</p>
                    </div>
                  )}

                  <Button
                    onClick={() => joinRoom()}
                    disabled={isJoining || !roomCode || (!session && !userName.trim())}
                    className="w-full bg-[#b388ff] hover:bg-[#9c5cff] text-white font-semibold py-3"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      'Join Room'
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Room Preview */}
              <Card className="bg-[#242b3d] border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-xl text-[#b388ff]">Room Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[#b388ff]" />
                    </div>
                  ) : roomPreview ? (
                    <div className="space-y-4">
                      <div className="bg-[#1a1f2e] rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-[#e0e0e0] text-lg">{roomPreview.title}</h3>
                          <Badge className={getStatusColor(roomPreview.status)}>
                            {roomPreview.status}
                          </Badge>
                        </div>
                        
                        {roomPreview.description && (
                          <p className="text-gray-400 text-sm mb-3">{roomPreview.description}</p>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-400">Creator:</span>
                            <p className="text-[#e0e0e0] font-medium">{roomPreview.creatorName}</p>
                          </div>
                          
                          <div>
                            <span className="text-gray-400">Category:</span>
                            <p className="text-[#e0e0e0]">{roomPreview.category}</p>
                          </div>
                          
                          <div>
                            <span className="text-gray-400">Participants:</span>
                            <p className="text-[#e0e0e0]">
                              {roomPreview.currentParticipants}/{roomPreview.maxParticipants}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-gray-400">Time Limit:</span>
                            <p className="text-[#e0e0e0]">{roomPreview.timeLimit} min</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Badge className={getDifficultyColor(roomPreview.difficulty)}>
                            {roomPreview.difficulty}
                          </Badge>
                          
                          {roomPreview.allowLateJoin && (
                            <Badge variant="outline" className="text-green-400 border-green-500/30">
                              Late join allowed
                            </Badge>
                          )}
                        </div>

                        {roomPreview.scheduledStartTime && (
                          <div className="mt-3 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                            <div className="flex items-center gap-2 text-blue-400">
                              <Calendar className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                {formatTimeLeft(roomPreview.scheduledStartTime)}
                              </span>
                            </div>
                          </div>
                        )}

                        {roomPreview.status === 'active' && !roomPreview.allowLateJoin && (
                          <div className="mt-3 p-2 bg-red-500/10 rounded border border-red-500/20">
                            <div className="flex items-center gap-2 text-red-400">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">This room is active and doesn&#39;t allow late joining</span>
                            </div>
                          </div>
                        )}

                        {roomPreview.currentParticipants >= roomPreview.maxParticipants && (
                          <div className="mt-3 p-2 bg-red-500/10 rounded border border-red-500/20">
                            <div className="flex items-center gap-2 text-red-400">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">This room is full</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Enter a room code to see details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Browse Rooms Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Filters */}
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-[#b388ff] flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-[#e0e0e0]">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search rooms..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[#e0e0e0]">Status</Label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full h-9 bg-[#1a1f2e] border border-purple-500/20 rounded-md px-3 text-[#e0e0e0] text-sm"
                    >
                      <option value="">All Status</option>
                      <option value="waiting">Waiting</option>
                      <option value="active">Active</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-[#e0e0e0]">Category</Label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full h-9 bg-[#1a1f2e] border border-purple-500/20 rounded-md px-3 text-[#e0e0e0] text-sm"
                    >
                      <option value="">All Categories</option>
                      <option value="Programming">Programming</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Database">Database</option>
                      <option value="Algorithms">Algorithms</option>
                      <option value="System Design">System Design</option>
                      <option value="DevOps">DevOps</option>
                      <option value="Mobile Development">Mobile Development</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                      <option value="General Knowledge">General Knowledge</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-[#e0e0e0]">Difficulty</Label>
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="w-full h-9 bg-[#1a1f2e] border border-purple-500/20 rounded-md px-3 text-[#e0e0e0] text-sm"
                    >
                      <option value="">All Difficulties</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Public Rooms List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicRooms.map((room) => (
                <Card key={room.id} className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-[#e0e0e0] line-clamp-2">{room.title}</CardTitle>
                      <Badge className={getStatusColor(room.status)}>
                        {room.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2">{room.description}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">By {room.creatorName}</span>
                      <span className="text-[#e0e0e0] font-mono">{room.code}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-[#e0e0e0]">{room.currentParticipants}/{room.maxParticipants}</span>
                      
                      <Clock className="h-4 w-4 text-gray-400 ml-2" />
                      <span className="text-[#e0e0e0]">{room.timeLimit}m</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[#e0e0e0] border-gray-500/30">
                        {room.category}
                      </Badge>
                      <Badge className={getDifficultyColor(room.difficulty)}>
                        {room.difficulty}
                      </Badge>
                    </div>

                    {room.allowLateJoin && room.status === 'active' && (
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Late join allowed</span>
                      </div>
                    )}

                    {room.scheduledStartTime && (
                      <div className="text-xs text-blue-400">
                        {formatTimeLeft(room.scheduledStartTime)}
                      </div>
                    )}

                    <Button
                      onClick={() => joinRoom(room.code)}
                      disabled={
                        isJoining || 
                        room.currentParticipants >= room.maxParticipants ||
                        (room.status === 'active' && !room.allowLateJoin) ||
                        room.status === 'completed' ||
                        (!session && !userName.trim())
                      }
                      className="w-full bg-[#b388ff] hover:bg-[#9c5cff] text-white"
                    >
                      {isJoining ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        'Join Room'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {publicRooms.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400">
                  <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No rooms found</h3>
                  <p>Try adjusting your filters or check back later</p>
                </div>
              )}
            </div>

            {/* Guest Name Input for Browse Tab */}
            {!session && (
              <Card className="bg-[#242b3d] border-purple-500/20">
                <CardContent className="pt-6">
                  <div className="max-w-md mx-auto">
                    <Label htmlFor="browseUserName" className="text-[#e0e0e0]">Your Name (Required for joining as guest)</Label>
                    <Input
                      id="browseUserName"
                      placeholder="Enter your name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1"
                    />
                    <p className="text-xs text-gray-400 mt-1">Sign in for full features and to save your progress</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}