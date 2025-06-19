/* eslint-disable @typescript-eslint/no-explicit-any */
// app/questions/bank/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/navbar'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  Plus, Search,  Edit, Trash2, BookOpen, 
   MoreVertical,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  updatedAt: string
  canEdit: boolean
}

interface QuestionFormData {
  title: string
  content: string
  options: string[]
  correctAnswer: number
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  explanation: string
  timeLimit: number
  points: number
  tags: string[]
  isPublic: boolean
}

const CATEGORIES = [
  'Programming',
  'Web Development',
  'Database',
  'Algorithms',
  'System Design',
  'DevOps',
  'Mobile Development',
  'AI/ML',
  'Cybersecurity',
  'General Knowledge'
]

export default function QuestionBankPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('my')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<QuestionFormData>({
    title: '',
    content: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    difficulty: 'medium',
    category: '',
    explanation: '',
    timeLimit: 30,
    points: 1,
    tags: [],
    isPublic: false
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchQuestions()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, searchQuery, categoryFilter, difficultyFilter, typeFilter])

  const fetchQuestions = async () => {
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
        setQuestions(data.questions)
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    } finally {
      setIsLoading(false)
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
      tags: [],
      isPublic: false
    })
    setEditingQuestion(null)
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.content || formData.options.some(opt => !opt.trim())) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const url = editingQuestion ? `/api/questions/${editingQuestion.id}` : '/api/questions'
      const method = editingQuestion ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsCreateDialogOpen(false)
        resetForm()
        fetchQuestions()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save question')
      }
    } catch (error) {
      console.error('Save question error:', error)
      alert('Failed to save question')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (question: Question) => {
    setFormData({
      title: question.title,
      content: question.content,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty,
      category: question.category,
      explanation: question.explanation || '',
      timeLimit: question.timeLimit || 30,
      points: question.points || 1,
      tags: question.tags || [],
      isPublic: question.isPublic
    })
    setEditingQuestion(question)
    setIsCreateDialogOpen(true)
  }

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchQuestions()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete question')
      }
    } catch (error) {
      console.error('Delete question error:', error)
      alert('Failed to delete question')
    }
  }

  const updateFormField = (field: keyof QuestionFormData, value: any) => {
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

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b388ff] mx-auto mb-4"></div>
          <div className="text-[#e0e0e0] text-lg">Loading questions...</div>
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
              <h1 className="text-3xl font-bold text-[#b388ff] mb-2">Question Bank</h1>
              <p className="text-[#e0e0e0]">Create and manage your quiz questions</p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-[#b388ff] hover:bg-[#9c5cff] text-white"
                  onClick={resetForm}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Question
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#242b3d] border-purple-500/20 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-[#b388ff]">
                    {editingQuestion ? 'Edit Question' : 'Create New Question'}
                  </DialogTitle>
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
                        onChange={(e) => updateFormField('difficulty', e.target.value as 'easy' | 'medium' | 'hard')}
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
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 bg-[#b388ff] hover:bg-[#9c5cff] text-white"
                    >
                      {isSubmitting ? 'Saving...' : (editingQuestion ? 'Update Question' : 'Create Question')}
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
        </div>

        {/* Filters */}
        <Card className="bg-[#242b3d] border-purple-500/20 mb-6">
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
                  <option value="my">My Questions</option>
                  <option value="public">Public Questions</option>
                  <option value="all">All Questions</option>
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

        {/* Questions Grid */}
        {questions.length === 0 ? (
          <Card className="bg-[#242b3d] border-purple-500/20">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
              <h3 className="text-lg font-medium text-[#e0e0e0] mb-2">No questions found</h3>
              <p className="text-gray-400 mb-6">
                {typeFilter === 'my' 
                  ? 'Create your first question to get started'
                  : 'No questions match your current filters'
                }
              </p>
              {typeFilter === 'my' && (
                <Button 
                  className="bg-[#b388ff] hover:bg-[#9c5cff] text-white"
                  onClick={() => {
                    resetForm()
                    setIsCreateDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Question
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {questions.map((question) => (
              <Card key={question.id} className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg text-[#e0e0e0] line-clamp-2">
                        {question.title}
                      </CardTitle>
                      <p className="text-gray-400 text-sm mt-1">By {question.creatorName}</p>
                    </div>
                    
                    {question.canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#242b3d] border-purple-500/20">
                          <DropdownMenuItem 
                            onClick={() => handleEdit(question)}
                            className="text-[#e0e0e0] hover:bg-purple-500/10"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(question.id)}
                            className="text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-[#e0e0e0] text-sm line-clamp-3">{question.content}</p>
                  
                  <div className="space-y-2">
                    {question.options.map((option, index) => (
                      <div 
                        key={index} 
                        className={`text-sm p-2 rounded ${
                          index === question.correctAnswer 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                            : 'bg-[#1a1f2e] text-gray-300'
                        }`}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                        {option}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[#e0e0e0] border-gray-500/30 text-xs">
                      {question.category}
                    </Badge>
                    <Badge className={getDifficultyColor(question.difficulty)}>
                      {question.difficulty}
                    </Badge>
                    {question.isPublic && (
                      <Badge variant="outline" className="text-blue-400 border-blue-500/30 text-xs">
                        Public
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Used {question.usage} times</span>
                    <span>{question.timeLimit}s • {question.points} pts</span>
                  </div>

                  {question.explanation && (
                    <div className="bg-[#1a1f2e] p-2 rounded text-xs text-gray-300">
                      <span className="font-medium text-[#b388ff]">Explanation: </span>
                      {question.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}