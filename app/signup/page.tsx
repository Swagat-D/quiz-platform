"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ArrowLeft, Code, Mail, Lock, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { signIn, useSession } from "next-auth/react"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Step = 'form' | 'verify' | 'welcome'

const FloatingElements = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/5 rounded-full blur-xl animate-pulse"></div>
    <div className="absolute top-40 right-20 w-32 h-32 bg-blue-500/5 rounded-full blur-xl animate-pulse delay-1000"></div>
    <div className="absolute bottom-40 left-20 w-24 h-24 bg-pink-500/5 rounded-full blur-xl animate-pulse delay-2000"></div>
  </div>
);

export default function SignUpPage() {
  const [step, setStep] = useState<Step>('form')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [passwordStrength, setPasswordStrength] = useState(0)
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  useEffect(() => {
    // Calculate password strength
    const password = formData.password;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  }, [formData.password]);

  const steps = [
    { title: 'Create Account', description: 'Enter your basic information' },
    { title: 'Verify Email', description: 'Check your email for verification code' },
    { title: 'Welcome', description: 'Account created successfully!' }
  ];

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };

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
  
      setStep('welcome');
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
      <div className="min-h-screen bg-gradient-to-br from-[#0a0f1c] via-[#1a1f2e] to-[#2a1f3d] flex justify-center items-center">
        <div className="text-[#b388ff] text-xl flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

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
        {step !== 'welcome' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.slice(0, -1).map((stepItem, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    (step === 'form' && index === 0) || (step === 'verify' && index <= 1) 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' 
                      : 'bg-white/10 text-gray-400'
                  }`}>
                    {(step === 'verify' && index === 0) ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 2 && (
                    <div className={`w-12 h-1 mx-2 transition-all ${
                      step === 'verify' ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">{steps[step === 'form' ? 0 : 1].title}</h2>
              <p className="text-gray-400 text-sm">{steps[step === 'form' ? 0 : 1].description}</p>
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

            {step === 'form' && (
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-block p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl mb-4">
                    <Code className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                    Join DevQuizWare
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Start your coding journey today
                  </CardDescription>
                </div>

                {/* Form */}
                <form onSubmit={handleSendOTP} className="space-y-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your full name"
                        required
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter your email"
                        required
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    
                    {/* Password Strength */}
                    {formData.password && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Password strength</span>
                          <span className={`font-medium ${passwordStrength <= 2 ? 'text-red-400' : passwordStrength <= 3 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()}`}
                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                          />
                        </div>
                        {!isPasswordValid && (
                          <p className="text-sm text-red-400">
                            Password must be at least 8 characters long, contain uppercase and lowercase letters, and a special character.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading || !formData.name || !formData.email || !formData.password}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-black/40 text-gray-400">Or continue with</span>
                    </div>
                  </div>

                  {/* Google Sign Up */}
                  <Button
                    type="button"
                    onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                    variant="outline"
                    className="w-full py-3 bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                </form>
              </>
            )}

            {step === 'verify' && (
              <OTPVerificationStep 
                email={formData.email}
                onVerify={handleVerifyOTP}
                isLoading={isLoading}
              />
            )}

            {step === 'welcome' && (
              <WelcomeStep name={formData.name} />
            )}

            {/* Sign In Link */}
            {step === 'form' && (
              <p className="text-center text-gray-400 mt-8">
                Already have an account?{' '}
                <Link
                  className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
                  href="/login"
                >
                  Sign in
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Terms */}
        {step === 'form' && (
          <p className="text-center text-xs text-gray-500 mt-6">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-purple-400 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-purple-400 hover:underline">Privacy Policy</Link>
          </p>
        )}
      </div>
    </div>
  )
}

// OTP Verification Component
const OTPVerificationStep = ({ email, onVerify, isLoading }: {
  email: string;
  onVerify: (otp: string) => void;
  isLoading: boolean;
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
        onVerify(newOtp.join(''));
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="inline-block p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl mb-4">
          <Mail className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-white mb-2">Check your email</CardTitle>
        <CardDescription className="text-gray-400">
          We&apos;ve sent a verification code to<br />
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
          <button className="text-purple-400 hover:text-purple-300 transition-colors">
            Resend code
          </button>
        )}
      </p>
    </div>
  );
};

// Welcome Step Component
const WelcomeStep = ({ name }: { name: string }) => {
  const router = useRouter();

  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="inline-block p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl mb-4">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-white mb-2">Welcome to DevQuizWare!</CardTitle>
        <CardDescription className="text-gray-400">
          Hi {name}, your account has been created successfully.
        </CardDescription>
      </div>

      <div className="space-y-4">
        <Button 
          onClick={() => router.push('/dashboard')}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105"
        >
          Go to Dashboard
        </Button>
        <Button 
          onClick={() => router.push('/tour')}
          variant="outline"
          className="w-full py-3 bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all"
        >
          Take a Quick Tour
        </Button>
      </div>
    </div>
  );
};