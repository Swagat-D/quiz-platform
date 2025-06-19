import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Award, ChevronRight, Minimize2 } from 'lucide-react'

interface Question {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
}

interface Participant {
  id: number;
  name: string;
  score: number;
}

interface LiveQuizProps {
  roomCode: string;
  onClose: () => void;
  savedQuestions: Question[];
}

// Simulated backend function
const fetchQuestions = async (savedQuestions: Question[]): Promise<Question[]> => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(savedQuestions), 1000);
  });
};

export default function LiveQuiz({ onClose, savedQuestions }: LiveQuizProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [questionStats, setQuestionStats] = useState<{ [key: number]: number }>({})
  const [isMinimized, setIsMinimized] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]

  const fetchQuestionsData = useCallback(async () => {
    const fetchedQuestions = await fetchQuestions(savedQuestions);
    setQuestions(fetchedQuestions);
  }, [savedQuestions]);

  useEffect(() => {
    fetchQuestionsData();
    // Mock participant data
    setParticipants([
      { id: 1, name: "Alice", score: 0 },
      { id: 2, name: "Bob", score: 0 },
      { id: 3, name: "Charlie", score: 0 },
    ]);
  }, [fetchQuestionsData]);

  useEffect(() => {
    if (timeLeft > 0 && currentQuestion && !showAnswer) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showAnswer) {
      setShowAnswer(true)
      // Mock question stats
      setQuestionStats({
        0: 40,
        1: 30,
        2: 20,
        3: 10,
      })
    }
  }, [timeLeft, currentQuestion, showAnswer])

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setTimeLeft(30)
      setShowAnswer(false)
      setQuestionStats({})
    } else {
      // End of quiz
      setShowLeaderboard(true)
    }
  }

  const renderLeaderboard = () => (
    <Card className="w-full max-w-2xl mx-auto mt-8 bg-[#242b3d] border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-purple-400 flex items-center">
          <Award className="mr-2" /> Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {participants.sort((a, b) => b.score - a.score).map((participant, index) => (
          <div key={participant.id} className="flex justify-between items-center mb-2 p-2 rounded bg-[#1a1f2e]">
            <span className="text-white">{index + 1}. {participant.name}</span>
            <span className="text-purple-400 font-bold">{participant.score}</span>
          </div>
        ))}
        <Button onClick={onClose} className="w-full mt-4 bg-purple-500 hover:bg-purple-600">Close Live Quiz</Button>
      </CardContent>
    </Card>
  )

  if (showLeaderboard) {
    return renderLeaderboard()
  }

  if (!currentQuestion) return null

  return (
    <div className={`fixed ${isMinimized ? 'bottom-4 right-4' : 'inset-0'} bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-all duration-300`}>
      <Card className={`w-full ${isMinimized ? 'max-w-xs' : 'max-w-2xl'} bg-[#242b3d] border-purple-500/20 transition-all duration-300`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold text-purple-400">Question {currentQuestionIndex + 1}</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-purple-400">{timeLeft}s</div>
            <Button variant="ghost" size="sm" onClick={() => setIsMinimized(!isMinimized)}>
              <Minimize2 className="h-4 w-4 text-purple-400" />
            </Button>
          </div>
        </CardHeader>
        {!isMinimized && (
          <CardContent>
            <p className="text-white mb-4 text-lg">{currentQuestion.text}</p>
            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  className={`h-16 ${
                    showAnswer && index === currentQuestion.correctOption
                      ? 'bg-green-500'
                      : showAnswer
                      ? 'bg-red-500'
                      : 'bg-purple-500'
                  } hover:opacity-90 transition-colors duration-300`}
                  disabled={showAnswer}
                >
                  {option}
                </Button>
              ))}
            </div>
            {!showAnswer && (
              <Progress value={(30 - timeLeft) / 30 * 100} className="mt-4" />
            )}
            {showAnswer && (
              <div className="mt-4">
                <h3 className="text-xl font-bold text-purple-400 mb-2 flex items-center">
                  <AlertCircle className="mr-2" /> Question Stats
                </h3>
                {Object.entries(questionStats).map(([option, percentage]) => (
                  <div key={option} className="flex justify-between items-center mb-2 p-2 rounded bg-[#1a1f2e]">
                    <span className="text-white">{currentQuestion.options[Number(option)]}</span>
                    <span className="text-purple-400 font-bold">{percentage}%</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between mt-4">
              <Button onClick={() => setShowLeaderboard(true)} className="bg-purple-500 hover:bg-purple-600">
                Show Leaderboard
              </Button>
              {showAnswer && (
                <Button onClick={handleNextQuestion} className="bg-green-500 hover:bg-green-600">
                  Next Question <ChevronRight className="ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

