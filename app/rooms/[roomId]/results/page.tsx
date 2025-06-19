// app/rooms/[roomId]/results/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/navbar'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Trophy, Medal, Award, TrendingUp, Users, Clock, Target,
  Download, Share2, Star, BarChart3, CheckCircle2,
  Calendar, BookOpen, Timer, ArrowLeft, Crown, Sparkles
} from 'lucide-react'

interface Participant {
  id: string
  userName: string
  email: string | null
  isAuthenticated: boolean
  score: number
  answeredQuestions: number
  totalQuestions: number
  timeSpent: number
  accuracy: number
  rank: number
  badges: string[]
}

interface QuestionResult {
  id: string
  title: string
  category: string
  difficulty: string
  correctRate: number
  averageTime: number
  totalAttempts: number
}

interface RoomResults {
  id: string
  code: string
  title: string
  description: string
  category: string
  difficulty: string
  status: string
  creatorName: string
  participants: Participant[]
  questionResults: QuestionResult[]
  statistics: {
    totalQuestions: number
    averageScore: number
    completionRate: number
    totalParticipants: number
    averageTime: number
    highestScore: number
    lowestScore: number
  }
  startedAt: string
  completedAt: string
  timeLimit: number
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const roomId = params?.roomId as string

  const [results, setResults] = useState<RoomResults | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userParticipant, setUserParticipant] = useState<Participant | null>(null)
  const [showThankYou, setShowThankYou] = useState(false)

  useEffect(() => {
    if (roomId) {
      fetchResults()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  const fetchResults = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}/results`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch results')
      }

      setResults(data.results)
      
      // Find current user's results
      const userId = session?.user?.id || localStorage.getItem('guestParticipantId')
      const participant = data.results.participants.find((p: Participant) => 
        p.id === userId || p.userName === localStorage.getItem('guestUserName')
      )
      setUserParticipant(participant || null)

      // Check if user just completed the quiz
      const justCompleted = localStorage.getItem('quizJustCompleted')
      if (justCompleted === roomId) {
        setShowThankYou(true)
        localStorage.removeItem('quizJustCompleted')
      }

    } catch (error) {
      console.error('Failed to fetch results:', error)
      alert('Failed to load results')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-400" />
      case 2: return <Medal className="h-6 w-6 text-gray-400" />
      case 3: return <Award className="h-6 w-6 text-amber-600" />
      default: return <span className="text-lg font-bold text-gray-400">#{rank}</span>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
      case 2: return 'bg-gradient-to-r from-gray-400 to-gray-600'
      case 3: return 'bg-gradient-to-r from-amber-500 to-amber-700'
      default: return 'bg-gradient-to-r from-purple-500 to-purple-700'
    }
  }

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { label: 'Exceptional', color: 'text-emerald-400', icon: Sparkles }
    if (score >= 80) return { label: 'Excellent', color: 'text-green-400', icon: Star }
    if (score >= 70) return { label: 'Good', color: 'text-blue-400', icon: TrendingUp }
    if (score >= 60) return { label: 'Fair', color: 'text-yellow-400', icon: Target }
    return { label: 'Needs Improvement', color: 'text-red-400', icon: Target }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    return `${minutes}m ${secs}s`
  }

  const downloadResults = () => {
    // Mock download functionality
    alert('Results download will be implemented')
  }

  const shareResults = () => {
    const shareText = `I just completed "${results?.title}" and scored ${userParticipant?.score}%! 🎉`
    if (navigator.share) {
      navigator.share({
        title: 'Quiz Results',
        text: shareText,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(shareText)
      alert('Results copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b388ff] mx-auto mb-4"></div>
          <div className="text-[#e0e0e0] text-lg">Loading results...</div>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex justify-center items-center">
        <Card className="bg-[#242b3d] border-red-500/20 max-w-md">
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#e0e0e0] mb-2">Results Not Available</h3>
            <p className="text-gray-400 mb-4">Quiz results are not yet available or you don&apos;t have access.</p>
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
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#242b3d] to-[#2a3042] border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{results.title} - Results</h1>
                <p className="text-gray-300 text-lg">{results.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span>Quiz completed</span>
                  <span>•</span>
                  <span>{results.participants.length} participants</span>
                  <span>•</span>
                  <span>{new Date(results.completedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button onClick={downloadResults} variant="outline" className="border-purple-500/30 text-[#e0e0e0]">
                <Download className="h-4 w-4 mr-2" />
                Download Results
              </Button>
              <Button onClick={shareResults} variant="outline" className="border-purple-500/30 text-[#e0e0e0]">
                <Share2 className="h-4 w-4 mr-2" />
                Share Results
              </Button>
              <Button onClick={() => router.push('/dashboard')} className="bg-[#b388ff] hover:bg-[#9c5cff]">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>

          {/* User Performance Card */}
          {userParticipant && (
            <div className="mt-8">
              <Card className="bg-gradient-to-r from-[#b388ff]/10 to-purple-600/10 border border-purple-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 ${getRankBadgeColor(userParticipant.rank)} rounded-full flex items-center justify-center`}>
                        {getRankIcon(userParticipant.rank)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Your Performance</h3>
                        <p className="text-gray-300">Congratulations on completing the quiz!</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-[#b388ff]">{userParticipant.score}%</div>
                      <div className={`text-sm ${getPerformanceLevel(userParticipant.score).color}`}>
                        {getPerformanceLevel(userParticipant.score).label}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">#{userParticipant.rank}</p>
                      <p className="text-sm text-gray-400">Your Rank</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{userParticipant.answeredQuestions}/{userParticipant.totalQuestions}</p>
                      <p className="text-sm text-gray-400">Questions Answered</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{userParticipant.accuracy}%</p>
                      <p className="text-sm text-gray-400">Accuracy</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{formatDuration(userParticipant.timeSpent)}</p>
                      <p className="text-sm text-gray-400">Time Spent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-[#242b3d] h-12">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#b388ff] data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-[#b388ff] data-[state=active]:text-white">
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="questions" className="data-[state=active]:bg-[#b388ff] data-[state=active]:text-white">
              Questions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#b388ff] data-[state=active]:text-white">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors duration-300">
                      <Users className="h-6 w-6 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">
                        {results.statistics.totalParticipants}
                      </p>
                      <p className="text-gray-400 text-sm">Total Participants</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors duration-300">
                      <TrendingUp className="h-6 w-6 text-green-400 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors duration-300">
                        {results.statistics.averageScore}%
                      </p>
                      <p className="text-gray-400 text-sm">Average Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors duration-300">
                      <Target className="h-6 w-6 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors duration-300">
                        {results.statistics.completionRate}%
                      </p>
                      <p className="text-gray-400 text-sm">Completion Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors duration-300">
                      <Timer className="h-6 w-6 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white group-hover:text-amber-400 transition-colors duration-300">
                        {formatDuration(results.statistics.averageTime)}
                      </p>
                      <p className="text-gray-400 text-sm">Average Time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quiz Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                <CardHeader>
                  <CardTitle className="text-xl text-[#b388ff] flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Quiz Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[#1a1f2e] rounded-lg hover:bg-[#1e2332] transition-colors duration-300">
                      <p className="text-gray-400 text-sm">Category</p>
                      <p className="text-[#e0e0e0] font-medium">{results.category}</p>
                    </div>
                    <div className="p-4 bg-[#1a1f2e] rounded-lg hover:bg-[#1e2332] transition-colors duration-300">
                      <p className="text-gray-400 text-sm">Difficulty</p>
                      <Badge className={`${
                        results.difficulty === 'easy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        results.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {results.difficulty}
                      </Badge>
                    </div>
                    <div className="p-4 bg-[#1a1f2e] rounded-lg hover:bg-[#1e2332] transition-colors duration-300">
                      <p className="text-gray-400 text-sm">Total Questions</p>
                      <p className="text-[#e0e0e0] font-medium">{results.statistics.totalQuestions}</p>
                    </div>
                    <div className="p-4 bg-[#1a1f2e] rounded-lg hover:bg-[#1e2332] transition-colors duration-300">
                      <p className="text-gray-400 text-sm">Time Limit</p>
                      <p className="text-[#e0e0e0] font-medium">{results.timeLimit} minutes</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-600 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Started</span>
                      <span className="text-[#e0e0e0] flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(results.startedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-400">Completed</span>
                      <span className="text-[#e0e0e0] flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        {new Date(results.completedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                <CardHeader>
                  <CardTitle className="text-xl text-[#b388ff] flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Highest Score</span>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-[#e0e0e0] font-bold">{results.statistics.highestScore}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Lowest Score</span>
                      <span className="text-[#e0e0e0]">{results.statistics.lowestScore}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Score Range</span>
                      <span className="text-[#e0e0e0]">
                        {results.statistics.highestScore - results.statistics.lowestScore} points
                      </span>
                    </div>
                  </div>
                  
                  {/* Performance Bars */}
                  <div className="space-y-3 pt-4 border-t border-gray-600">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">90-100% (Exceptional)</span>
                        <span className="text-emerald-400">
                          {results.participants.filter(p => p.score >= 90).length} participants
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${(results.participants.filter(p => p.score >= 90).length / results.participants.length) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">70-89% (Good)</span>
                        <span className="text-blue-400">
                          {results.participants.filter(p => p.score >= 70 && p.score < 90).length} participants
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out delay-200"
                          style={{ 
                            width: `${(results.participants.filter(p => p.score >= 70 && p.score < 90).length / results.participants.length) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Below 70%</span>
                        <span className="text-red-400">
                          {results.participants.filter(p => p.score < 70).length} participants
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-1000 ease-out delay-400"
                          style={{ 
                            width: `${(results.participants.filter(p => p.score < 70).length / results.participants.length) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-[#b388ff] flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Final Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.participants.map((participant, index) => (
                    <div 
                      key={participant.id} 
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                        participant.rank <= 3 
                          ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 hover:border-yellow-500/50' 
                          : userParticipant?.id === participant.id
                          ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30 hover:border-purple-500/50'
                          : 'bg-[#1a1f2e] border-gray-700 hover:border-purple-500/30'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${getRankBadgeColor(participant.rank)} rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                          {getRankIcon(participant.rank)}
                        </div>
                        <div>
                          <h4 className={`font-semibold text-lg ${
                            userParticipant?.id === participant.id ? 'text-[#b388ff]' : 'text-[#e0e0e0]'
                          } hover:text-[#b388ff] transition-colors duration-300`}>
                            {participant.userName}
                            {userParticipant?.id === participant.id && (
                              <Badge className="ml-2 bg-purple-500/20 text-purple-400 border-purple-500/30">You</Badge>
                            )}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>{participant.answeredQuestions}/{participant.totalQuestions} questions</span>
                            <span>•</span>
                            <span>{participant.accuracy}% accuracy</span>
                            <span>•</span>
                            <span>{formatDuration(participant.timeSpent)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-3xl font-bold transition-colors duration-300 ${
                          participant.rank === 1 ? 'text-yellow-400' :
                          participant.rank === 2 ? 'text-gray-400' :
                          participant.rank === 3 ? 'text-amber-600' :
                          'text-[#e0e0e0]'
                        }`}>
                          {participant.score}%
                        </div>
                        <div className={`text-sm ${getPerformanceLevel(participant.score).color}`}>
                          {getPerformanceLevel(participant.score).label}
                        </div>
                        {participant.badges && participant.badges.length > 0 && (
                          <div className="flex gap-1 mt-2 justify-end">
                            {participant.badges.map((badge, i) => (
                              <div key={i} className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                <Star className="h-3 w-3 text-yellow-400" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Analysis Tab */}
          <TabsContent value="questions" className="space-y-6">
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-[#b388ff] flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Question Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.questionResults.map((question, index) => (
                    <div 
                      key={question.id} 
                      className="p-4 bg-[#1a1f2e] rounded-lg border border-gray-700 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-[#e0e0e0] text-lg hover:text-[#b388ff] transition-colors duration-300">
                            {question.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[#e0e0e0] border-gray-500/30">
                              {question.category}
                            </Badge>
                            <Badge className={`${
                              question.difficulty === 'easy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                              question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                              'bg-red-500/20 text-red-400 border-red-500/30'
                            }`}>
                              {question.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            question.correctRate >= 80 ? 'text-green-400' :
                            question.correctRate >= 60 ? 'text-yellow-400' :
                            'text-red-400'
                          } transition-colors duration-300`}>
                            {question.correctRate}%
                          </div>
                          <p className="text-gray-400 text-sm">Success Rate</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center p-3 bg-[#242b3d] rounded-lg hover:bg-[#2a3042] transition-colors duration-300">
                          <p className="text-[#e0e0e0] font-semibold">{question.totalAttempts}</p>
                          <p className="text-gray-400">Attempts</p>
                        </div>
                        <div className="text-center p-3 bg-[#242b3d] rounded-lg hover:bg-[#2a3042] transition-colors duration-300">
                          <p className="text-[#e0e0e0] font-semibold">{formatDuration(question.averageTime)}</p>
                          <p className="text-gray-400">Avg Time</p>
                        </div>
                        <div className="text-center p-3 bg-[#242b3d] rounded-lg hover:bg-[#2a3042] transition-colors duration-300">
                          <p className={`font-semibold ${
                            question.correctRate >= 80 ? 'text-green-400' :
                            question.correctRate >= 60 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {question.correctRate >= 80 ? 'Easy' : 
                             question.correctRate >= 60 ? 'Medium' : 'Hard'}
                          </p>
                          <p className="text-gray-400">Difficulty</p>
                        </div>
                      </div>
                      
                      {/* Success Rate Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Success Rate</span>
                          <span className="text-[#e0e0e0]">{question.correctRate}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                              question.correctRate >= 80 ? 'bg-green-500' :
                              question.correctRate >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ 
                              width: `${question.correctRate}%`,
                              animationDelay: `${index * 200}ms`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                <CardHeader>
                  <CardTitle className="text-xl text-[#b388ff]">Time Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Clock className="h-16 w-16 mx-auto mb-4 text-[#b388ff] opacity-50" />
                      <p className="text-gray-400">Detailed time analytics will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                <CardHeader>
                  <CardTitle className="text-xl text-[#b388ff]">Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <BarChart3 className="h-16 w-16 mx-auto mb-4 text-[#b388ff] opacity-50" />
                      <p className="text-gray-400">Score distribution chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Thank You Modal */}
      {showThankYou && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#242b3d] to-[#2a3042] rounded-2xl p-8 max-w-md w-full border border-purple-500/20 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4 animate-in slide-in-from-bottom-2 duration-700 delay-200">
                Congratulations! 🎉
              </h3>
              <p className="text-gray-300 mb-6 animate-in slide-in-from-bottom-2 duration-700 delay-300">
                You&apos;ve successfully completed the quiz! How would you rate your experience?
              </p>
              
              {/* Rating Stars */}
              <div className="flex justify-center gap-2 mb-6 animate-in slide-in-from-bottom-2 duration-700 delay-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="p-2 hover:scale-125 transition-transform duration-200"
                    onClick={() => {
                      setShowThankYou(false)
                      alert(`Thank you for rating ${star} stars!`)
                    }}
                  >
                    <Star className="h-8 w-8 text-yellow-400 hover:text-yellow-300 fill-current hover:drop-shadow-lg transition-all duration-200" />
                  </button>
                ))}
              </div>
              
              <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-700 delay-500">
                <Button
                  onClick={() => setShowThankYou(false)}
                  className="w-full bg-gradient-to-r from-[#b388ff] to-purple-600 hover:from-[#9c5cff] hover:to-purple-700 text-white font-semibold py-3 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
                >
                  Continue to Results
                </Button>
                <Button
                  onClick={() => {
                    setShowThankYou(false)
                    shareResults()
                  }}
                  variant="outline"
                  className="w-full border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10 transition-all duration-300"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Results
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}