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
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  Copy, Share2, Play, Settings, Users, BarChart3, 
  Edit, Trash2, Calendar, Clock, AlertTriangle, CheckCircle2,
  ClipboardCopy, Send, Plus, X, Eye, Search, BookOpen
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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

interface Question {
  id: string
  title: string
  content: string
  options: string[]
  correctAnswer: number
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  explanation?: string
  timeLimit?: number
  points?: number
  tags?: string[]
  creatorName: string
  isPublic: boolean
  usage: number
  createdAt: string
  canEdit: boolean
}

interface RoomQuestion {
  id: string
  title: string
  content: string
  options: string[]
  correctAnswer: number
  difficulty: string
  category: string
  explanation?: string
  timeLimit: number
  points: number
  order: number
  isRequired: boolean
}

const CATEGORIES = [
  'Programming', 'Web Development', 'Database', 'Algorithms', 
  'System Design', 'DevOps', 'Mobile Development', 'AI/ML', 
  'Cybersecurity', 'General Knowledge'
]

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

  // Questions state
  const [roomQuestions, setRoomQuestions] = useState<RoomQuestion[]>([])
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [questionsLoading, setQuestionsLoading] = useState(false)

  // New question form
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    category: '',
    explanation: '',
    timeLimit: 30,
    points: 1,
    isPublic: false
  })

  // Form state for room updates
  const [roomFormData, setRoomFormData] = useState({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  useEffect(() => {
    if (room) {
      setRoomFormData({
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

  useEffect(() => {
    if (activeTab === 'questions') {
      fetchRoomQuestions()
      fetchAvailableQuestions()
    }
  }, [activeTab, searchQuery, categoryFilter, difficultyFilter, typeFilter])

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

  const fetchRoomQuestions = async () => {
    setQuestionsLoading(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}/questions`)
      const data = await response.json()
      if (data.success) {
        setRoomQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Failed to fetch room questions:', error)
    } finally {
      setQuestionsLoading(false)
    }
  }

  const fetchAvailableQuestions = async () => {
    try {
      const params = new URLSearchParams({
        type: typeFilter,
        page: '1',
        limit: '50',
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(difficultyFilter && { difficulty: difficultyFilter }),
      })

      const response = await fetch(`/api/questions?${params}`)
      const data = await response.json()

      if (data.success) {
        const roomQuestionIds = roomQuestions.map(q => q.id)
        const filtered = data.questions.filter((q: Question) => !roomQuestionIds.includes(q.id))
        setAvailableQuestions(filtered)
      }
    } catch (error) {
      console.error('Failed to fetch available questions:', error)
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
        body: JSON.stringify(roomFormData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update room')
      }

      alert('Room updated successfully!')
      await fetchRoom()
    } catch (error) {
      console.error('Update room error:', error)
      alert(error instanceof Error ? error.message : 'Failed to update room')
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteRoom = async () => {
    if (!room) return

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete room')
      }

      alert('Room deleted successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Delete room error:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete room')
    }
  }

  const startRoom = async () => {
    if (!room) return

    // Check if room has questions
    if (roomQuestions.length === 0) {
      alert('Cannot start room without questions. Please add questions first.')
      setActiveTab('questions')
      return
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}/start`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start room')
      }

      alert('Room started successfully!')
      router.push(`/rooms/${roomId}/live`)
    } catch (error) {
      console.error('Start room error:', error)
      alert(error instanceof Error ? error.message : 'Failed to start room')
    }
  }

  const handleAddQuestions = async () => {
    if (selectedQuestions.length === 0 || room?.status !== 'waiting') return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIds: selectedQuestions,
          replaceAll: false
        }),
      })

      if (response.ok) {
        setSelectedQuestions([])
        await Promise.all([
          fetchRoomQuestions(),
          fetchAvailableQuestions(),
          fetchRoom()
        ])
        alert('Questions added successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add questions')
      }
    } catch (error) {
      console.error('Add questions error:', error)
      alert('Failed to add questions')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveQuestion = async (questionId: string) => {
    if (room?.status !== 'waiting' || !confirm('Remove this question from the room?')) return

    try {
      const response = await fetch(`/api/rooms/${roomId}/questions?questionIds=${questionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await Promise.all([
          fetchRoomQuestions(),
          fetchAvailableQuestions(),
          fetchRoom()
        ])
        alert('Question removed successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to remove question')
      }
    } catch (error) {
      console.error('Remove question error:', error)
      alert('Failed to remove question')
    }
  }

  const handleCreateQuestion = async () => {
    if (!formData.title || !formData.content || formData.options.some(opt => !opt.trim())) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        setIsCreateDialogOpen(false)
        resetQuestionForm()
        
        // Add the new question to room
        await fetch(`/api/rooms/${roomId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionIds: [result.question.id],
            replaceAll: false
          }),
        })

        await Promise.all([
          fetchRoomQuestions(),
          fetchAvailableQuestions(),
          fetchRoom()
        ])
        alert('Question created and added to room!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create question')
      }
    } catch (error) {
      console.error('Create question error:', error)
      alert('Failed to create question')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetQuestionForm = () => {
    setFormData({
      title: '',
      content: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      difficulty: 'medium',
      category: '',
      explanation: '',
      timeLimit: 30,
      points: 1,
      isPublic: false
    })
  }

  const sendAlert = async () => {
    if (!alertMessage.trim()) {
      alert('Please enter an alert message')
      return
    }

    try {
      // For now, just simulate sending alert since we don't have the API endpoint
      alert('Alert functionality will be implemented with real-time features!')
      setAlertMessage('')
    } catch (error) {
      console.error('Send alert error:', error)
      alert('Failed to send alert')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy to clipboard')
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

  const updateQuestionFormField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateQuestionOption = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData(prev => ({ ...prev, options: newOptions }))
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
                  <p className="text-xl font-bold text-[#e0e0e0]">{roomQuestions.length}</p>
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
                          Manage Questions ({roomQuestions.length})
                        </Button>
                        <Button
                          onClick={startRoom}
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={roomQuestions.length === 0}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Room Now
                        </Button>
                        {roomQuestions.length === 0 && (
                          <p className="text-xs text-amber-400 text-center">
                            Add questions before starting the room
                          </p>
                        )}
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
                        value={roomFormData.title}
                        onChange={(e) => setRoomFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-[#e0e0e0]">Description</Label>
                      <Textarea
                        id="description"
                        value={roomFormData.description}
                        onChange={(e) => setRoomFormData(prev => ({ ...prev, description: e.target.value }))}
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
                          value={roomFormData.maxParticipants}
                          onChange={(e) => setRoomFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 2 }))}
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
                          value={roomFormData.timeLimit}
                          onChange={(e) => setRoomFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 5 }))}
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
                          checked={roomFormData.isPublic}
                          onCheckedChange={(checked) => setRoomFormData(prev => ({ ...prev, isPublic: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-[#e0e0e0]">Allow Late Join</Label>
                          <p className="text-sm text-gray-400">Participants can join after the quiz has started</p>
                        </div>
                        <Switch
                          checked={roomFormData.allowLateJoin}
                          onCheckedChange={(checked) => setRoomFormData(prev => ({ ...prev, allowLateJoin: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-[#e0e0e0]">Show Leaderboard</Label>
                          <p className="text-sm text-gray-400">Display live rankings to participants</p>
                        </div>
                        <Switch
                          checked={roomFormData.showLeaderboard}
                          onCheckedChange={(checked) => setRoomFormData(prev => ({ ...prev, showLeaderboard: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-[#e0e0e0]">Shuffle Questions</Label>
                          <p className="text-sm text-gray-400">Randomize question order for each participant</p>
                        </div>
                        <Switch
                          checked={roomFormData.shuffleQuestions}
                          onCheckedChange={(checked) => setRoomFormData(prev => ({ ...prev, shuffleQuestions: checked }))}
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
                          checked={roomFormData.settings.allowChat}
                          onCheckedChange={(checked) => setRoomFormData(prev => ({
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
                          checked={roomFormData.settings.showCorrectAnswers}
                          onCheckedChange={(checked) => setRoomFormData(prev => ({
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
                          checked={roomFormData.settings.instantFeedback}
                          onCheckedChange={(checked) => setRoomFormData(prev => ({
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
                          checked={roomFormData.settings.allowQuestionSkip}
                          onCheckedChange={(checked) => setRoomFormData(prev => ({
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
            <div className="space-y-6">
              <Tabs defaultValue="room-questions" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 bg-[#242b3d]">
                  <TabsTrigger value="room-questions" className="data-[state=active]:bg-[#b388ff]">
                    Room Questions ({roomQuestions.length})
                  </TabsTrigger>
                  <TabsTrigger value="add-questions" className="data-[state=active]:bg-[#b388ff]">
                    Add Questions
                  </TabsTrigger>
                </TabsList>

                {/* Room Questions Tab */}
                <TabsContent value="room-questions" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#e0e0e0]">Current Questions</h3>
                    {room.status === 'waiting' && (
                      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            className="bg-[#b388ff] hover:bg-[#9c5cff] text-white"
                            onClick={resetQuestionForm}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Question
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#242b3d] border-purple-500/20 max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-[#b388ff]">Create New Question</DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div>
                              <Label className="text-[#e0e0e0]">Question Title *</Label>
                              <Input
                                value={formData.title}
                                onChange={(e) => updateQuestionFormField('title', e.target.value)}
                                placeholder="Enter question title"
                                className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                              />
                            </div>

                            <div>
                              <Label className="text-[#e0e0e0]">Question Content *</Label>
                              <Textarea
                                value={formData.content}
                                onChange={(e) => updateQuestionFormField('content', e.target.value)}
                                placeholder="Enter the question content"
                                className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                                rows={3}
                              />
                            </div>

                            <div>
                              <Label className="text-[#e0e0e0]">Answer Options *</Label>
                              <RadioGroup 
                                value={formData.correctAnswer.toString()} 
                                onValueChange={(value) => updateQuestionFormField('correctAnswer', parseInt(value))}
                                className="space-y-2"
                              >
                                {formData.options.map((option, index) => (
                                  <div key={index} className="flex items-center space-x-2">
                                    <RadioGroupItem 
                                      value={index.toString()} 
                                      id={`option-${index}`}
                                      className="text-[#b388ff]"
                                    />
                                    <Input
                                      value={option}
                                      onChange={(e) => updateQuestionOption(index, e.target.value)}
                                      placeholder={`Option ${index + 1}`}
                                      className="flex-1 bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                                    />
                                    <Label htmlFor={`option-${index}`} className="text-xs text-gray-400">
                                      Correct
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-[#e0e0e0]">Category *</Label>
                                <select
                                  value={formData.category}
                                  onChange={(e) => updateQuestionFormField('category', e.target.value)}
                                  className="w-full px-3 py-2 bg-[#1a1f2e] border border-purple-500/20 rounded-md text-[#e0e0e0]"
                                >
                                  <option value="">Select category</option>
                                  {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <Label className="text-[#e0e0e0]">Difficulty</Label>
                                <select
                                  value={formData.difficulty}
                                  onChange={(e) => updateQuestionFormField('difficulty', e.target.value)}
                                  className="w-full px-3 py-2 bg-[#1a1f2e] border border-purple-500/20 rounded-md text-[#e0e0e0]"
                                >
                                  <option value="easy">Easy</option>
                                  <option value="medium">Medium</option>
                                  <option value="hard">Hard</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-[#e0e0e0]">Time Limit (seconds)</Label>
                                <Input
                                  type="number"
                                  value={formData.timeLimit}
                                  onChange={(e) => updateQuestionFormField('timeLimit', parseInt(e.target.value) || 30)}
                                  className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                                />
                              </div>

                              <div>
                                <Label className="text-[#e0e0e0]">Points</Label>
                                <Input
                                  type="number"
                                  value={formData.points}
                                  onChange={(e) => updateQuestionFormField('points', parseInt(e.target.value) || 1)}
                                  className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-[#e0e0e0]">Explanation (Optional)</Label>
                              <Textarea
                                value={formData.explanation}
                                onChange={(e) => updateQuestionFormField('explanation', e.target.value)}
                                placeholder="Explain why this is the correct answer"
                                className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                                rows={2}
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="isPublic"
                                checked={formData.isPublic}
                                onChange={(e) => updateQuestionFormField('isPublic', e.target.checked)}
                                className="rounded border-purple-500/20"
                              />
                              <Label htmlFor="isPublic" className="text-[#e0e0e0]">
                                Make this question public
                              </Label>
                            </div>

                            <div className="flex gap-3 pt-4">
                              <Button
                                onClick={handleCreateQuestion}
                                disabled={isSubmitting}
                                className="flex-1 bg-[#b388ff] hover:bg-[#9c5cff] text-white"
                              >
                                {isSubmitting ? 'Creating...' : 'Create & Add to Room'}
                              </Button>
                              <Button
                                onClick={() => setIsCreateDialogOpen(false)}
                                variant="outline"
                                className="border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {questionsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b388ff] mx-auto mb-4"></div>
                      <p className="text-gray-400">Loading questions...</p>
                    </div>
                  ) : roomQuestions.length === 0 ? (
                    <Card className="bg-[#242b3d] border-purple-500/20">
                      <CardContent className="py-8 text-center">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400 opacity-50" />
                        <h3 className="text-lg font-medium text-[#e0e0e0] mb-2">No questions added yet</h3>
                        <p className="text-gray-400 mb-4">Add questions from your question bank or create new ones</p>
                        {room.status === 'waiting' && (
                          <div className="flex gap-3 justify-center">
                            <Button
                              onClick={() => setIsCreateDialogOpen(true)}
                              className="bg-[#b388ff] hover:bg-[#9c5cff]"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Create Question
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {roomQuestions.map((question, index) => (
                        <Card key={question.id} className="bg-[#242b3d] border-purple-500/20">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="bg-[#b388ff] text-white px-2 py-1 rounded text-sm font-medium">
                                    {index + 1}
                                  </span>
                                  <h4 className="font-medium text-[#e0e0e0]">{question.title}</h4>
                                </div>
                                <p className="text-gray-400 text-sm mb-3">{question.content}</p>
                                <div className="flex items-center gap-4">
                                  <Badge className={getDifficultyColor(question.difficulty)}>
                                    {question.difficulty}
                                  </Badge>
                                  <Badge variant="outline" className="text-[#e0e0e0] border-gray-500/30">
                                    {question.category}
                                  </Badge>
                                  <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Clock className="h-3 w-3" />
                                    {question.timeLimit}s
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <BookOpen className="h-3 w-3" />
                                    {question.points}pts
                                  </div>
                                </div>
                              </div>
                              {room.status === 'waiting' && (
                                <Button
                                  onClick={() => handleRemoveQuestion(question.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Add Questions Tab */}
                <TabsContent value="add-questions" className="space-y-4">
                  {room.status !== 'waiting' ? (
                    <Card className="bg-[#242b3d] border-amber-500/20">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 text-amber-400">
                          <AlertTriangle className="h-6 w-6" />
                          <div>
                            <h3 className="font-semibold">Questions Locked</h3>
                            <p className="text-sm">Questions cannot be modified after the quiz has started.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-[#e0e0e0]">Available Questions</h3>
                        {selectedQuestions.length > 0 && (
                          <Button
                            onClick={handleAddQuestions}
                            disabled={isSubmitting}
                            className="bg-[#b388ff] hover:bg-[#9c5cff] text-white"
                          >
                            {isSubmitting ? 'Adding...' : `Add ${selectedQuestions.length} Questions`}
                          </Button>
                        )}
                      </div>

                      {/* Search and Filters */}
                      <Card className="bg-[#242b3d] border-purple-500/20">
                        <CardContent className="p-4">
                          <div className="flex flex-col lg:flex-row gap-4">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Search questions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-3 py-2 bg-[#1a1f2e] border border-purple-500/20 rounded-md text-[#e0e0e0] text-sm"
                              >
                                <option value="all">All Questions</option>
                                <option value="my">My Questions</option>
                                <option value="public">Public Questions</option>
                              </select>

                              <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-3 py-2 bg-[#1a1f2e] border border-purple-500/20 rounded-md text-[#e0e0e0] text-sm"
                              >
                                <option value="">All Categories</option>
                                {CATEGORIES.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>

                              <select
                                value={difficultyFilter}
                                onChange={(e) => setDifficultyFilter(e.target.value)}
                                className="px-3 py-2 bg-[#1a1f2e] border border-purple-500/20 rounded-md text-[#e0e0e0] text-sm"
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

                      {/* Questions List */}
                      {availableQuestions.length === 0 ? (
                        <Card className="bg-[#242b3d] border-purple-500/20">
                          <CardContent className="py-8 text-center">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400 opacity-50" />
                            <h3 className="text-lg font-medium text-[#e0e0e0] mb-2">No questions found</h3>
                            <p className="text-gray-400">Try adjusting your filters or create new questions</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {availableQuestions.map((question) => (
                            <Card 
                              key={question.id} 
                              className={`bg-[#242b3d] border-purple-500/20 cursor-pointer transition-colors ${
                                selectedQuestions.includes(question.id) ? 'ring-2 ring-[#b388ff]' : 'hover:border-purple-500/40'
                              }`}
                              onClick={() => {
                                setSelectedQuestions(prev => 
                                  prev.includes(question.id) 
                                    ? prev.filter(id => id !== question.id)
                                    : [...prev, question.id]
                                )
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                        selectedQuestions.includes(question.id)
                                          ? 'bg-[#b388ff] border-[#b388ff] text-white'
                                          : 'border-gray-500'
                                      }`}>
                                        {selectedQuestions.includes(question.id) && <CheckCircle2 className="h-4 w-4" />}
                                      </div>
                                      <h4 className="font-medium text-[#e0e0e0]">{question.title}</h4>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-3 ml-9">{question.content}</p>
                                    <div className="flex items-center gap-4 ml-9">
                                      <Badge className={getDifficultyColor(question.difficulty)}>
                                        {question.difficulty}
                                      </Badge>
                                      <Badge variant="outline" className="text-[#e0e0e0] border-gray-500/30">
                                        {question.category}
                                      </Badge>
                                      <span className="text-xs text-gray-400">By {question.creatorName}</span>
                                      <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <Clock className="h-3 w-3" />
                                        {question.timeLimit || 30}s
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-[#b388ff]">Room Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {room.status === 'completed' ? (
                  <div className="space-y-6">
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
                    
                    <div className="text-center">
                      <Button
                        onClick={() => router.push(`/rooms/${roomId}/results`)}
                        className="bg-[#b388ff] hover:bg-[#9c5cff]"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Detailed Results
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Analytics available after quiz completion</h3>
                    <p>Detailed analytics will be shown here once the quiz is completed</p>
                  </div>
                )}
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
                  Are you sure you want to delete this room? This action cannot be undone and will remove all associated data.
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
                      deleteRoom()
                    }}
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