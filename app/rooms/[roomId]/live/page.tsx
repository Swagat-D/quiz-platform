/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/rooms/[roomId]/live/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/navbar'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, Play, Pause, Square,
  AlertCircle, Copy, Share2, Settings
} from 'lucide-react'

interface Room {
  id: string
  code: string
  title: string
  status: string
  currentParticipants: number
  maxParticipants: number
  participants: any[]
  startedAt: string | null
  scheduledEndTime: string | null
  statistics: {
    totalQuestions: number
    averageScore: number
    completionRate: number
  }
}

export default function LiveRoomPage() {
  const params = useParams()
  const router = useRouter()
  useSession()
  const roomId = params?.roomId as string

  const [room, setRoom] = useState<Room | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (roomId) {
      fetchRoomStatus()
      // Poll for updates every 10 seconds
      const interval = setInterval(fetchRoomStatus, 10000)
      return () => clearInterval(interval)
    }
  }, [roomId])

  useEffect(() => {
    if (room?.scheduledEndTime) {
      const timer = setInterval(() => {
        const now = new Date().getTime()
        const end = new Date(room.scheduledEndTime!).getTime()
        const remaining = Math.max(0, end - now)
        setTimeRemaining(remaining)
        
        if (remaining === 0) {
          clearInterval(timer)
        }
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [room?.scheduledEndTime])

  const fetchRoomStatus = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/start`)
      const data = await response.json()

      if (data.success) {
        setRoom(data.room)
      }
    } catch (error) {
      console.error('Failed to fetch room status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const controlRoom = async (action: 'pause' | 'resume' | 'end') => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/start`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        fetchRoomStatus()
        if (action === 'end') {
          router.push(`/rooms/${roomId}/results`)
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
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
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
                <Badge className={
                  room.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  room.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                  'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }>
                  {room.status}
                </Badge>
              </div>
              <p className="text-[#e0e0e0]">Live room management and monitoring</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-[#242b3d] rounded-lg px-4 py-2 border border-purple-500/20">
                <span className="text-gray-400 text-sm">Room Code: </span>
                <span className="text-[#b388ff] font-mono font-bold">{room.code}</span>
                <Button
                  onClick={() => copyToClipboard(room.code)}
                  size="sm"
                  variant="ghost"
                  className="ml-2 h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              {timeRemaining !== null && (
                <div className="bg-[#242b3d] rounded-lg px-4 py-2 border border-purple-500/20">
                  <span className="text-gray-400 text-sm">Time Left: </span>
                  <span className="text-[#e0e0e0] font-mono font-bold">{formatTime(timeRemaining)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Control Panel */}
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-[#b388ff]">Room Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {room.status === 'active' && (
                    <>
                      <Button
                        onClick={() => controlRoom('pause')}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause Quiz
                      </Button>
                      <Button
                        onClick={() => controlRoom('end')}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        End Quiz
                      </Button>
                    </>
                  )}
                  
                  {room.status === 'paused' && (
                    <>
                      <Button
                        onClick={() => controlRoom('resume')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Resume Quiz
                      </Button>
                      <Button
                        onClick={() => controlRoom('end')}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        End Quiz
                      </Button>
                    </>
                  )}
                  
                  <Button
                    onClick={() => router.push(`/rooms/${roomId}/manage`)}
                    variant="outline"
                    className="border-purple-500/30 text-[#e0e0e0]"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Room Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-[#b388ff] flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Live Participants ({room.currentParticipants})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {room.participants.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No participants have joined yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {room.participants.map((participant, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[#1a1f2e] rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#b388ff] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {participant.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[#e0e0e0] font-medium">{participant.userName}</p>
                            <p className="text-xs text-gray-400">
                              {participant.isAuthenticated ? 'Authenticated' : 'Guest'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-[#e0e0e0] font-semibold">{participant.score || 0}%</p>
                          <p className="text-xs text-gray-400">
                            {participant.answeredQuestions || 0} answered
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            {/* Room Stats */}
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-[#b388ff]">Live Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#e0e0e0]">{room.statistics.totalQuestions}</p>
                    <p className="text-xs text-gray-400">Total Questions</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#e0e0e0]">{room.currentParticipants}</p>
                    <p className="text-xs text-gray-400">Active Users</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#e0e0e0]">{room.statistics.averageScore}%</p>
                    <p className="text-xs text-gray-400">Avg Score</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#e0e0e0]">{room.statistics.completionRate}%</p>
                    <p className="text-xs text-gray-400">Completion</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Panel */}
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-[#b388ff]">Share Room</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => copyToClipboard(room.code)}
                  variant="outline"
                  className="w-full border-purple-500/30 text-[#e0e0e0]"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Room Code
                </Button>
                
                <Button
                  onClick={() => copyToClipboard(`${window.location.origin}/rooms/join?code=${room.code}`)}
                  variant="outline"
                  className="w-full border-purple-500/30 text-[#e0e0e0]"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy Join Link
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}