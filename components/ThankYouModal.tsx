// components/ThankYouModal.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { 
  Star, CheckCircle2, Share2, Trophy, TrendingUp, 
  X, Sparkles, Heart, ThumbsUp 
} from 'lucide-react'

interface ThankYouModalProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
  userScore?: number
  userRank?: number
  totalParticipants?: number
}

export default function ThankYouModal({ 
  isOpen, 
  onClose, 
  roomId, 
  userScore = 0, 
  userRank = 1, 
  totalParticipants = 1 
}: ThankYouModalProps) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasRated, setHasRated] = useState(false)

  const handleRate = async (selectedRating: number) => {
    if (hasRated) return
    
    setIsSubmitting(true)
    try {
      // Submit rating to API
      const response = await fetch(`/api/rooms/${roomId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: selectedRating }),
      })

      if (response.ok) {
        setRating(selectedRating)
        setHasRated(true)
        
        // Show success message
        setTimeout(() => {
          router.push(`/rooms/${roomId}/results`)
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to submit rating:', error)
      // Still proceed to results even if rating fails
      setRating(selectedRating)
      setHasRated(true)
      setTimeout(() => {
        router.push(`/rooms/${roomId}/results`)
      }, 2000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    router.push(`/rooms/${roomId}/results`)
  }

  const shareResults = () => {
    const shareText = `I just completed a quiz and scored ${userScore}% (ranked #${userRank} out of ${totalParticipants})! 🎉`
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

  const getPerformanceMessage = () => {
    if (userScore >= 90) return { message: "Outstanding performance!", icon: Trophy, color: "text-yellow-400" }
    if (userScore >= 80) return { message: "Excellent work!", icon: Star, color: "text-green-400" }
    if (userScore >= 70) return { message: "Great job!", icon: TrendingUp, color: "text-blue-400" }
    if (userScore >= 60) return { message: "Good effort!", icon: ThumbsUp, color: "text-purple-400" }
    return { message: "Keep practicing!", icon: Heart, color: "text-pink-400" }
  }

  const performance = getPerformanceMessage()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#242b3d] to-[#2a3042] rounded-2xl max-w-md w-full border border-purple-500/20 shadow-2xl animate-in slide-in-from-bottom-4 duration-500 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors duration-200 z-10"
        >
          <X className="h-5 w-5 text-gray-400 hover:text-white" />
        </button>

        {/* Celebration Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute top-8 right-8 w-1 h-1 bg-purple-400 rounded-full animate-ping delay-300"></div>
          <div className="absolute bottom-12 left-8 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping delay-500"></div>
          <div className="absolute top-1/2 right-4 w-1 h-1 bg-green-400 rounded-full animate-ping delay-700"></div>
        </div>

        <CardContent className="p-8 relative">
          {!hasRated ? (
            <>
              {/* Success Icon */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Congratulations Message */}
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-white mb-2 animate-in slide-in-from-bottom-2 duration-700 delay-200">
                  Congratulations! 🎉
                </h3>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <performance.icon className={`h-6 w-6 ${performance.color}`} />
                  <p className={`text-lg font-semibold ${performance.color}`}>
                    {performance.message}
                  </p>
                </div>
                
                {/* Score Display */}
                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-4 border border-purple-500/30 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-bold text-[#b388ff]">{userScore}%</p>
                      <p className="text-sm text-gray-400">Your Score</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-[#b388ff]">#{userRank}</p>
                      <p className="text-sm text-gray-400">Your Rank</p>
                    </div>
                  </div>
                </div>

                <p className="text-gray-300 animate-in slide-in-from-bottom-2 duration-700 delay-300">
                  You ranked <span className="text-[#b388ff] font-semibold">#{userRank}</span> out of{' '}
                  <span className="text-[#b388ff] font-semibold">{totalParticipants}</span> participants!
                </p>
              </div>
              
              {/* Rating Section */}
              <div className="text-center mb-6 animate-in slide-in-from-bottom-2 duration-700 delay-400">
                <p className="text-gray-300 mb-4">How would you rate this quiz experience?</p>
                
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="p-2 transition-all duration-200 hover:scale-125 disabled:cursor-not-allowed"
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => handleRate(star)}
                      disabled={isSubmitting}
                    >
                      <Star 
                        className={`h-8 w-8 transition-all duration-200 ${
                          star <= (hoveredRating || rating)
                            ? 'text-yellow-400 fill-yellow-400 drop-shadow-lg scale-110' 
                            : 'text-gray-500 hover:text-yellow-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-700 delay-500">
                <Button
                  onClick={handleSkip}
                  className="w-full bg-gradient-to-r from-[#b388ff] to-purple-600 hover:from-[#9c5cff] hover:to-purple-700 text-white font-semibold py-3 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
                >
                  View Detailed Results
                </Button>
                
                <div className="flex gap-3">
                  <Button
                    onClick={shareResults}
                    variant="outline"
                    className="flex-1 border-purple-500/30 text-[#e0e0e0] hover:bg-purple-500/10 transition-all duration-300"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    onClick={handleSkip}
                    variant="ghost"
                    className="flex-1 text-gray-400 hover:text-[#e0e0e0] hover:bg-white/5 transition-all duration-300"
                  >
                    Skip Rating
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // Thank you for rating message
            <div className="text-center animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
              <p className="text-gray-300 mb-4">
                Your {rating}-star rating has been recorded.
              </p>
              <div className="flex justify-center gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 ${
                      star <= rating
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-500'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Redirecting to results page...
              </p>
              <div className="w-8 h-8 border-2 border-[#b388ff] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          )}
        </CardContent>
      </div>
    </div>
  )
}

