'use client'

import { useState } from 'react'
import { Copy, Share2, PlayCircle, AlertCircle, MessageSquare, XCircle, ClipboardCopy, Edit } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Navbar from '@/components/navbar'
import QuestionsSubpage from './questions-subpage'
import AlertSubpage from './alert-subpage'
import LiveQuiz from './live-quiz'
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { WhatsappIcon, TwitterIcon, FacebookIcon, LinkedinIcon, EmailIcon } from 'react-share'

type Question = {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
};


export default function RoomManagement() {
  const [showQuestionsSubpage, setShowQuestionsSubpage] = useState(false)
  const [showAlertSubpage, setShowAlertSubpage] = useState(false)
  const [showLiveQuiz, setShowLiveQuiz] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false) // Added state for showing questions
  const [savedQuestions] = useState<Question[]>([])
  const roomCode = 'o38nyw'
  const shareLink = `https://devquizware.com/join/${roomCode}`

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDisplayAlert = () => {
    setShowAlertSubpage(true)
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Manage Your Quiz Room
            </h1>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-white text-xl">Room Code:</span>
                <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-xl">
                  {roomCode}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="text-white text-lg sm:text-xl">Share Link:</span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="bg-[#242b3d] rounded-lg px-3 py-2 text-gray-300 text-sm sm:text-base overflow-x-auto whitespace-nowrap max-w-[200px] sm:max-w-none">
                    {shareLink}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-purple-500 hover:bg-purple-600 text-white rounded-full flex-shrink-0"
                    onClick={() => copyToClipboard(shareLink)}
                  >
                    <ClipboardCopy className="h-4 w-4" />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-purple-500 hover:bg-purple-600 text-white rounded-full flex-shrink-0"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 bg-[#242b3d] border-purple-500/20 p-2">
                      <div className="grid gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-white hover:bg-purple-500/20"
                          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareLink)}`, '_blank')}
                        >
                          <WhatsappIcon size={20} round className="mr-2" />
                          WhatsApp
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-white hover:bg-purple-500/20"
                          onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}`, '_blank')}
                        >
                          <TwitterIcon size={20} round className="mr-2" />
                          Twitter
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-white hover:bg-purple-500/20"
                          onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank')}
                        >
                          <FacebookIcon size={20} round className="mr-2" />
                          Facebook
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-white hover:bg-purple-500/20"
                          onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`, '_blank')}
                        >
                          <LinkedinIcon size={20} round className="mr-2" />
                          LinkedIn
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-white hover:bg-purple-500/20"
                          onClick={() => window.location.href = `mailto:?body=${encodeURIComponent(shareLink)}`}
                        >
                          <EmailIcon size={20} round className="mr-2" />
                          Email
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Room Controls */}
            <Card className="bg-[#242b3d]/50 border border-purple-500/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-purple-400">Room Controls</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  className="h-20 bg-gradient-to-br from-purple-400 to-pink-500 hover:opacity-90 text-white font-medium rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                  onClick={() => setShowQuestionsSubpage(true)}
                >
                  <div className="flex flex-col items-center">
                    <Edit className="h-6 w-6 mb-2" />
                    <span>Update Questions</span>
                  </div>
                </Button>
                <Button
                  className="h-20 bg-gradient-to-br from-emerald-400 to-blue-500 hover:opacity-90 text-white font-medium rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                  onClick={() => setShowLiveQuiz(true)}
                >
                  <div className="flex flex-col items-center">
                    <PlayCircle className="h-6 w-6 mb-2" />
                    <span>Start Live Quiz</span>
                  </div>
                </Button>
                <Button
                  className="h-20 bg-gradient-to-br from-amber-400 to-orange-500 hover:opacity-90 text-white font-medium rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                  onClick={handleDisplayAlert}
                >
                  <div className="flex flex-col items-center">
                    <AlertCircle className="h-6 w-6 mb-2" />
                    <span>Display Alert</span>
                  </div>
                </Button>
                <Button
                  className="h-20 bg-gradient-to-br from-blue-400 to-indigo-500 hover:opacity-90 text-white font-medium rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="flex flex-col items-center">
                    <MessageSquare className="h-6 w-6 mb-2" />
                    <span>Take Feedback</span>
                  </div>
                </Button>
                <Button
                  className="h-20 bg-gradient-to-br from-rose-400 to-red-500 hover:opacity-90 text-white font-medium rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="flex flex-col items-center">
                    <XCircle className="h-6 w-6 mb-2" />
                    <span>End Test</span>
                  </div>
                </Button>
              </div>
            </Card>

            {/* Quiz Statistics */}
            <Card className="bg-[#242b3d]/50 border border-purple-500/20 p-6">
              <h2 className="text-2xl font-semibold text-purple-400 mb-6">Quiz Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="bg-[#1a1f2e] rounded-lg p-4 cursor-pointer hover:bg-[#2a2f3e] transition-colors duration-200"
                  onClick={() => setShowParticipants(!showParticipants)}
                >
                  <div className="text-gray-400 mb-1">Participants</div>
                  <div className="text-4xl font-bold text-purple-400">24</div>
                </div>
                <div
                  className="bg-[#1a1f2e] rounded-lg p-4 cursor-pointer hover:bg-[#2a2f3e] transition-colors duration-200"
                  onClick={() => setShowQuestions(!showQuestions)}
                >
                  <div className="text-gray-400 mb-1">Questions</div>
                  <div className="text-4xl font-bold text-purple-400">10</div>
                </div>
                <div className="bg-[#1a1f2e] rounded-lg p-4">
                  <div className="text-gray-400 mb-1">Avg. Score</div>
                  <div className="text-4xl font-bold text-purple-400">75%</div>
                </div>
                <div className="bg-[#1a1f2e] rounded-lg p-4">
                  <div className="text-gray-400 mb-1">Time Left</div>
                  <div className="text-4xl font-bold text-purple-400">5:30</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
      {showParticipants && (
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-[#242b3d]/50 border border-purple-500/20 p-6">
            <h3 className="text-2xl font-semibold text-purple-400 mb-4">Participants</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Henry'].map((name, index) => (
                <div key={index} className="bg-[#1a1f2e] rounded-lg p-4 text-white flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center font-bold">
                    {name[0]}
                  </div>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      {showQuestions && (
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-[#242b3d]/50 border border-purple-500/20 p-6">
            <h3 className="text-2xl font-semibold text-purple-400 mb-4">Questions</h3>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="bg-[#1a1f2e] rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-2">Question {num}</h4>
                  <p className="text-gray-300">This is a sample question. Replace with actual question text.</p>
                  <div className="mt-2 text-sm text-purple-400">Options: 4 | Correct: Option A | Difficulty: Medium</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      {showQuestionsSubpage && (
        <QuestionsSubpage onClose={() => setShowQuestionsSubpage(false)} />
      )}
      {showAlertSubpage && (
        <AlertSubpage onClose={() => setShowAlertSubpage(false)} roomCode={roomCode} />
      )}
      {showLiveQuiz && (
        <LiveQuiz 
          roomCode={roomCode} 
          onClose={() => setShowLiveQuiz(false)} 
          savedQuestions={savedQuestions}
        />
      )}
    </div>
  )
}

