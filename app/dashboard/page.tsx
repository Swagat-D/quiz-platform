// app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Plus, Users, Clock, MoreVertical, Play, Settings, 
  TrendingUp, Award, Target, BookOpen, Search, Eye,
  Copy, Share2, Trash2, Filter, Calendar
} from 'lucide-react'
import { useSession } from "next-auth/react"
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('my-rooms')

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
      const [myRoomsResponse, joinedRoomsResponse] = await Promise.all([
        fetch('/api/rooms?type=my&limit=20'),
        fetch('/api/rooms?type=joined&limit=20')
      ])

      const [myRoomsData, joinedRoomsData] = await Promise.all([
        myRoomsResponse.json(),
        joinedRoomsResponse.json()
      ])

      if (myRoomsData.success) {
        setMyRooms(myRoomsData.rooms)
      }
      
      if (joinedRoomsData.success) {
        setJoinedRooms(joinedRoomsData.rooms)
      }

      // Calculate stats
      const rooms = myRoomsData.rooms || []
      const totalRoomsCreated = rooms.length
      const activeRooms = rooms.filter((r: Room) => r.status === 'active').length
      const completedRooms = rooms.filter((r: Room) => r.status === 'completed').length
      const totalParticipants = rooms.reduce((sum: number, room: Room) => sum + room.currentParticipants, 0)
      const totalQuizzesTaken = joinedRoomsData.rooms?.length || 0
      
      const completedRoomsWithScores = rooms.filter((r: Room) => r.status === 'completed' && r.statistics?.averageScore > 0)
      const averageScore = completedRoomsWithScores.length > 0 
        ? Math.round(completedRoomsWithScores.reduce((sum: number, room: Room) => sum + room.statistics.averageScore, 0) / completedRoomsWithScores.length)
        : 0

      setStats({
        totalRoomsCreated,
        totalParticipants,
        averageScore,
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

  const filteredRooms = (activeTab === 'my-rooms' ? myRooms : joinedRooms).filter(room => {
    const matchesSearch = room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter
    
    // Hide cancelled rooms unless specifically filtering for them
    const showCancelled = statusFilter === 'cancelled' || statusFilter === 'all'
    if (room.status === 'cancelled' && !showCancelled) {
      return false
    }
    
    return matchesSearch && matchesStatus
  })

  const handleRoomAction = async (roomId: string, action: string) => {
  try {
    switch (action) {
      case 'start':
        const startResponse = await fetch(`/api/rooms/${roomId}/start`, { method: 'POST' })
        if (startResponse.ok) {
          router.push(`/rooms/${roomId}/live`)
        } else {
          const error = await startResponse.json()
          alert(error.error || 'Failed to start room')
        }
        break
        
      case 'delete':
        if (confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
          const deleteResponse = await fetch(`/api/rooms/${roomId}`, { 
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            }
          })
          
          if (deleteResponse.ok) {
            // Show success message
            alert('Room deleted successfully!')
            // Refresh the dashboard data
            fetchDashboardData()
          } else {
            const error = await deleteResponse.json()
            alert(error.error || 'Failed to delete room')
          }
        }
        break
        
      case 'duplicate':
        // Implement room duplication
        alert('Room duplication feature coming soon!')
        break
        
      case 'export':
        // Implement room export
        alert('Room export feature coming soon!')
        break
        
      default:
        console.log('Unknown action:', action)
    }
  } catch (error) {
    console.error('Room action error:', error)
    alert('An error occurred while performing the action. Please try again.')
  }
}

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
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

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b388ff] mx-auto mb-4"></div>
          <div className="text-[#e0e0e0] text-lg">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      <Navbar />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#b388ff] mb-2">
                Welcome back, {session?.user?.name || 'Developer'}!
              </h1>
              <p className="text-[#e0e0e0]">Manage your quiz rooms and track your progress</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { icon: Target, label: 'Rooms Created', value: stats.totalRoomsCreated, color: 'text-[#b388ff]' },
            { icon: Users, label: 'Participants', value: stats.totalParticipants, color: 'text-emerald-400' },
            { icon: Play, label: 'Active', value: stats.activeRooms, color: 'text-green-400' },
            { icon: Award, label: 'Completed', value: stats.completedRooms, color: 'text-purple-400' },
            { icon: TrendingUp, label: 'Quizzes Taken', value: stats.totalQuizzesTaken, color: 'text-blue-400' },
            { icon: BookOpen, label: 'Avg Score', value: `${stats.averageScore}%`, color: 'text-yellow-400' }
          ].map((stat, index) => (
            <Card key={index} className="bg-[#242b3d] border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <div>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <p className="text-xl font-bold text-[#e0e0e0]">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Rooms Section */}
          <div className="xl:col-span-3 space-y-6">
            {/* Tabs */}
            <div className="flex space-x-1 bg-[#242b3d] p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('my-rooms')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'my-rooms'
                    ? 'bg-[#b388ff] text-white'
                    : 'text-[#e0e0e0] hover:bg-purple-500/10'
                }`}
              >
                My Rooms ({myRooms.length})
              </button>
              <button
                onClick={() => setActiveTab('joined-rooms')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'joined-rooms'
                    ? 'bg-[#b388ff] text-white'
                    : 'text-[#e0e0e0] hover:bg-purple-500/10'
                }`}
              >
                Joined Rooms ({joinedRooms.length})
              </button>
            </div>

            {/* Search and Filter */}
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search rooms..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-[#1a1f2e] border border-purple-500/20 rounded-md text-[#e0e0e0] text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="waiting">Waiting</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rooms Grid */}
            {filteredRooms.length === 0 ? (
              <Card className="bg-[#242b3d] border-purple-500/20">
                <CardContent className="py-12 text-center">
                  <Target className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
                  <h3 className="text-lg font-medium text-[#e0e0e0] mb-2">
                    {activeTab === 'my-rooms' ? 'No rooms created yet' : 'No rooms joined yet'}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {activeTab === 'my-rooms' 
                      ? 'Create your first quiz room to get started'
                      : 'Join a quiz room to start learning'
                    }
                  </p>
                  <Button asChild className="bg-[#b388ff] hover:bg-[#9c5cff]">
                    <Link href={activeTab === 'my-rooms' ? '/rooms/create' : '/rooms/join'}>
                      <Plus className="h-4 w-4 mr-2" />
                      {activeTab === 'my-rooms' ? 'Create Room' : 'Join Room'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredRooms.map((room) => (
                  <Card key={room.id} className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-colors group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg text-[#e0e0e0] truncate group-hover:text-[#b388ff] transition-colors">
                            {room.title}
                          </CardTitle>
                          <p className="text-gray-400 text-sm line-clamp-2 mt-1">
                            {room.description || 'No description'}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-3">
                          <Badge className={getStatusColor(room.status)}>
                            {room.status}
                          </Badge>
                          
                          {activeTab === 'my-rooms' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-[#e0e0e0]">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-[#242b3d] border-purple-500/20">
                                <DropdownMenuItem 
                                  onClick={() => router.push(`/rooms/${room.id}/manage`)}
                                  className="text-[#e0e0e0] hover:bg-purple-500/10"
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Manage
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRoomAction(room.id, 'copy-code')}
                                  className="text-[#e0e0e0] hover:bg-purple-500/10"
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Code
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRoomAction(room.id, 'copy-link')}
                                  className="text-[#e0e0e0] hover:bg-purple-500/10"
                                >
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share Link
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-purple-500/20" />
                                {room.status === 'waiting' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleRoomAction(room.id, 'start')}
                                    className="text-green-400 hover:bg-green-500/10"
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Start Room
                                  </DropdownMenuItem>
                                )}
                                {room.status === 'active' && (
                                  <DropdownMenuItem 
                                    onClick={() => router.push(`/rooms/${room.id}/live`)}
                                    className="text-green-400 hover:bg-green-500/10"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Live
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => handleRoomAction(room.id, 'delete')}
                                  className="text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Room Code</span>
                        <code className="bg-[#1a1f2e] px-2 py-1 rounded text-[#b388ff] font-mono text-xs">
                          {room.code}
                        </code>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className="text-[#e0e0e0]">{room.currentParticipants}/{room.maxParticipants}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-[#e0e0e0]">{room.timeLimit}m</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span className="text-[#e0e0e0]">{room.statistics.totalQuestions}Q</span>
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

                      {activeTab === 'joined-rooms' && (
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
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-[#b388ff]">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full bg-[#b388ff] hover:bg-[#9c5cff] text-white justify-start">
                  <Link href="/rooms/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Room
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10 justify-start">
                  <Link href="/rooms/join">
                    <Users className="h-4 w-4 mr-2" />
                    Join Room
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10 justify-start">
                  <Link href="/questions/bank">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Question Bank
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-[#b388ff]">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Success Rate</span>
                    <span className="text-sm font-semibold text-[#e0e0e0]">{stats.averageScore}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-[#b388ff] h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${stats.averageScore}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Completion Rate</span>
                    <span className="text-sm font-semibold text-[#e0e0e0]">
                      {stats.totalRoomsCreated > 0 ? Math.round((stats.completedRooms / stats.totalRoomsCreated) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${stats.totalRoomsCreated > 0 ? (stats.completedRooms / stats.totalRoomsCreated) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-600">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#b388ff]">{stats.totalParticipants}</div>
                    <div className="text-xs text-gray-400">Total Participants</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}