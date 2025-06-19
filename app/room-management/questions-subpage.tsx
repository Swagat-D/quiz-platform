import { useState, useEffect } from 'react'
import { X, Plus, Save } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Question {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
}

interface QuestionsSubpageProps {
  onClose: () => void;
}

export default function QuestionsSubpage({ onClose }: QuestionsSubpageProps) {
  const [newQuestion, setNewQuestion] = useState<Question>({
    id: '',
    text: '',
    options: ['', '', '', ''],
    correctOption: 0
  })
  const [savedQuestions, setSavedQuestions] = useState<Question[]>([
    { id: '1', text: 'What is React?', options: ['A library', 'A framework', 'A language', 'An OS'], correctOption: 0 },
    { id: '2', text: 'What does JSX stand for?', options: ['JavaScript XML', 'Java Syntax Extension', 'JSON XML', 'JavaScript Syntax'], correctOption: 0 },
  ])
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([])
  const [activeTab, setActiveTab] = useState('selected')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleAddQuestion = () => {
    if (newQuestion.text && newQuestion.options.every(option => option !== '')) {
      const newQuestionWithId = { ...newQuestion, id: Date.now().toString() };
      setSelectedQuestions([...selectedQuestions, newQuestionWithId]);
      setNewQuestion({
        id: '',
        text: '',
        options: ['', '', '', ''],
        correctOption: 0
      });
    }
  };

  const handleSaveQuestions = () => {
    // Here you would typically send the selectedQuestions to your backend
    console.log('Saving selected questions:', selectedQuestions)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#2a3042] to-[#1a1f2e] rounded-lg p-6 w-full max-w-2xl max-h-[95vh] flex flex-col shadow-xl border border-purple-500/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-purple-400">Update Questions</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6 text-purple-400" />
          </Button>
        </div>
        
        <div className="space-y-4 mb-4 bg-[#1a1f2e] p-4 rounded-lg border border-purple-500/20">
          <Input
            placeholder="Enter question"
            value={newQuestion.text}
            onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
            className="bg-[#242b3d] border-purple-500/20 text-white"
          />
          {newQuestion.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => {
                  const newOptions = [...newQuestion.options]
                  newOptions[index] = e.target.value
                  setNewQuestion({ ...newQuestion, options: newOptions })
                }}
                className="bg-[#242b3d] border-purple-500/20 text-white flex-grow"
              />
              <RadioGroup value={newQuestion.correctOption.toString()} className="flex items-center">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={index.toString()}
                    id={`option-${index}`}
                    onClick={() => setNewQuestion({ ...newQuestion, correctOption: index })}
                    className="text-purple-400"
                  />
                  <Label htmlFor={`option-${index}`} className="text-gray-300">Correct</Label>
                </div>
              </RadioGroup>
            </div>
          ))}
          <Button onClick={handleAddQuestion} className="w-full bg-purple-500 hover:bg-purple-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
        
        <div className="flex-grow mb-4 overflow-hidden flex flex-col">
          {/* Mobile view */}
          <div className="lg:hidden mb-4">
            <div className="flex rounded-lg overflow-hidden">
              <button
                className={`flex-1 py-2 px-4 text-sm font-medium ${
                  activeTab === 'selected' ? 'bg-purple-500 text-white' : 'bg-[#1a1f2e] text-purple-400'
                }`}
                onClick={() => setActiveTab('selected')}
              >
                Selected ({selectedQuestions.length}/20)
              </button>
              <button
                className={`flex-1 py-2 px-4 text-sm font-medium ${
                  activeTab === 'other' ? 'bg-purple-500 text-white' : 'bg-[#1a1f2e] text-purple-400'
                }`}
                onClick={() => setActiveTab('other')}
              >
                Other Questions
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 h-auto">
            {/* Selected Questions */}
            <div className={`flex-1 flex flex-col ${activeTab === 'selected' || !isMobile ? 'block' : 'hidden'}`}>
              <h3 className="text-xl font-semibold text-purple-400 mb-2 hidden lg:block">Selected Questions ({selectedQuestions.length}/20)</h3>
              <ScrollArea className="flex-grow pr-4 border border-purple-500/20 rounded-lg h-[calc(100vh-600px)] min-h-[300px]">
                <div className="space-y-4 p-4">
                  {[...selectedQuestions].reverse().map((question, index) => (
                    <div key={question.id} className="bg-[#242b3d] p-4 rounded-lg border border-purple-500/20 shadow-md transition-all duration-300 hover:shadow-lg hover:border-purple-500/50">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-purple-400 mb-2 text-lg">{selectedQuestions.length - index}. {question.text}</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id))
                            setSavedQuestions([...savedQuestions, question])
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          Remove
                        </Button>
                      </div>
                      <ul className="space-y-2 mt-2">
                        {question.options.map((option, optionIndex) => (
                          <li key={optionIndex} className={`flex items-center space-x-2 p-2 rounded-md ${optionIndex === question.correctOption ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/10 text-gray-300'}`}>
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full ${optionIndex === question.correctOption ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <span>{option}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Other Questions */}
            <div className={`flex-1 flex flex-col ${activeTab === 'other' || !isMobile ? 'block' : 'hidden'}`}>
              <h3 className="text-xl font-semibold text-purple-400 mb-2 hidden lg:block">Other Questions</h3>
              <ScrollArea className="flex-grow pr-4 border border-purple-500/20 rounded-lg h-[calc(100vh-600px)] min-h-[300px]">
                <div className="space-y-4 p-4">
                  {savedQuestions.map((question) => (
                    <div key={question.id} className="bg-[#242b3d] p-4 rounded-lg border border-purple-500/20 shadow-md transition-all duration-300 hover:shadow-lg hover:border-purple-500/50">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-purple-400 mb-2 text-lg">{question.text}</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            if (selectedQuestions.length < 20) {
                              setSelectedQuestions([...selectedQuestions, question])
                              setSavedQuestions(savedQuestions.filter(q => q.id !== question.id))
                            }
                          }}
                          disabled={selectedQuestions.length >= 20}
                          className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        >
                          Add
                        </Button>
                      </div>
                      <ul className="space-y-2 mt-2">
                        {question.options.map((option, optionIndex) => (
                          <li key={optionIndex} className={`flex items-center space-x-2 p-2 rounded-md ${optionIndex === question.correctOption ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/10 text-gray-300'}`}>
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full ${optionIndex === question.correctOption ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <span>{option}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
        
        <Button onClick={handleSaveQuestions} className="w-full bg-purple-500 hover:bg-purple-600">
          <Save className="h-4 w-4 mr-2" />
          Save Questions
        </Button>
      </div>
    </div>
  )
}

