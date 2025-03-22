"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ArrowLeft, Code, Moon, Sun } from 'lucide-react'
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
import { Spinner } from "@/components/ui/spinner"
import LandingNav from "@/components/landing-nav"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const schema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid credentials")
      }
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    }
    catch (error) {
      if (error instanceof Error) {
        alert(error.message || "Login Failed");
      } else {
        alert("Login Failed");
      }
    }finally {
      setIsLoading(false)
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    // In a real app, you'd update the class on the html element
    // document.documentElement.classList.toggle('dark')
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-[#1a1f2e]' : 'bg-gray-100'}`}>
      <LandingNav />
      <Button
        variant="ghost"
        size="icon"
        className={`absolute top-20 left-4 ${isDarkMode ? 'text-[#e0e0e0] hover:text-white hover:bg-purple-500/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`absolute top-20 right-4 ${isDarkMode ? 'text-[#e0e0e0] hover:text-white hover:bg-purple-500/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
        onClick={toggleDarkMode}
      >
        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card className={isDarkMode ? "bg-[#242b3d] border-purple-500/20" : "bg-white"}>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <Code className="h-10 w-10 text-[#b388ff]" />
              </div>
              <CardTitle className={`text-2xl font-bold text-center ${isDarkMode ? 'text-[#b388ff]' : 'text-gray-900'}`}>Welcome Back!</CardTitle>
              <CardDescription className={`text-center ${isDarkMode ? 'text-[#a0a0a0]' : 'text-gray-500'}`}>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className={isDarkMode ? 'text-[#e0e0e0]' : 'text-gray-700'}>Email</Label>
                  <Input
                    id="email"
                    {...register('email')}
                    placeholder="m@example.com"
                    className={isDarkMode ? 'bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]' : 'bg-white border-gray-300 text-gray-900'}
                  />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className={isDarkMode ? 'text-[#e0e0e0]' : 'text-gray-700'}>Password</Label>
                    <Link
                      className={`text-sm ${isDarkMode ? 'text-[#b388ff]' : 'text-purple-600'} underline-offset-4 hover:underline`}
                      href="/forgot-password"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      {...register('password')}
                      type={showPassword ? "text" : "password"}
                      className={isDarkMode ? 'bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]' : 'bg-white border-gray-300 text-gray-900'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className={`absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent ${isDarkMode ? 'text-[#a0a0a0]' : 'text-gray-500'}`}
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
                  {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
                  {isLoading ? <Spinner className="mr-2" /> : null}
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-purple-500/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className={`px-2 ${isDarkMode ? 'bg-[#242b3d] text-[#a0a0a0]' : 'bg-white text-gray-500'}`}>Or continue with</span>
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
                Sign in with Google
              </Button>             
              <div className={`mt-6 text-center text-sm ${isDarkMode ? 'text-[#a0a0a0]' : 'text-gray-500'}`}>
                Don&apos;t have an account?{" "}
                <Link
                  className={`${isDarkMode ? 'text-[#b388ff]' : 'text-purple-600'} underline-offset-4 hover:underline`}
                  href="/signup"
                >
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
          <div className={`mt-8 text-center text-sm ${isDarkMode ? 'text-[#a0a0a0]' : 'text-gray-500'}`}>
            <p>By signing in, you agree to our</p>
            <p className="mt-1">
              <Link href="#" className={`${isDarkMode ? 'text-[#b388ff]' : 'text-purple-600'} hover:underline`}>Terms of Service</Link>
              {" "}and{" "}
              <Link href="#" className={`${isDarkMode ? 'text-[#b388ff]' : 'text-purple-600'} hover:underline`}>Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

