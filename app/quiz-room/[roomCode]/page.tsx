'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, UserMinus, Star } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"

interface Question {
  id: number;
  text: string;
  options: string[];
  selectedOption: number | null;
}

interface Participant {
  id: number;
  name: string;
}

const initialQuestions: Question[] = [
  { id: 1, text: "What is React?", options: ["A JavaScript library", "A programming language", "A database", "An operating system"], selectedOption: null },
  { id: 2, text: "What does JSX stand for?", options: ["JavaScript XML", "Java Syntax Extension", "JSON XML", "JavaScript Syntax"], selectedOption: null },
];

export default function QuizRoom() {
  const { roomCode } = useParams()
  const router = useRouter()
  const [questions, setQuestions] = useState(initialQuestions);
  const [participants, setParticipants] = useState<Participant[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Simulating participants joining and leaving
    const joinInterval = setInterval(() => {
      const newParticipant = { id: Date.now(), name: `User${Math.floor(Math.random() * 1000)}` }
      setParticipants(prev => [...prev, newParticipant])
    }, 5000)

    const leaveInterval = setInterval(() => {
      setParticipants(prev => {
        if (prev.length > 0) {
          return prev.slice(0, -1)
        }
        return prev
      })
    }, 7000)

    return () => {
      clearInterval(joinInterval)
      clearInterval(leaveInterval)
    }
  }, [])

  const handleFinishQuiz = () => {
    router.push(`/quiz-room/${roomCode}/thank-you`)
  }

  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] to-[#2a3042]">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="absolute top-4 right-4 bg-[#242b3d] p-2 rounded-lg">
        <span className="text-[#b388ff] font-bold">
          Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </span>
      </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#b388ff] mb-6 sm:mb-8">Quiz Room: {roomCode}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <Card className="lg:col-span-2 bg-[#242b3d] border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-[#b388ff]">Questions</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100vh-200px)] sm:h-[calc(100vh-220px)] lg:h-[calc(100vh-240px)] overflow-y-auto">
              <ScrollArea className="h-full">
                <div className="space-y-4 sm:space-y-6 pr-2 sm:pr-4">
                  {questions.map((question, questionIndex) => (
                    <div key={question.id} className="bg-[#1a1f2e] p-3 sm:p-4 rounded-lg">
                      <h3 className="text-base sm:text-lg font-semibold text-[#e0e0e0] mb-3 sm:mb-4">
                        {questionIndex + 1}. {question.text}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {question.options.map((option, optionIndex) => (
                          <button
                            key={optionIndex}
                            className={`text-left p-2 sm:p-3 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                              question.selectedOption === optionIndex
                                ? 'bg-purple-500 text-white'
                                : 'bg-[#242b3d] text-[#a0a0a0] hover:bg-purple-500/20'
                            }`}
                            onClick={() => {
                              const newQuestions = [...questions];
                              newQuestions[questionIndex].selectedOption = 
                                newQuestions[questionIndex].selectedOption === optionIndex ? null : optionIndex;
                              setQuestions(newQuestions);
                            }}
                          >
                            <span className="font-semibold mr-2">
                              {String.fromCharCode(97 + optionIndex)}.
                            </span>
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          <div className="space-y-6 lg:space-y-8">
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl text-[#b388ff]">Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between bg-[#1a1f2e] p-2 rounded-lg">
                      <span className="text-[#e0e0e0] text-sm sm:text-base">{participant.name}</span>
                      <UserPlus className="h-4 w-4 text-green-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#242b3d] border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl text-[#b388ff]">Question Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((question, index) => (
                    <Button
                      key={question.id}
                      variant="outline"
                      className={`w-full h-10 ${
                        index === currentQuestionIndex
                          ? 'bg-purple-500 text-white'
                          : question.selectedOption !== null
                          ? 'bg-green-500 text-white'
                          : 'bg-[#1a1f2e] text-[#e0e0e0] hover:bg-purple-500/20'
                      }`}
                      onClick={() => navigateToQuestion(index)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Button 
              onClick={handleFinishQuiz}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-lg transition-all duration-200 hover:shadow-lg"
            >
              Finish Quiz
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

