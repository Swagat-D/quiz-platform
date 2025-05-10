'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/navbar'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle, Lock } from 'lucide-react'
import { Label } from '@/components/ui/label'

export default function ContactPage() {
  const { data: session, status } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  
  // Determine if user is authenticated
  const isAuthenticated = status === 'authenticated' && !!session?.user?.email
  
  // Update form data when authentication status changes
  useEffect(() => {
    if (isAuthenticated && session?.user?.email) {
      setFormData(prev => ({
        ...prev,
        email: session.user.email || ''
      }))
    }
  }, [isAuthenticated, session?.user?.email])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // If email field and user is authenticated, don't allow changes
    if (name === 'email' && isAuthenticated) {
      return
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      // Simple validation
      if (!formData.name.trim()) {
        throw new Error('Please enter your name')
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        throw new Error('Please enter a valid email address')
      }
      if (!formData.message.trim()) {
        throw new Error('Please enter your message')
      }
      
      // Make the API call
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      // Handle non-JSON responses
      let result
      const text = await response.text()
      
      try {
        result = text ? JSON.parse(text) : {}
      } catch (error) {
        console.error('Error parsing response:', error)
        console.error('Raw response:', text)
        throw new Error('The server returned an invalid response. Please try again later.')
      }
      
      // Handle error responses
      if (!response.ok) {
        throw new Error(result.error || `Error ${response.status}: Failed to send message`)
      }
      
      // Success!
      setSubmitStatus('success')
      
      // Reset form if not authenticated
      if (!isAuthenticated) {
        setFormData({
          name: '',
          email: '',
          message: ''
        })
      } else {
        // Just clear the message and name for authenticated users
        setFormData(prev => ({
          ...prev,
          name: '',
          message: ''
        }))
      }
    } catch (error) {
      console.error('Contact form error:', error)
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <Card className="bg-[#242b3d] border-purple-500/20 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-[#b388ff]">Contact Us</CardTitle>
            {isAuthenticated && session?.user?.name && (
              <p className="text-[#e0e0e0] mt-2">
                Hello, <span className="text-[#b388ff] font-medium">{session.user.name}</span>! How can we help you today?
              </p>
            )}
          </CardHeader>
          <CardContent>
            {submitStatus === 'success' ? (
              <div className="bg-green-500/10 p-4 rounded-md flex items-start space-x-3 mb-6">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-500">Message Sent!</h3>
                  <p className="text-[#e0e0e0] mt-1">
                    Thank you for reaching out! We&apos;ll get back to you as soon as possible.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4 text-[#b388ff] border-purple-500/20 hover:bg-purple-500/10"
                    onClick={() => setSubmitStatus('idle')}
                  >
                    Send Another Message
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {submitStatus === 'error' && (
                  <div className="bg-red-500/10 p-4 rounded-md flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-red-500">Message Not Sent</h3>
                      <p className="text-[#e0e0e0] mt-1">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#e0e0e0]">Name</Label>
                  <Input 
                    id="name" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name" 
                    className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]" 
                  />
                </div>

                {/* Email field - different based on auth status */}
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#e0e0e0] flex items-center">
                      Email <Lock className="ml-2 h-4 w-4 text-[#b388ff]" />
                    </Label>
                    <div className="relative">
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        value={formData.email}
                        readOnly
                        disabled
                        className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] opacity-80"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b388ff]">
                        <Lock className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-[#a0a0a0] text-xs">
                      Using email from your logged in account
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#e0e0e0]">Email</Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email" 
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Your email" 
                      className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]" 
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-[#e0e0e0]">Message</Label>
                  <Textarea 
                    id="message" 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Your message" 
                    className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0] min-h-32" 
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : 'Send Message'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}