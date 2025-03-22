"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ArrowLeft, Code } from 'lucide-react'
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
import { Spinner } from "@/components/ui/spinner"
import LandingNav from "@/components/landing-nav"

type Step = 'form' | 'verify'

export default function SignUpPage() {
  const [step, setStep] = useState<Step>('form')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const router = useRouter()

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/
  const isPasswordValid = passwordRegex.test(formData.password)

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPasswordValid) {
      alert("Please ensure your password meets the requirements.")
      return;
    }
    setIsLoading(true);

    try{
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
    }

    setStep('verify');
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Something went wrong');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    // Redirect to login page instead of dashboard
    router.push('/login')
  }

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
                {step === 'form' ? 'Create an Account' : 'Verify Email'}
              </CardTitle>
              <CardDescription className="text-center text-[#a0a0a0]">
                {step === 'form' 
                  ? 'Join our community of developers and start your learning journey'
                  : 'Enter the verification code sent to your email'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 'form' ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#e0e0e0]">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      required
                      className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#e0e0e0]">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="m@example.com"
                      required
                      className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[#e0e0e0]">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    {formData.password && !isPasswordValid && (
                      <p className="text-sm text-red-500">
                        Password must be at least 8 characters long, contain uppercase and lowercase letters, and a special character.
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? <Spinner className="mr-2" /> : null}
                    {isLoading ? 'Sending Verification Code...' : 'Verify Email'}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <OTPInput onComplete={handleVerifyOTP} />
                  </div>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={isLoading}
                    onClick={() => handleVerifyOTP('123456')}
                  >
                    {isLoading ? <Spinner className="mr-2" /> : null}
                    {isLoading ? 'Verifying...' : 'Verify & Create Account'}
                  </Button>
                </div>
              )}
              <div className="mt-6 text-center text-sm text-[#a0a0a0]">
                Already have an account?{" "}
                <Link
                  className="text-[#b388ff] underline-offset-4 hover:underline"
                  href="/login"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
          <div className="mt-8 text-center text-sm text-[#a0a0a0]">
            <p>By creating an account, you agree to our</p>
            <p className="mt-1">
              <Link href="#" className="text-[#b388ff] hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="#" className="text-[#b388ff] hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

