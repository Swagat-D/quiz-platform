'use client'

import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Users } from 'lucide-react'
import { useSession } from "next-auth/react"
import { useEffect } from 'react'

export default function Dashboard() {
  const router = useRouter()
  const { status } = useSession()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Show loading state or nothing while checking authentication
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex justify-center items-center">
        <div className="text-[#b388ff] text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-[#b388ff] tracking-wide">Level Up Your Dev Skills with DevQuizWare</h1>
            <p className="text-[#e0e0e0] text-lg">Challenge yourself, learn new concepts, and become a better developer with our interactive coding quizzes.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/50 transition-colors duration-300">
              <CardHeader className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-[#b388ff]" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl text-[#e0e0e0]">Create Room</CardTitle>
                  <CardDescription className="text-[#a0a0a0]">
                    Create a new quiz room and invite others to join
                  </CardDescription>
                </div>
                <Button 
                  className="w-full bg-white hover:bg-[#b388ff] text-[#1a1f2e] hover:text-white font-semibold transition-colors duration-300"
                  onClick={() => router.push('/room-management')}
                >
                  Start Coding
                </Button>
              </CardHeader>
            </Card>
            <Card className="bg-[#242b3d] border-purple-500/20 hover:border-purple-500/50 transition-colors duration-300">
              <CardHeader className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-[#b388ff]" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl text-[#e0e0e0]">Join Room</CardTitle>
                  <CardDescription className="text-[#a0a0a0]">
                    Join an existing quiz room using a room code
                  </CardDescription>
                </div>
                <Button 
                  className="w-full bg-[#b388ff] hover:bg-white text-white hover:text-[#1a1f2e] font-semibold transition-colors duration-300"
                  onClick={() => router.push('/join-room')}
                >
                  Explore Quizzes
                </Button>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}