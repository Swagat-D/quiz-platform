// app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Users, Clock, Calendar, MoreVertical, Play, Edit, Trash2, Settings, TrendingUp, Award, Target } from 'lucide-react'
import { useSession } from "next-auth/react"
import Link from 'next/link'

interface Room {
  id: string
  code: string
  title: string
  description: string
  status: 'waiting' | 'active' | 'completed' | 'cancelled'
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
  startedAt: string | null
  completedAt: string | null
  statistics: {
    totalQuestions: number
    averageScore: number
    completionRate: number
  }
}

interface DashboardStats {
  totalRoomsCreated: number
  totalParticipants: number
  averageScore: number
  activeRooms: number
  completedRooms: number
  totalQuizzesTaken: number
}

export default function Dashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [myRooms, setMyRooms] = useState<Room[]>([])
  const [joinedRooms, setJoinedRooms] = useState<Room[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalRoomsCreated: 0,
    totalParticipants: 0,
    averageScore: 0,
    activeRooms: 0,
    completedRooms: 0,
    totalQuizzesTaken: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Fetch user data
  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData()
    }
  }, [session])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Fetch user's created rooms
      const myRoomsResponse = await fetch('/api/rooms?type=my&limit=10')
      const myRoomsData = await myRoomsResponse.json()
      
      // Fetch user's joined rooms
      const joinedRoomsResponse = await fetch('/api/rooms?type=joined&limit=10')
      const joinedRoomsData = await joinedRoomsResponse.json()

      if (myRoomsData.success) {
        setMyRooms(myRoomsData.rooms)
      }
      
      if (joinedRoomsData.success) {
        setJoinedRooms(joinedRoomsData.rooms)
      }

      // Calculate stats
      const totalRoomsCreated = myRoomsData.rooms?.length || 0
      const activeRooms = myRoomsData.rooms?.filter((r: Room) => r.status === 'active')?.length || 0
      const completedRooms = myRoomsData.rooms?.filter((r: Room) => r.status === 'completed')?.length || 0
      const totalParticipants = myRoomsData.rooms?.reduce((sum: number, room: Room) => sum + room.currentParticipants, 0) || 0
      const totalQuizzesTaken = joinedRoomsData.rooms?.length || 0

      setStats({
        totalRoomsCreated,
        totalParticipants,
        averageScore: 0, // Would calculate from user's quiz results
        activeRooms,
        completedRooms,
        totalQuizzesTaken
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
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
      case 'completed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Show loading state or redirect
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex justify-center items-center">
        <div className="text-[#b388ff] text-xl">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#b388ff] mb-2">
                Welcome back, {session?.user?.name || 'Developer'}!
              </h1>
              <p className="text-[#e0e0e0]">Manage your quiz rooms and track your progress</p>
            </div>
            <div className="flex gap-3">
              <Button asChild className="bg-[#b388ff] hover:bg-[#9c5cff] text-white">
                <Link href="/rooms/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Room
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10">
                <Link href="/rooms/join">
                  <Users className="h-4 w-4 mr-2" />
                  Join Room
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#b388ff]" />
                  <div>
                    <p className="text-sm text-gray-400">Rooms Created</p>
                    <p className="text-xl font-bold text-[#e0e0e0]">{stats.totalRoomsCreated}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#b388ff]" />
                  <div>
                    <p className="text-sm text-gray-400">Total Participants</p>
                    <p className="text-xl font-bold text-[#e0e0e0]">{stats.totalParticipants}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Active Rooms</p>
                    <p className="text-xl font-bold text-[#e0e0e0]">{stats.activeRooms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Completed</p>
                    <p className="text-xl font-bold text-[#e0e0e0]">{stats.completedRooms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Quizzes Taken</p>
                    <p className="text-xl font-bold text-[#e0e0e0]">{stats.totalQuizzesTaken}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="text-sm text-gray-400">Avg Score</p>
                    <p className="text-xl font-bold text-[#e0e0e0]">{stats.averageScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="my-rooms" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-[#242b3d]">
              <TabsTrigger value="my-rooms" className="data-[state=active]:bg-[#b388ff]">My Rooms</TabsTrigger>
              <TabsTrigger value="joined-rooms" className="data-[state=active]:bg-[#b388ff]">Joined Rooms</TabsTrigger>
            </TabsList>

            {/* My Rooms Tab */}
            <TabsContent value="my-rooms" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-[#e0e0e0]">Your Quiz Rooms</h2>
                <Button asChild size="sm" className="bg-[#b388ff] hover:bg-[#9c5cff]">
                  <Link href="/rooms/create">
                    <Plus className="h-4 w-4 mr-2" />
                    New Room
                  </Link>
                </Button>
              </div>

              {myRooms.length === 0 ? (
                <Card className="bg-[#242b3d] border-purple-500/20">
                  <CardContent className="py-12 text-center">
                    <Target className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
                    <h3 className="text-lg font-medium text-[#e0e0e0] mb-2">No rooms created yet</h3>
                    <p className="text-gray-400 mb-6">Create your first quiz room to get started</p>
                    <Button asChild className="bg-[#b388ff] hover:bg-[#9c5cff]">
                      <Link href="/rooms/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Room
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myRooms.map((room) => (
                    <Card key={room.id} className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg text-[#e0e0e0] truncate">{room.title}</CardTitle>
                            <CardDescription className="text-gray-400 line-clamp-2 mt-1">
                              {room.description || 'No description'}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge className={getStatusColor(room.status)}>
                              {room.status}
                            </Badge>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#e0e0e0]">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Room Code</span>
                          <span className="font-mono text-[#b388ff] font-semibold">{room.code}</span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-[#e0e0e0]">{room.currentParticipants}/{room.maxParticipants}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-[#e0e0e0]">{room.timeLimit}m</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[#e0e0e0] border-gray-500/30 text-xs">
                            {room.category}
                          </Badge>
                          <Badge className={getDifficultyColor(room.difficulty)}>
                            {room.difficulty}
                          </Badge>
                          {room.isPublic && (
                            <Badge variant="outline" className="text-blue-400 border-blue-500/30 text-xs">
                              Public
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-gray-400">
                          Created {formatDate(room.createdAt)}
                        </div>

                        {room.scheduledStartTime && room.status === 'waiting' && (
                          <div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 rounded p-2">
                            <Calendar className="h-3 w-3" />
                            <span>Scheduled: {formatDate(room.scheduledStartTime)}</span>
                          </div>
                        )}

                        {room.status === 'completed' && room.statistics && (
                          <div className="bg-purple-500/10 rounded p-2 text-xs">
                            <div className="flex justify-between text-purple-400">
                              <span>Avg Score: {room.statistics.averageScore}%</span>
                              <span>Completion: {room.statistics.completionRate}%</span>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          {room.status === 'waiting' && (
                            <>
                              <Button asChild size="sm" className="flex-1 bg-[#b388ff] hover:bg-[#9c5cff]">
                                <Link href={`/rooms/${room.id}/manage`}>
                                  <Settings className="h-3 w-3 mr-1" />
                                  Manage
                                </Link>
                              </Button>
                              <Button asChild size="sm" variant="outline" className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10">
                                <Link href={`/rooms/${room.id}/start`}>
                                  <Play className="h-3 w-3 mr-1" />
                                  Start
                                </Link>
                              </Button>
                            </>
                          )}
                          
                          {room.status === 'active' && (
                            <Button asChild size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                              <Link href={`/rooms/${room.id}/live`}>
                                <Play className="h-3 w-3 mr-1" />
                                View Live
                              </Link>
                            </Button>
                          )}
                          
                          {room.status === 'completed' && (
                            <Button asChild size="sm" variant="outline" className="flex-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                              <Link href={`/rooms/${room.id}/results`}>
                                <Award className="h-3 w-3 mr-1" />
                                Results
                              </Link>
                            </Button>
                          )}

                          {(room.status === 'waiting' || room.status === 'completed') && (
                            <Button size="sm" variant="outline" className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10">
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {myRooms.length > 0 && (
                <div className="text-center">
                  <Button asChild variant="outline" className="border-purple-500/30 text-[#b388ff] hover:bg-purple-500/10">
                    <Link href="/rooms/my">View All My Rooms</Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Joined Rooms Tab */}
            <TabsContent value="joined-rooms" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-[#e0e0e0]">Rooms You&apos;ve Joined</h2>
                <Button asChild size="sm" variant="outline" className="border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10">
                  <Link href="/rooms/join">
                    <Users className="h-4 w-4 mr-2" />
                    Join Room
                  </Link>
                </Button>
              </div>

              {joinedRooms.length === 0 ? (
                <Card className="bg-[#242b3d] border-purple-500/20">
                  <CardContent className="py-12 text-center">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
                    <h3 className="text-lg font-medium text-[#e0e0e0] mb-2">No rooms joined yet</h3>
                    <p className="text-gray-400 mb-6">Join your first quiz room to start learning</p>
                    <Button asChild className="bg-[#b388ff] hover:bg-[#9c5cff]">
                      <Link href="/rooms/join">
                        <Users className="h-4 w-4 mr-2" />
                        Browse Available Rooms
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {joinedRooms.map((room) => (
                    <Card key={room.id} className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg text-[#e0e0e0] truncate">{room.title}</CardTitle>
                            <CardDescription className="text-gray-400 line-clamp-2 mt-1">
                              By {room.creatorName}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(room.status)}>
                            {room.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Room Code</span>
                          <span className="font-mono text-[#b388ff] font-semibold">{room.code}</span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-[#e0e0e0]">{room.currentParticipants}/{room.maxParticipants}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-[#e0e0e0]">{room.timeLimit}m</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[#e0e0e0] border-gray-500/30 text-xs">
                            {room.category}
                          </Badge>
                          <Badge className={getDifficultyColor(room.difficulty)}>
                            {room.difficulty}
                          </Badge>
                        </div>

                        <div className="text-xs text-gray-400">
                          Joined {formatDate(room.createdAt)}
                        </div>

                        <div className="pt-2">
                          {room.status === 'waiting' && (
                            <Button asChild size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                              <Link href={`/rooms/${room.id}/quiz`}>
                                <Clock className="h-3 w-3 mr-1" />
                                Waiting to Start
                              </Link>
                            </Button>
                          )}
                          
                          {room.status === 'active' && (
                            <Button asChild size="sm" className="w-full bg-green-600 hover:bg-green-700">
                              <Link href={`/rooms/${room.id}/quiz`}>
                                <Play className="h-3 w-3 mr-1" />
                                Continue Quiz
                              </Link>
                            </Button>
                          )}
                          
                          {room.status === 'completed' && (
                            <Button asChild size="sm" variant="outline" className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                              <Link href={`/rooms/${room.id}/results`}>
                                <Award className="h-3 w-3 mr-1" />
                                View Results
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {joinedRooms.length > 0 && (
                <div className="text-center">
                  <Button asChild variant="outline" className="border-purple-500/30 text-[#b388ff] hover:bg-purple-500/10">
                    <Link href="/rooms/joined">View All Joined Rooms</Link>
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <Card className="bg-[#242b3d] border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-xl text-[#b388ff]">Quick Actions</CardTitle>
              <CardDescription className="text-gray-400">
                Get started with these common actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button asChild className="h-20 bg-gradient-to-br from-purple-400 to-pink-500 hover:opacity-90 text-white font-medium rounded-xl shadow-lg transition-all duration-300 hover:scale-105">
                  <Link href="/rooms/create" className="flex flex-col items-center gap-2">
                    <Plus className="h-6 w-6" />
                    <span>Create New Room</span>
                  </Link>
                </Button>

                <Button asChild className="h-20 bg-gradient-to-br from-emerald-400 to-blue-500 hover:opacity-90 text-white font-medium rounded-xl shadow-lg transition-all duration-300 hover:scale-105">
                  <Link href="/rooms/join" className="flex flex-col items-center gap-2">
                    <Users className="h-6 w-6" />
                    <span>Join Room</span>
                  </Link>
                </Button>

                <Button asChild className="h-20 bg-gradient-to-br from-amber-400 to-orange-500 hover:opacity-90 text-white font-medium rounded-xl shadow-lg transition-all duration-300 hover:scale-105">
                  <Link href="/questions/bank" className="flex flex-col items-center gap-2">
                    <Target className="h-6 w-6" />
                    <span>Question Bank</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}