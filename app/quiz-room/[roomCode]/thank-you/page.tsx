'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star } from 'lucide-react'

export default function ThankYouPage() {
  const router = useRouter()
  const [rating, setRating] = useState(0)

  const handleRate = (selectedRating: number) => {
    setRating(selectedRating)
    // Here you would typically send the rating to your backend
    console.log('Rating submitted:', selectedRating)
    setTimeout(() => router.push('/dashboard'), 1000) // Redirect after a short delay
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-[#242b3d] border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-[#b388ff]">Thank You!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-[#e0e0e0]">We appreciate your participation in the quiz. How would you rate your experience?</p>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-8 w-8 cursor-pointer transition-all duration-200 ${
                  star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'
                }`}
                onClick={() => handleRate(star)}
              />
            ))}
          </div>
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full text-[#b388ff] hover:text-purple-400 hover:bg-purple-500/10 transition-colors duration-200"
          >
            Skip Rating
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

