// app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, Users, Clock, Calendar, MoreVertical, Play, Trash2, 
  Settings, TrendingUp, Award, Target, BookOpen, Brain, Zap,
  BarChart3, Eye, Copy, Share2, Search,
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
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  questionsCreated: number
  popularCategory: string
}

export default function Dashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [myRooms, setMyRooms] = useState<Room[]>([])
  const [joinedRooms, setJoinedRooms] = useState<Room[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalRoomsCreated: 0,
    totalParticipants: 0,
    averageScore: 0,
    activeRooms: 0,
    completedRooms: 0,
    totalQuizzesTaken: 0,
    questionsCreated: 0,
    popularCategory: 'Programming'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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
      const myRoomsResponse = await fetch('/api/rooms?type=my&limit=20')
      const myRoomsData = await myRoomsResponse.json()
      
      // Fetch user's joined rooms
      const joinedRoomsResponse = await fetch('/api/rooms?type=joined&limit=20')
      const joinedRoomsData = await joinedRoomsResponse.json()

      // Fetch recent activity
      const activityResponse = await fetch('/api/rooms/activity')
      const activityData = await activityResponse.json()

      if (myRoomsData.success) {
        setMyRooms(myRoomsData.rooms)
      }
      
      if (joinedRoomsData.success) {
        setJoinedRooms(joinedRoomsData.rooms)
      }

      if (activityData.success) {
        setRecentActivity(activityData.activities || [])
      }

      // Calculate comprehensive stats
      const rooms = myRoomsData.rooms || []
      const totalRoomsCreated = rooms.length
      const activeRooms = rooms.filter((r: Room) => r.status === 'active').length
      const completedRooms = rooms.filter((r: Room) => r.status === 'completed').length
      const totalParticipants = rooms.reduce((sum: number, room: Room) => sum + room.currentParticipants, 0)
      const totalQuizzesTaken = joinedRoomsData.rooms?.length || 0
      
      // Calculate average score from completed rooms
      const completedRoomsWithScores = rooms.filter((r: Room) => r.status === 'completed' && r.statistics?.averageScore > 0)
      const averageScore = completedRoomsWithScores.length > 0 
        ? Math.round(completedRoomsWithScores.reduce((sum: number, room: Room) => sum + room.statistics.averageScore, 0) / completedRoomsWithScores.length)
        : 0

      // Find most popular category
      const categoryCount = rooms.reduce((acc: any, room: Room) => {
        acc[room.category] = (acc[room.category] || 0) + 1
        return acc
      }, {})
      const popularCategory = Object.keys(categoryCount).reduce((a, b) => 
        categoryCount[a] > categoryCount[b] ? a : b, 'Programming'
      )

      setStats({
        totalRoomsCreated,
        totalParticipants,
        averageScore,
        activeRooms,
        completedRooms,
        totalQuizzesTaken,
        questionsCreated: 0, // Would fetch from questions API
        popularCategory
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRooms = myRooms.filter(room => {
    const matchesSearch = room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const sortedRooms = [...filteredRooms].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'participants':
        return b.currentParticipants - a.currentParticipants
      case 'alphabetical':
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  const handleRoomAction = async (roomId: string, action: string) => {
    try {
      switch (action) {
        case 'start':
          const startResponse = await fetch(`/api/rooms/${roomId}/start`, { method: 'POST' })
          if (startResponse.ok) {
            router.push(`/rooms/${roomId}/live`)
          }
          break
        case 'delete':
          if (confirm('Are you sure you want to delete this room?')) {
            const deleteResponse = await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' })
            if (deleteResponse.ok) {
              fetchDashboardData()
            }
          }
          break
        case 'duplicate':
          // Implement room duplication
          break
        case 'export':
          // Implement room export
          break
      }
    } catch (error) {
      console.error('Room action error:', error)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Add toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'hard': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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

  const formatRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`
    return formatDate(dateString)
  }

  // Show loading state or redirect
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600 text-lg">Loading your dashboard...</div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Welcome back, {session?.user?.name || 'Developer'}! 👋
                </h1>
                <p className="text-gray-600 text-lg">Ready to create engaging quizzes and challenge your knowledge?</p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                  <Link href="/rooms/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Room
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Link href="/rooms/join">
                    <Users className="h-4 w-4 mr-2" />
                    Join Room
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Link href="/questions/bank">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Question Bank
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
              { 
                icon: Target, 
                label: 'Rooms Created', 
                value: stats.totalRoomsCreated,
                color: 'bg-blue-500',
                trend: '+12%'
              },
              { 
                icon: Users, 
                label: 'Total Participants', 
                value: stats.totalParticipants,
                color: 'bg-green-500',
                trend: '+8%'
              },
              { 
                icon: Play, 
                label: 'Active Rooms', 
                value: stats.activeRooms,
                color: 'bg-orange-500',
                trend: null
              },
              { 
                icon: Award, 
                label: 'Completed', 
                value: stats.completedRooms,
                color: 'bg-purple-500',
                trend: null
              },
              { 
                icon: TrendingUp, 
                label: 'Quizzes Taken', 
                value: stats.totalQuizzesTaken,
                color: 'bg-cyan-500',
                trend: '+15%'
              },
              { 
                icon: Brain, 
                label: 'Avg Score', 
                value: `${stats.averageScore}%`,
                color: 'bg-pink-500',
                trend: '+3%'
              },
              { 
                icon: BookOpen, 
                label: 'Questions', 
                value: stats.questionsCreated,
                color: 'bg-indigo-500',
                trend: '+20%'
              },
              { 
                icon: Zap, 
                label: 'Popular', 
                value: stats.popularCategory,
                color: 'bg-yellow-500',
                trend: null,
                isText: true
              }
            ].map((stat, index) => (
              <Card key={index} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                      <stat.icon className={`h-4 w-4 ${stat.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 truncate">{stat.label}</p>
                      <p className={`font-semibold text-gray-900 ${stat.isText ? 'text-xs' : 'text-lg'}`}>
                        {stat.value}
                      </p>
                      {stat.trend && (
                        <p className="text-xs text-green-600">{stat.trend}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Dashboard Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Filter and Search Bar */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search rooms by title, category, or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32 border-gray-300">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="waiting">Waiting</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-36 border-gray-300">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recent">Most Recent</SelectItem>
                          <SelectItem value="participants">Most Participants</SelectItem>
                          <SelectItem value="alphabetical">Alphabetical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rooms Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Your Quiz Rooms</h2>
                  <div className="text-sm text-gray-500">
                    {sortedRooms.length} of {myRooms.length} rooms
                  </div>
                </div>

                {sortedRooms.length === 0 ? (
                  <Card className="bg-white border-gray-200">
                    <CardContent className="py-16 text-center">
                      <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {myRooms.length === 0 ? 'No rooms created yet' : 'No rooms match your filters'}
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {myRooms.length === 0 
                          ? 'Create your first quiz room to get started with engaging interactive learning experiences.'
                          : 'Try adjusting your search criteria or filters to find the rooms you\'re looking for.'
                        }
                      </p>
                      {myRooms.length === 0 && (
                        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
                          <Link href="/rooms/create">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Room
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedRooms.map((room) => (
                      <Card key={room.id} className="bg-white border-gray-200 hover:shadow-lg transition-all duration-200 group">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                {room.title}
                              </CardTitle>
                              <CardDescription className="text-gray-600 line-clamp-2 mt-1">
                                {room.description || 'No description provided'}
                              </CardDescription>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-3">
                              <Badge className={getStatusColor(room.status)} variant="outline">
                                {room.status}
                              </Badge>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => router.push(`/rooms/${room.id}/manage`)}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Manage Room
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => copyToClipboard(room.code)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Room Code
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => copyToClipboard(`${window.location.origin}/rooms/join?code=${room.code}`)}>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Copy Share Link
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {room.status === 'waiting' && (
                                    <DropdownMenuItem 
                                      onClick={() => handleRoomAction(room.id, 'start')}
                                      className="text-green-600"
                                    >
                                      <Play className="h-4 w-4 mr-2" />
                                      Start Room
                                    </DropdownMenuItem>
                                  )}
                                  {room.status === 'active' && (
                                    <DropdownMenuItem onClick={() => router.push(`/rooms/${room.id}/live`)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Live
                                    </DropdownMenuItem>
                                  )}
                                  {room.status === 'completed' && (
                                    <DropdownMenuItem onClick={() => router.push(`/rooms/${room.id}/results`)}>
                                      <BarChart3 className="h-4 w-4 mr-2" />
                                      View Results
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleRoomAction(room.id, 'delete')}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Room
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Room Code</span>
                            <code className="bg-gray-100 px-2 py-1 rounded text-indigo-600 font-mono font-semibold">
                              {room.code}
                            </code>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{room.currentParticipants}/{room.maxParticipants}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{room.timeLimit}m</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              <span>{room.statistics.totalQuestions} Q</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-gray-700 border-gray-300 text-xs">
                              {room.category}
                            </Badge>
                            <Badge className={getDifficultyColor(room.difficulty)} variant="outline">
                              {room.difficulty}
                            </Badge>
                            {room.isPublic && (
                              <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                                Public
                              </Badge>
                            )}
                          </div>

                          <div className="text-xs text-gray-500">
                            Created {formatRelativeTime(room.createdAt)}
                          </div>

                          {room.scheduledStartTime && room.status === 'waiting' && (
                            <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 rounded p-2">
                              <Calendar className="h-3 w-3" />
                              <span>Scheduled: {formatDate(room.scheduledStartTime)}</span>
                            </div>
                          )}

                          {room.status === 'completed' && room.statistics && (
                            <div className="bg-purple-50 rounded p-2 text-xs">
                              <div className="grid grid-cols-2 gap-2 text-purple-700">
                                <span>Avg Score: {room.statistics.averageScore}%</span>
                                <span>Completion: {room.statistics.completionRate}%</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white justify-start">
                    <Link href="/rooms/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Room
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full border-gray-300 justify-start">
                    <Link href="/rooms/join">
                      <Users className="h-4 w-4 mr-2" />
                      Join Room
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full border-gray-300 justify-start">
                    <Link href="/questions/bank">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Question Bank
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                  ) : (
                    recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium">{activity.action}</p>
                          <p className="text-gray-500">{activity.roomTitle}</p>
                          <p className="text-gray-400 text-xs">{formatRelativeTime(activity.timestamp)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Performance Overview */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Success Rate</span>
                      <span className="text-sm font-semibold text-gray-900">{stats.averageScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${stats.averageScore}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Room Completion</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {stats.totalRoomsCreated > 0 ? Math.round((stats.completedRooms / stats.totalRoomsCreated) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${stats.totalRoomsCreated > 0 ? (stats.completedRooms / stats.totalRoomsCreated) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">{stats.totalParticipants}</div>
                      <div className="text-xs text-gray-500">Total Participants</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}