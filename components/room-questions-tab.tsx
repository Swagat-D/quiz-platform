/* eslint-disable react-hooks/exhaustive-deps */
// components/room-questions-tab.tsx
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
  Plus, Search, CheckCircle2, BookOpen,  Trash2, 
   Clock, Award
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

interface RoomQuestionsTabProps {
  roomId: string
  roomStatus: string
  onQuestionsChange: () => void
}

const CATEGORIES = [
  'Programming', 'Web Development', 'Database', 'Algorithms', 
  'System Design', 'DevOps', 'Mobile Development', 'AI/ML', 
  'Cybersecurity', 'General Knowledge'
]

export function RoomQuestionsTab({ roomId, roomStatus, onQuestionsChange }: RoomQuestionsTabProps) {
  const [roomQuestions, setRoomQuestions] = useState<RoomQuestion[]>([])
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const canEdit = roomStatus === 'waiting'

  useEffect(() => {
    fetchRoomQuestions()
    fetchAvailableQuestions()
  }, [roomId, searchQuery, categoryFilter, difficultyFilter, typeFilter])

  const fetchRoomQuestions = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/questions`)
      const data = await response.json()
      if (data.success) {
        setRoomQuestions(data.questions)
      }
    } catch (error) {
      console.error('Failed to fetch room questions:', error)
    }
  }

  const fetchAvailableQuestions = async () => {
    setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  const handleAddQuestions = async () => {
    if (selectedQuestions.length === 0 || !canEdit) return

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
        fetchRoomQuestions()
        fetchAvailableQuestions()
        onQuestionsChange()
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
    if (!canEdit || !confirm('Remove this question from the room?')) return

    try {
      const response = await fetch(`/api/rooms/${roomId}/questions?questionIds=${questionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchRoomQuestions()
        fetchAvailableQuestions()
        onQuestionsChange()
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
        resetForm()
        
        // Add the new question to room
        await fetch(`/api/rooms/${roomId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionIds: [result.question.id],
            replaceAll: false
          }),
        })

        fetchRoomQuestions()
        fetchAvailableQuestions()
        onQuestionsChange()
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

  const resetForm = () => {
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

  const updateFormField = (
    field: keyof typeof formData,
    value: string | number | boolean
  ) => {
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

  if (!canEdit) {
    return (
      <Card className="bg-[#242b3d] border-amber-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-amber-400">
            <BookOpen className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Questions Locked</h3>
              <p className="text-sm">Questions cannot be modified after the quiz has started.</p>
            </div>
          </div>
          
          {roomQuestions.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-medium text-[#e0e0e0]">Current Questions ({roomQuestions.length})</h4>
              {roomQuestions.map((question, index) => (
                <div key={question.id} className="bg-[#1a1f2e] p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[#e0e0e0] font-medium">{index + 1}. {question.title}</span>
                    <div className="flex items-center gap-2">
                      <Badge className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {question.timeLimit}s
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Award className="h-3 w-3" />
                        {question.points}pts
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
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
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-[#b388ff] hover:bg-[#9c5cff] text-white"
                  onClick={resetForm}
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
                      onChange={(e) => updateFormField('title', e.target.value)}
                      placeholder="Enter question title"
                      className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                    />
                  </div>

                  <div>
                    <Label className="text-[#e0e0e0]">Question Content *</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => updateFormField('content', e.target.value)}
                      placeholder="Enter the question content"
                      className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="text-[#e0e0e0]">Answer Options *</Label>
                    <RadioGroup 
                      value={formData.correctAnswer.toString()} 
                      onValueChange={(value) => updateFormField('correctAnswer', parseInt(value))}
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
                            onChange={(e) => updateOption(index, e.target.value)}
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
                        onChange={(e) => updateFormField('category', e.target.value)}
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
                        onChange={(e) => updateFormField('difficulty', e.target.value)}
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
                        onChange={(e) => updateFormField('timeLimit', parseInt(e.target.value) || 30)}
                        className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                      />
                    </div>

                    <div>
                      <Label className="text-[#e0e0e0]">Points</Label>
                      <Input
                        type="number"
                        value={formData.points}
                        onChange={(e) => updateFormField('points', parseInt(e.target.value) || 1)}
                        className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[#e0e0e0]">Explanation (Optional)</Label>
                    <Textarea
                      value={formData.explanation}
                      onChange={(e) => updateFormField('explanation', e.target.value)}
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
                      onChange={(e) => updateFormField('isPublic', e.target.checked)}
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
          </div>

          {roomQuestions.length === 0 ? (
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardContent className="py-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400 opacity-50" />
                <h3 className="text-lg font-medium text-[#e0e0e0] mb-2">No questions added yet</h3>
                <p className="text-gray-400 mb-4">Add questions from your question bank or create new ones</p>
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
                            <Award className="h-3 w-3" />
                            {question.points}pts
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRemoveQuestion(question.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Add Questions Tab */}
        <TabsContent value="add-questions" className="space-y-4">
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
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b388ff] mx-auto"></div>
            </div>
          ) : availableQuestions.length === 0 ? (
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
        </TabsContent>
      </Tabs>
    </div>
  )
}