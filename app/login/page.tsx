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
    router.push('/dashboard');
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

