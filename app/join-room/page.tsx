'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import Navbar from '@/components/navbar'

export default function JoinRoom() {
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleJoinRoom = async () => {
    // TODO: Implement actual room code validation
    if (roomCode.length === 6) {
      // For now, we'll assume any 6-character code is valid
      router.push(`/quiz-room/${roomCode}`)
    } else {
      setError('Invalid room code. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] to-[#2a3042]">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto bg-[#242b3d] border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-2xl text-[#b388ff]">Join a Quiz Room</CardTitle>
            <CardDescription className="text-[#e0e0e0]">Enter the room code to join an existing quiz</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button 
                onClick={handleJoinRoom}
                className="w-full bg-[#b388ff] hover:bg-white text-[#1a1f2e] hover:text-[#1a1f2e] font-semibold transition-colors duration-300"
              >
                Join Room
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

