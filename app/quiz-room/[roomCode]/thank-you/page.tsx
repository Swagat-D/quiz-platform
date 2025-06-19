'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ThankYouPage() {
  const router = useRouter()
  const params = useParams()
  const roomCode = params?.roomCode as string

  // This page should redirect to the proper room results
  // The thank you modal should be shown from the quiz completion instead
  useEffect(() => {
    // Try to find the room by code and redirect to proper results
    const findRoomAndRedirect = async () => {
      try {
        const response = await fetch(`/api/rooms/code/${roomCode}`)
        const data = await response.json()
        
        if (data.success) {
          router.push(`/rooms/${data.room.id}/results`)
        } else {
          // If room not found, redirect to dashboard
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Failed to find room:', error)
        router.push('/dashboard')
      }
    }

    if (roomCode) {
      findRoomAndRedirect()
    } else {
      router.push('/dashboard')
    }
  }, [roomCode, router])

  // Show a loading state while redirecting
  return (
    <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#b388ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#e0e0e0]">Redirecting to results...</p>
      </div>
    </div>
  )
}