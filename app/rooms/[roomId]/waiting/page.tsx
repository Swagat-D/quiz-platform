/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/navbar'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, Clock, Calendar, RefreshCw, AlertCircle, 
  Copy, Share2, CheckCircle2, BookOpen
} from 'lucide-react'

interface Room {
  id: string
  code: string
  title: string
  description: string
  status: string
  currentParticipants: number
  maxParticipants: number
  participants: any[]
  creatorName: string
  category: string
  difficulty: string
  timeLimit: number
  scheduledStartTime: string | null
  settings: any
  statistics: {
    totalQuestions: number
  }
}

export default function WaitingRoomPage() {
  const params = useParams()
  const router = useRouter()
  useSession()
  const roomId = params?.roomId as string

  const [room, setRoom] = useState<Room | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [countdown, setCountdown] = useState<string>('')

  useEffect(() => {
    if (roomId) {
      fetchRoomData()
      // Poll for room status every 5 seconds
      const interval = setInterval(fetchRoomData, 5000)
      return () => clearInterval(interval)
    }
  }, [roomId])

  // Countdown timer for scheduled start
  useEffect(() => {
    if (room?.scheduledStartTime) {
      const timer = setInterval(() => {
        const now = new Date().getTime()
        const start = new Date(room.scheduledStartTime!).getTime()
        const difference = start - now

        if (difference > 0) {
          const hours = Math.floor(difference / (1000 * 60 * 60))
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((difference % (1000 * 60)) / 1000)
          
          setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
        } else {
          setCountdown('Starting soon...')
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [room?.scheduledStartTime])

  const fetchRoomData = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`)
      const data = await response.json()

      if (data.success) {
        setRoom(data.room)
        
        // Redirect if room status changes
        if (data.room.status === 'active') {
          router.push(`/rooms/${roomId}/quiz`)
        } else if (data.room.status === 'completed') {
          router.push(`/rooms/${roomId}/results`)
        } else if (data.room.status === 'cancelled') {
          alert('This room has been cancelled')
          router.push('/dashboard')
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to fetch room data:', error)
      alert('Failed to load room data')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
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

  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}/rooms/join?code=${room?.code}` : ''

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold text-[#b388ff]">{room.title}</h1>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              Waiting to Start
            </Badge>
          </div>
          
          {room.description && (
            <p className="text-[#e0e0e0] text-lg mb-4">{room.description}</p>
          )}

          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <span>Created by {room.creatorName}</span>
            <span>•</span>
            <span>{room.category}</span>
            <span>•</span>
            <Badge className={getDifficultyColor(room.difficulty)}>
              {room.difficulty}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Room Info */}
          <div className="space-y-6">
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-[#b388ff]">Room Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-[#1a1f2e] rounded-lg p-4">
                    <BookOpen className="h-8 w-8 text-[#b388ff] mx-auto mb-2" />
                    <p className="text-2xl font-bold text-[#e0e0e0]">{room.statistics.totalQuestions}</p>
                    <p className="text-sm text-gray-400">Questions</p>
                  </div>
                  
                  <div className="bg-[#1a1f2e] rounded-lg p-4">
                    <Clock className="h-8 w-8 text-[#b388ff] mx-auto mb-2" />
                    <p className="text-2xl font-bold text-[#e0e0e0]">{room.timeLimit}</p>
                    <p className="text-sm text-gray-400">Minutes</p>
                  </div>
                </div>

                <div className="border-t border-gray-600 pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Room Code:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#b388ff] font-mono font-bold">{room.code}</span>
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

                    <div className="flex justify-between">
                      <span className="text-gray-400">Quiz Duration:</span>
                      <span className="text-[#e0e0e0]">{room.timeLimit} minutes</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Max Participants:</span>
                      <span className="text-[#e0e0e0]">{room.maxParticipants}</span>
                    </div>
                  </div>
                </div>

                {room.scheduledStartTime && (
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-blue-400" />
                      <span className="text-blue-400 font-medium">Scheduled Start</span>
                    </div>
                    <p className="text-[#e0e0e0] mb-2">
                      {new Date(room.scheduledStartTime).toLocaleString()}
                    </p>
                    {countdown && (
                      <p className="text-blue-400 font-mono text-lg">{countdown}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-[#b388ff]">Share Room</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => copyToClipboard(room.code)}
                  variant="outline"
                  className="w-full border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Room Code
                </Button>
                
                <Button
                  onClick={() => copyToClipboard(shareLink)}
                  variant="outline"
                  className="w-full border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy Join Link
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Participants */}
          <div className="space-y-6">
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
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Waiting for participants to join...</p>
                    <p className="text-sm mt-2">Share the room code to invite others!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
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
                        
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card className="bg-[#242b3d] border-green-500/20">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <RefreshCw className="h-6 w-6 text-green-400 animate-spin" />
                  <span className="text-green-400 font-semibold">Waiting for Quiz to Start</span>
                </div>
                <p className="text-gray-400 text-sm">
                  The quiz creator will start the session soon. 
                  {room.scheduledStartTime ? ' Check the countdown above for the scheduled start time.' : ' Stay on this page to join automatically.'}
                </p>
                
                <Button
                  onClick={fetchRoomData}
                  variant="outline"
                  className="mt-4 border-green-500/30 text-green-400 hover:bg-green-500/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}