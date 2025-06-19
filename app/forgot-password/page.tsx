/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Code, Eye, EyeOff, Mail, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Step = 'email' | 'otp' | 'password' | 'success'

const FloatingElements = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/5 rounded-full blur-xl animate-pulse"></div>
    <div className="absolute top-40 right-20 w-32 h-32 bg-blue-500/5 rounded-full blur-xl animate-pulse delay-1000"></div>
    <div className="absolute bottom-40 left-20 w-24 h-24 bg-pink-500/5 rounded-full blur-xl animate-pulse delay-2000"></div>
  </div>
);

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(60)
  const router = useRouter()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    if (step === 'otp' && resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => prev > 0 ? prev - 1 : 0);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, resendTimer]);

  const steps = [
    { id: 'email', title: 'Reset Password', description: 'Enter your email address' },
    { id: 'otp', title: 'Verify Code', description: 'Enter the verification code' },
    { id: 'password', title: 'New Password', description: 'Create a new password' },
    { id: 'success', title: 'Success', description: 'Password reset complete' }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(s => s.id === step);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          type: 'reset'
        }),
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }
  
      setStep('otp');
      setResendTimer(60);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Something went wrong');
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleVerifyOTP = async (otpCode: string) => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otpCode,
          type: 'reset'
        }),
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }
  
      setStep('password');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Something went wrong');
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError("Passwords don't match!")
      return
    }
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, verified: true })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed!')
      }
      
      setStep('success');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message || 'Something went wrong!')
      } else {
        setError('Something went wrong!')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
      
      // Auto-submit when all fields are filled
      if (newOtp.every(digit => digit !== '') && !isLoading) {
        handleVerifyOTP(newOtp.join(''));
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setResendTimer(60);
    await handleSendOTP(new Event('submit') as any);
  };

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/
  const isPasswordValid = passwordRegex.test(password)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1c] via-[#1a1f2e] to-[#2a1f3d] flex items-center justify-center relative overflow-hidden">
      <FloatingElements />
      
      {/* Back Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors z-10"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      <div className={`w-full max-w-md mx-4 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        {/* Progress Bar */}
        {step !== 'success' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.slice(0, -1).map((stepItem, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    index <= getCurrentStepIndex()
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' 
                      : 'bg-white/10 text-gray-400'
                  }`}>
                    {index < getCurrentStepIndex() ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 2 && (
                    <div className={`w-12 h-1 mx-2 transition-all ${
                      index < getCurrentStepIndex() ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">{steps[getCurrentStepIndex()].title}</h2>
              <p className="text-gray-400 text-sm">{steps[getCurrentStepIndex()].description}</p>
            </div>
          </div>
        )}

        {/* Card */}
        <Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardContent className="p-8">
            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-center gap-2 mb-6">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {step === 'email' && (
              <>
                <div className="text-center mb-8">
                  <div className="inline-block p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl mb-4">
                    <Code className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                    Reset Password
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    No worries, we&apos;ve got you covered. Let&apos;s get your access restored!
                  </CardDescription>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending OTP...
                      </div>
                    ) : (
                      'Send Reset Code'
                    )}
                  </Button>
                </form>
              </>
            )}

            {step === 'otp' && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="inline-block p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl mb-4">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white mb-2">Verify Code</CardTitle>
                  <CardDescription className="text-gray-400">
                    Enter the verification code sent to<br />
                    <span className="text-purple-400 font-medium">{email}</span>
                  </CardDescription>
                </div>

                <div className="flex justify-center gap-2 mb-6">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      maxLength={1}
                    />
                  ))}
                </div>

                {isLoading && (
                  <div className="flex items-center justify-center gap-2 text-purple-400 mb-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying...
                  </div>
                )}

                <p className="text-gray-400 text-sm">
                  Didn&apos;t receive the code?{' '}
                  {resendTimer > 0 ? (
                    <span>Resend in {resendTimer}s</span>
                  ) : (
                    <button 
                      onClick={handleResendOTP}
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Resend code
                    </button>
                  )}
                </p>
              </div>
            )}

            {step === 'password' && (
              <>
                <div className="text-center mb-8">
                  <div className="inline-block p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl mb-4">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white mb-2">Create New Password</CardTitle>
                  <CardDescription className="text-gray-400">
                    Choose a strong password for your account
                  </CardDescription>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-gray-300">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                        required
                        className="pl-10 pr-12 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {!isPasswordValid && password && (
                      <p className="text-sm text-red-400">
                        Password must be at least 8 characters long, contain uppercase and lowercase letters, and a special character.
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-300">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                        className="pl-10 pr-12 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {password && confirmPassword && password !== confirmPassword && (
                      <p className="text-sm text-red-400">Passwords don&apos;t match.</p>
                    )}
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isLoading || !isPasswordValid || password !== confirmPassword}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Updating Password...
                      </div>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </form>
              </>
            )}

            {step === 'success' && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="inline-block p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl mb-4">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white mb-2">Password Reset Successful!</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your password has been updated successfully.
                  </CardDescription>
                </div>

                <div className="space-y-4">
                  <Button 
                    onClick={() => router.push('/login')}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105"
                  >
                    Sign In Now
                  </Button>
                  <Button 
                    onClick={() => router.push('/')}
                    variant="outline"
                    className="w-full py-3 bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all"
                  >
                    Back to Home
                  </Button>
                </div>
              </div>
            )}

            {step !== 'success' && (
              <div className="mt-6 text-center text-sm text-gray-400">
                Remember your password?{" "}
                <Link
                  className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
                  href="/login"
                >
                  Sign in
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}