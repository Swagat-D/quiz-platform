/* eslint-disable react-hooks/exhaustive-deps */
// app/rooms/[roomId]/quiz/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/navbar'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Clock, CheckCircle2, XCircle, ArrowLeft, ArrowRight, 
  Flag, Users, Target, AlertCircle
} from 'lucide-react'

interface Question {
  id: string
  questionNumber: number
  title: string
  content: string
  options: string[]
  timeLimit: number
  points: number
  difficulty: string
  category: string
  selectedAnswer: number | null
  answeredAt: string | null
  timeSpent: number | null
  isCorrect: boolean | null
}

interface Room {
  id: string
  code: string
  title: string
  status: string
  timeLimit: number
  showLeaderboard: boolean
  settings: {
    allowChat: boolean
    allowQuestionSkip: boolean
    showCorrectAnswers: boolean
    instantFeedback: boolean
  }
}

interface QuizProgress {
  answered: number
  total: number
  percentage: number
}

export default function QuizParticipationPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const roomId = params?.roomId as string

  const [room, setRoom] = useState<Room | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [progress, setProgress] = useState<QuizProgress>({ answered: 0, total: 0, percentage: 0 })
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{
    isCorrect?: boolean
    points?: number
    correctAnswer?: number
    explanation?: string
  } | null>(null)

  const currentQuestion = questions[currentQuestionIndex]

  // Fetch quiz data
  const fetchQuizData = useCallback(async () => {
    if (!roomId) return

    setIsLoading(true)
    try {
      const participantId = session?.user?.id || localStorage.getItem('guestParticipantId')
      const response = await fetch(`/api/rooms/${roomId}/quiz?participantId=${participantId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load quiz')
      }

      setRoom(data.room)
      setQuestions(data.questions)
      setProgress(data.progress)
      setTimeRemaining(data.timeRemaining)

      // Set current question based on progress
      const unanswered = data.questions.findIndex((q: Question) => q.selectedAnswer === null)
      if (unanswered !== -1) {
        setCurrentQuestionIndex(unanswered)
      }

    } catch (error) {
      console.error('Failed to load quiz:', error)
      alert('Failed to load quiz. Please try again.')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [roomId, session, router])

  useEffect(() => {
    fetchQuizData()
  }, [fetchQuizData])

  // Question timer
  useEffect(() => {
    if (currentQuestion && !currentQuestion.selectedAnswer) {
      setQuestionTimeLeft(currentQuestion.timeLimit)
      setSelectedAnswer(null)
      setFeedback(null)

      const timer = setInterval(() => {
        setQuestionTimeLeft(prev => {
          if (prev <= 1) {
            // Auto-submit when time runs out
            handleSubmitAnswer(-1) // -1 indicates no selection
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [currentQuestionIndex, currentQuestion])

  // Overall quiz timer
  useEffect(() => {
    if (timeRemaining) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (!prev || prev <= 1000) {
            // Quiz time expired
            handleQuizComplete()
            return 0
          }
          return prev - 1000
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [timeRemaining])

  const handleAnswerSelect = (answerIndex: number) => {
    if (currentQuestion?.selectedAnswer !== null || isSubmitting) return
    setSelectedAnswer(answerIndex)
  }

  const handleSubmitAnswer = async (answerIndex: number = selectedAnswer!) => {
    if (isSubmitting || !currentQuestion) return

    setIsSubmitting(true)
    try {
      const timeSpent = currentQuestion.timeLimit - questionTimeLeft
      const participantId = session?.user?.id || localStorage.getItem('guestParticipantId')

      const response = await fetch(`/api/rooms/${roomId}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedAnswer: answerIndex >= 0 ? answerIndex : null,
          timeSpent,
          participantId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit answer')
      }

      // Update question with submitted answer
      const updatedQuestions = [...questions]
      updatedQuestions[currentQuestionIndex] = {
        ...currentQuestion,
        selectedAnswer: answerIndex >= 0 ? answerIndex : null,
        answeredAt: new Date().toISOString(),
        timeSpent,
        isCorrect: data.isCorrect
      }
      setQuestions(updatedQuestions)

      // Update progress
      const answered = updatedQuestions.filter(q => q.selectedAnswer !== null).length
      setProgress({
        answered,
        total: questions.length,
        percentage: Math.round((answered / questions.length) * 100)
      })

      // Show feedback if enabled
      if (room?.settings?.instantFeedback || room?.settings?.showCorrectAnswers) {
        setFeedback({
          isCorrect: data.isCorrect,
          points: data.points,
          correctAnswer: data.correctAnswer,
          explanation: data.explanation
        })
      }

      // Auto-advance after feedback or immediately
      setTimeout(() => {
        handleNextQuestion()
      }, feedback ? 3000 : 1000)

    } catch (error) {
      console.error('Submit answer error:', error)
      alert('Failed to submit answer. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      handleQuizComplete()
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      if (currentQuestion?.selectedAnswer !== null) {
        setSelectedAnswer(currentQuestion.selectedAnswer)
      }
    }
  }

  const handleQuizComplete = () => {
    router.push(`/rooms/${roomId}/results`)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimeRemaining = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getAnswerButtonClass = (index: number) => {
    if (currentQuestion?.selectedAnswer !== null) {
      // Question already answered - show results
      if (feedback?.correctAnswer === index) {
        return 'bg-green-500/20 text-green-400 border-green-500'
      }
      if (currentQuestion.selectedAnswer === index && feedback?.correctAnswer !== index) {
        return 'bg-red-500/20 text-red-400 border-red-500'
      }
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }

    // Question not answered yet
    if (selectedAnswer === index) {
      return 'bg-[#b388ff]/20 text-[#b388ff] border-[#b388ff]'
    }
    return 'bg-[#242b3d] text-[#e0e0e0] border-purple-500/20 hover:bg-purple-500/10'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b388ff] mx-auto mb-4"></div>
          <div className="text-[#e0e0e0] text-lg">Loading quiz...</div>
        </div>
      </div>
    )
  }

  if (!room || !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex justify-center items-center">
        <Card className="bg-[#242b3d] border-red-500/20 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#e0e0e0] mb-2">Quiz Not Available</h3>
            <p className="text-gray-400 mb-4">This quiz is no longer available or has ended.</p>
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
      
      {/* Quiz Header */}
      <div className="bg-[#242b3d] border-b border-purple-500/20 sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#b388ff]">{room.title}</h1>
              <p className="text-gray-400">Question {currentQuestion.questionNumber} of {questions.length}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Question Timer */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span className={`font-mono text-lg ${questionTimeLeft <= 10 ? 'text-red-400' : 'text-[#e0e0e0]'}`}>
                  {formatTime(questionTimeLeft)}
                </span>
              </div>
              
              {/* Overall Timer */}
              {timeRemaining && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-400" />
                  <span className="font-mono text-sm text-[#e0e0e0]">
                    {formatTimeRemaining(timeRemaining)}
                  </span>
                </div>
              )}
              
              {/* Progress */}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-400" />
                <span className="text-sm text-[#e0e0e0]">
                  {progress.answered}/{progress.total}
                </span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progress.percentage} className="h-2" />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Question Card */}
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-[#e0e0e0]">
                    {currentQuestion.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {currentQuestion.category}
                    </Badge>
                    <Badge className={
                      currentQuestion.difficulty === 'easy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      currentQuestion.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-red-500/20 text-red-400 border-red-500/30'
                    }>
                      {currentQuestion.difficulty}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-lg text-[#e0e0e0] leading-relaxed">
                  {currentQuestion.content}
                </div>
                
                {/* Answer Options */}
                <div className="grid gap-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={currentQuestion.selectedAnswer !== null || isSubmitting}
                      className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${getAnswerButtonClass(index)}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-current/10 flex items-center justify-center font-semibold">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="flex-1">{option}</span>
                        {currentQuestion.selectedAnswer === index && (
                          <CheckCircle2 className="h-5 w-5" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Feedback */}
                {feedback && (
                  <div className={`p-4 rounded-lg border ${
                    feedback.isCorrect 
                      ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {feedback.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                      <span className="font-semibold">
                        {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
                      </span>
                      {feedback.points !== undefined && (
                        <span className="ml-auto">+{feedback.points} points</span>
                      )}
                    </div>
                    {feedback.explanation && (
                      <p className="text-sm opacity-90">{feedback.explanation}</p>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                {currentQuestion.selectedAnswer === null && selectedAnswer !== null && (
                  <Button
                    onClick={() => handleSubmitAnswer()}
                    disabled={isSubmitting}
                    className="w-full bg-[#b388ff] hover:bg-[#9c5cff] text-white py-3"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <Button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
                variant="outline"
                className="border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Question Navigation */}
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-[#b388ff]">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((question, index) => (
                    <button
                      key={question.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`aspect-square rounded text-sm font-semibold transition-colors ${
                        index === currentQuestionIndex
                          ? 'bg-[#b388ff] text-white'
                          : question.selectedAnswer !== null
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-[#1a1f2e] text-gray-400 hover:bg-purple-500/10'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quiz Info */}
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-[#b388ff]">Quiz Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-[#e0e0e0]">{progress.percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Points</span>
                  <span className="text-[#e0e0e0]">{currentQuestion.points}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time Limit</span>
                  <span className="text-[#e0e0e0]">{currentQuestion.timeLimit}s</span>
                </div>
              </CardContent>
            </Card>

            {/* Finish Quiz Button */}
            <Button
              onClick={handleQuizComplete}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Flag className="h-4 w-4 mr-2" />
              Finish Quiz
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}