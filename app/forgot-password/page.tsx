"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Code, Eye, EyeOff } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OTPInput } from "@/components/ui/otp-input"
import LandingNav from "@/components/landing-nav"
import { Spinner } from "@/components/ui/spinner"

type Step = 'email' | 'otp' | 'password'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    setStep('otp')
  }

  const handleVerifyOTP = async (otp: string) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    setStep('password')
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert("Passwords don't match!")
      return
    }
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Password Reset failed!')
      }
    router.push('/login')
  }
  catch (error) {
    if (error instanceof Error) {
      alert(error.message || 'Something went wrong!')
    } else {
      alert('Something went wrong!')
    }
  } finally {
    setIsLoading(false)
  }
}

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/
  const isPasswordValid = passwordRegex.test(password)

  return (
    <div className="min-h-screen bg-[#1a1f2e] flex flex-col">
      <LandingNav />
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-20 left-4 text-[#e0e0e0] hover:text-white hover:bg-purple-500/10"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="bg-[#242b3d] border-purple-500/20">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <Code className="h-10 w-10 text-[#b388ff]" />
              </div>
              <CardTitle className="text-2xl font-bold text-center text-[#b388ff]">
                {step === 'email' && 'Reset Password'}
                {step === 'otp' && 'Verify OTP'}
                {step === 'password' && 'Create New Password'}
              </CardTitle>
              <CardDescription className="text-center text-[#a0a0a0]">
                {step === 'email' && "No worries, we've got you covered. Let's get your access restored!"}
                {step === 'otp' && 'Enter the OTP sent to your email'}
                {step === 'password' && 'Choose a strong password for your account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 'email' && (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#e0e0e0]">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="m@example.com"
                      required
                      className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? <Spinner className="mr-2" /> : null}
                    {isLoading ? 'Sending OTP...' : 'Send OTP'}
                  </Button>
                </form>
              )}

              {step === 'otp' && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <OTPInput onComplete={handleVerifyOTP} />
                  </div>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? <Spinner className="mr-2" /> : null}
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                </div>
              )}

              {step === 'password' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[#e0e0e0]">New Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-[#a0a0a0]"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                    {!isPasswordValid && password && (
                      <p className="text-sm text-red-500">
                        Password must be at least 8 characters long, contain uppercase and lowercase letters, and a special character.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-[#e0e0e0]">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-[#a0a0a0]"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showConfirmPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                    {password && confirmPassword && password !== confirmPassword && (
                      <p className="text-sm text-red-500">Passwords don't match.</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={isLoading || !isPasswordValid || password !== confirmPassword}
                  >
                    {isLoading ? <Spinner className="mr-2" /> : null}
                    {isLoading ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center text-sm text-[#a0a0a0]">
                Remember your password?{" "}
                <Link
                  className="text-[#b388ff] underline-offset-4 hover:underline"
                  href="/login"
                >
                  Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

