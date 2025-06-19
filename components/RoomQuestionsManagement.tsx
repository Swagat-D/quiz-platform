/* eslint-disable react-hooks/exhaustive-deps */
// components/RoomQuestionsManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, Search, BookOpen, Trash2, Edit, CheckCircle2, 
  Clock, Target, Zap, AlertTriangle, ArrowUp, ArrowDown,
   Eye, RefreshCw
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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

interface RoomQuestionsManagementProps {
  roomId: string
  roomStatus: string
  onQuestionsUpdate: () => void
}

const CATEGORIES = [
  'Programming', 'Web Development', 'Database', 'Algorithms', 
  'System Design', 'DevOps', 'Mobile Development', 'AI/ML', 
  'Cybersecurity', 'General Knowledge'
]

export default function RoomQuestionsManagement({ 
  roomId, 
  roomStatus, 
  onQuestionsUpdate 
}: RoomQuestionsManagementProps) {
  const [roomQuestions, setRoomQuestions] = useState<RoomQuestion[]>([])
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<RoomQuestion | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [availableLoading, setAvailableLoading] = useState(false)

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

  useEffect(() => {
    fetchRoomQuestions()
  }, [roomId])

  useEffect(() => {
    fetchAvailableQuestions()
  }, [searchQuery, categoryFilter, difficultyFilter, typeFilter, roomQuestions])

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
    setAvailableLoading(true)
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
        // Filter out questions already in room
        const roomQuestionIds = roomQuestions.map(q => q.id)
        const filtered = data.questions.filter((q: Question) => !roomQuestionIds.includes(q.id))
        setAvailableQuestions(filtered)
      }
    } catch (error) {
      console.error('Failed to fetch available questions:', error)
    } finally {
      setAvailableLoading(false)
    }
  }

  const handleAddQuestions = async () => {
    if (selectedQuestions.length === 0 || roomStatus !== 'waiting') return

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
        await fetchRoomQuestions()
        await fetchAvailableQuestions()
        onQuestionsUpdate()
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
    if (roomStatus !== 'waiting' || !confirm('Remove this question from the room?')) return

    try {
      const response = await fetch(`/api/rooms/${roomId}/questions?questionIds=${questionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchRoomQuestions()
        await fetchAvailableQuestions()
        onQuestionsUpdate()
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
        
        // Add the new question to room immediately
        await fetch(`/api/rooms/${roomId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionIds: [result.question.id],
            replaceAll: false
          }),
        })

        await fetchRoomQuestions()
        await fetchAvailableQuestions()
        onQuestionsUpdate()
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

  const handleUpdateQuestionOrder = async (questionId: string, direction: 'up' | 'down') => {
    const currentIndex = roomQuestions.findIndex(q => q.id === questionId)
    if (currentIndex === -1) return
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= roomQuestions.length) return

    const reorderedQuestions = [...roomQuestions]
    const [movedQuestion] = reorderedQuestions.splice(currentIndex, 1)
    reorderedQuestions.splice(newIndex, 0, movedQuestion)

    // Update order numbers
    const questionsWithNewOrder = reorderedQuestions.map((q, index) => ({
      questionId: q.id,
      order: index + 1,
      timeLimit: q.timeLimit,
      points: q.points
    }))

    try {
      const response = await fetch(`/api/rooms/${roomId}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: questionsWithNewOrder }),
      })

      if (response.ok) {
        await fetchRoomQuestions()
      } else {
        alert('Failed to update question order')
      }
    } catch (error) {
      console.error('Update order error:', error)
      alert('Failed to update question order')
    }
  }

  const handleSelectQuestion = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  const handleSelectAll = () => {
    if (selectedQuestions.length === availableQuestions.length) {
      setSelectedQuestions([])
    } else {
      setSelectedQuestions(availableQuestions.map(q => q.id))
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
    setEditingQuestion(null)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateFormField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData(prev => ({ ...prev, options: newOptions }))
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const isRoomLocked = roomStatus === 'active' || roomStatus === 'completed'

  return (
    <div className="space-y-6">
      {isRoomLocked && (
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
      )}

      <Tabs defaultValue="room-questions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-[#242b3d]">
          <TabsTrigger value="room-questions" className="data-[state=active]:bg-[#b388ff]">
            Room Questions ({roomQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="add-questions" className="data-[state=active]:bg-[#b388ff]">
            Add Questions
          </TabsTrigger>
        </TabsList>

        {/* Room Questions Tab */}
        <TabsContent value="room-questions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#e0e0e0]">Current Questions</h3>
            {!isRoomLocked && (
              <div className="flex gap-3">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-[#b388ff] hover:bg-[#9c5cff] text-white"
                      onClick={resetQuestionForm}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#242b3d] border-purple-500/20 max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-[#b388ff]">
                        {editingQuestion ? 'Edit Question' : 'Create New Question for Room'}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      <div>
                        <Label className="text-[#e0e0e0]">Question Title *</Label>
                        <Input
                          value={formData.title}
                          onChange={(e) => updateFormField('title', e.target.value)}
                          placeholder="Enter question title"
                          className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-[#e0e0e0]">Question Content *</Label>
                        <Textarea
                          value={formData.content}
                          onChange={(e) => updateFormField('content', e.target.value)}
                          placeholder="Enter the question content"
                          className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label className="text-[#e0e0e0]">Answer Options *</Label>
                        <RadioGroup 
                          value={formData.correctAnswer.toString()} 
                          onValueChange={(value) => updateFormField('correctAnswer', parseInt(value))}
                          className="space-y-3 mt-2"
                        >
                          {formData.options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <RadioGroupItem 
                                value={index.toString()} 
                                id={`option-${index}`}
                                className="text-[#b388ff]"
                              />
                              <Input
                                value={option}
                                onChange={(e) => updateOption(index, e.target.value)}
                                placeholder={`Option ${index + 1}`}
                                className="flex-1 bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                              />
                              <Label htmlFor={`option-${index}`} className="text-xs text-gray-400 min-w-[60px]">
                                {index === formData.correctAnswer ? '✓ Correct' : 'Option'}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-[#e0e0e0]">Category *</Label>
                          <select
                            value={formData.category}
                            onChange={(e) => updateFormField('category', e.target.value)}
                            className="w-full px-3 py-2 bg-[#1a1f2e] border border-purple-500/20 rounded-md text-[#e0e0e0] mt-1"
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
                            onChange={(e) => updateFormField('difficulty', e.target.value)}
                            className="w-full px-3 py-2 bg-[#1a1f2e] border border-purple-500/20 rounded-md text-[#e0e0e0] mt-1"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-[#e0e0e0]">Time Limit (seconds)</Label>
                          <Input
                            type="number"
                            value={formData.timeLimit}
                            onChange={(e) => updateFormField('timeLimit', parseInt(e.target.value) || 30)}
                            className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-[#e0e0e0]">Points</Label>
                          <Input
                            type="number"
                            value={formData.points}
                            onChange={(e) => updateFormField('points', parseInt(e.target.value) || 1)}
                            className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-[#e0e0e0]">Explanation (Optional)</Label>
                        <Textarea
                          value={formData.explanation}
                          onChange={(e) => updateFormField('explanation', e.target.value)}
                          placeholder="Explain why this is the correct answer"
                          className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] mt-1"
                          rows={2}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isPublic"
                          checked={formData.isPublic}
                          onChange={(e) => updateFormField('isPublic', e.target.checked)}
                          className="rounded border-purple-500/20"
                        />
                        <Label htmlFor="isPublic" className="text-[#e0e0e0]">
                          Make this question public for others to use
                        </Label>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-gray-600">
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

                <Button
                  onClick={() => fetchRoomQuestions()}
                  variant="outline"
                  className="border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            )}
          </div>

          {questionsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b388ff] mx-auto mb-4"></div>
              <p className="text-gray-400">Loading questions...</p>
            </div>
          ) : roomQuestions.length === 0 ? (
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
                <h3 className="text-lg font-medium text-[#e0e0e0] mb-2">No questions added yet</h3>
                <p className="text-gray-400 mb-6">Add questions from your question bank or create new ones</p>
                {!isRoomLocked && (
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
            <div className="space-y-4">
              {roomQuestions.map((question, index) => (
                <Card key={question.id} className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-[#b388ff] text-white px-3 py-1 rounded-lg text-sm font-medium">
                            #{index + 1}
                          </span>
                          <h4 className="font-semibold text-[#e0e0e0] text-lg">{question.title}</h4>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">{question.content}</p>
                        
                        {/* Options Preview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                          {question.options.map((option, optIndex) => (
                            <div 
                              key={optIndex}
                              className={`p-2 rounded text-sm ${
                                optIndex === question.correctAnswer
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                  : 'bg-[#1a1f2e] text-gray-300'
                              }`}
                            >
                              <span className="font-medium mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                              {option}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 flex-wrap">
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
                            <Target className="h-3 w-3" />
                            {question.points} pts
                          </div>
                        </div>

                        {question.explanation && (
                          <div className="mt-3 p-3 bg-[#1a1f2e] rounded text-sm">
                            <span className="font-medium text-[#b388ff]">Explanation: </span>
                            <span className="text-gray-300">{question.explanation}</span>
                          </div>
                        )}
                      </div>

                      {!isRoomLocked && (
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            onClick={() => handleUpdateQuestionOrder(question.id, 'up')}
                            disabled={index === 0}
                            size="sm"
                            variant="outline"
                            className="border-purple-500/30 text-[#e0e0e0] h-8 w-8 p-0"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => handleUpdateQuestionOrder(question.id, 'down')}
                            disabled={index === roomQuestions.length - 1}
                            size="sm"
                            variant="outline"
                            className="border-purple-500/30 text-[#e0e0e0] h-8 w-8 p-0"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => handleRemoveQuestion(question.id)}
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Add Questions Tab */}
        <TabsContent value="add-questions" className="space-y-6">
          {isRoomLocked ? (
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
                <h3 className="text-xl font-semibold text-[#e0e0e0]">Available Questions</h3>
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                      />
                    </div>
                    
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

                  {/* Select All/Clear Selection */}
                  {availableQuestions.length > 0 && (
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-600">
                      <Button
                        onClick={handleSelectAll}
                        variant="outline"
                        size="sm"
                        className="border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10"
                      >
                        {selectedQuestions.length === availableQuestions.length ? 'Clear All' : 'Select All'}
                      </Button>
                      <span className="text-sm text-gray-400">
                        {selectedQuestions.length} of {availableQuestions.length} selected
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Available Questions List */}
              {availableLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b388ff] mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading available questions...</p>
                </div>
              ) : availableQuestions.length === 0 ? (
                <Card className="bg-[#242b3d] border-purple-500/20">
                  <CardContent className="py-12 text-center">
                    <Search className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
                    <h3 className="text-lg font-medium text-[#e0e0e0] mb-2">No questions found</h3>
                    <p className="text-gray-400 mb-6">
                      {searchQuery || categoryFilter || difficultyFilter 
                        ? 'Try adjusting your search filters or create a new question'
                        : 'No questions available to add. Create your first question!'
                      }
                    </p>
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-[#b388ff] hover:bg-[#9c5cff]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Question
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {availableQuestions.map((question) => (
                    <Card 
                      key={question.id} 
                      className={`bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 cursor-pointer ${
                        selectedQuestions.includes(question.id) ? 'ring-2 ring-[#b388ff] bg-[#b388ff]/5' : ''
                      }`}
                      onClick={() => handleSelectQuestion(question.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Selection Checkbox */}
                          <div className="flex items-center mt-1">
                            <input
                              type="checkbox"
                              checked={selectedQuestions.includes(question.id)}
                              onChange={() => handleSelectQuestion(question.id)}
                              className="h-4 w-4 text-[#b388ff] rounded border-purple-500/20 focus:ring-[#b388ff] focus:ring-2"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          {/* Question Content */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h4 className="font-semibold text-[#e0e0e0] text-lg">{question.title}</h4>
                              {question.isPublic && (
                                <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Public
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{question.content}</p>

                            {/* Quick Options Preview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                              {question.options.slice(0, 2).map((option, index) => (
                                <div 
                                  key={index}
                                  className={`p-2 rounded text-sm ${
                                    index === question.correctAnswer
                                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                      : 'bg-[#1a1f2e] text-gray-300'
                                  }`}
                                >
                                  <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                                  {option.length > 40 ? `${option.substring(0, 40)}...` : option}
                                </div>
                              ))}
                              {question.options.length > 2 && (
                                <div className="text-xs text-gray-500 col-span-full text-center mt-1">
                                  +{question.options.length - 2} more options
                                </div>
                              )}
                            </div>

                            {/* Question Metadata */}
                            <div className="flex items-center gap-4 flex-wrap">
                              <Badge className={getDifficultyColor(question.difficulty)}>
                                {question.difficulty}
                              </Badge>
                              <Badge variant="outline" className="text-[#e0e0e0] border-gray-500/30">
                                {question.category}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="h-3 w-3" />
                                {question.timeLimit || 30}s
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Target className="h-3 w-3" />
                                {question.points || 1} pts
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Zap className="h-3 w-3" />
                                Used {question.usage} times
                              </div>
                            </div>

                            {/* Creator Info */}
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Created by {question.creatorName} • {new Date(question.createdAt).toLocaleDateString()}
                              </span>
                              {question.explanation && (
                                <Badge variant="outline" className="text-purple-400 border-purple-500/30">
                                  Has Explanation
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10 h-8 w-8 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-[#242b3d] border-purple-500/20 max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle className="text-[#b388ff]">Question Preview</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold text-[#e0e0e0] mb-2">{question.title}</h4>
                                    <p className="text-gray-400">{question.content}</p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label className="text-[#e0e0e0]">Options:</Label>
                                    {question.options.map((option, index) => (
                                      <div 
                                        key={index}
                                        className={`p-3 rounded ${
                                          index === question.correctAnswer
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            : 'bg-[#1a1f2e] text-gray-300'
                                        }`}
                                      >
                                        <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                                        {option}
                                        {index === question.correctAnswer && (
                                          <CheckCircle2 className="h-4 w-4 inline ml-2" />
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  {question.explanation && (
                                    <div className="p-3 bg-[#1a1f2e] rounded">
                                      <span className="font-medium text-[#b388ff]">Explanation: </span>
                                      <span className="text-gray-300">{question.explanation}</span>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-4 pt-3 border-t border-gray-600">
                                    <Badge className={getDifficultyColor(question.difficulty)}>
                                      {question.difficulty}
                                    </Badge>
                                    <Badge variant="outline" className="text-[#e0e0e0] border-gray-500/30">
                                      {question.category}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                      <Clock className="h-3 w-3" />
                                      {question.timeLimit || 30}s
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                      <Target className="h-3 w-3" />
                                      {question.points || 1} pts
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {question.canEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Handle edit question
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Fixed Add Button */}
              {selectedQuestions.length > 0 && (
                <div className="sticky bottom-6 flex justify-center">
                  <Button
                    onClick={handleAddQuestions}
                    disabled={isSubmitting}
                    className="bg-[#b388ff] hover:bg-[#9c5cff] text-white shadow-lg px-8 py-3 text-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding Questions...
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        Add {selectedQuestions.length} Question{selectedQuestions.length > 1 ? 's' : ''} to Room
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}