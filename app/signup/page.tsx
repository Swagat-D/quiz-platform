"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ArrowLeft, Code } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { signIn, useSession } from "next-auth/react"
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
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const router = useRouter()
  const { status } = useSession()

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/
  const isPasswordValid = passwordRegex.test(formData.password)

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!isPasswordValid) {
      setError("Please ensure your password meets the requirements.")
      return;
    }
    
    setIsLoading(true);
  
    try {
      // First register the user
      const registerResponse = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
  
      const registerData = await registerResponse.json();
      if (!registerResponse.ok) {
        throw new Error(registerData.error || 'Registration failed');
      }
  
      setStep('verify');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Something went wrong');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp,
          type: 'signup'
        }),
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }
  
      // Successful verification, redirect to login
      router.push('/login?verified=true');
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

  // If still checking authentication status, show loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex justify-center items-center">
        <div className="text-[#b388ff] text-xl">Loading...</div>
      </div>
    );
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
              {error && (
                <div className="bg-red-500/10 text-red-500 p-3 rounded-md mb-4 text-sm">
                  {error}
                </div>
              )}
              
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
                  >
                    {isLoading ? <Spinner className="mr-2" /> : null}
                    {isLoading ? 'Verifying...' : 'Verify & Create Account'}
                  </Button>
                </div>
              )}

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-purple-500/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#242b3d] px-2 text-[#a0a0a0]">Or continue with</span>
                  </div>
                </div>
                <Button 
                  type="button"
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  className="w-full bg-white hover:bg-gray-100 text-gray-900"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                    </g>
                  </svg>
                  Sign up with Google
                </Button>

                
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