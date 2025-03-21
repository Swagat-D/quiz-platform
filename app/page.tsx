import LandingNav from "@/components/landing-nav"
import { Button } from "@/components/ui/button"
import { ArrowRight, Code, Users, Brain, Zap } from 'lucide-react'
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#1a1f2e]">
      <LandingNav />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 px-4 md:px-6">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-[#b388ff] sm:text-5xl md:text-6xl lg:text-7xl">
              Level Up Your Dev Skills with DevQuizWare
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl md:text-2xl text-[#e0e0e0]">
              Challenge yourself, learn new concepts, and become a better developer with our interactive coding quizzes tailored for the DevSomeWare community.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto">
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-purple-500 text-purple-500 hover:bg-purple-500/10 w-full sm:w-auto">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-[#242b3d]">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold text-center text-[#b388ff] mb-12">Features</h2>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <Code className="h-12 w-12 text-[#b388ff] mb-4" />
                <h3 className="text-xl font-bold text-[#e0e0e0] mb-2">Interactive Coding Challenges</h3>
                <p className="text-[#a0a0a0]">Engage with real-world coding scenarios and sharpen your skills through hands-on practice.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Users className="h-12 w-12 text-[#b388ff] mb-4" />
                <h3 className="text-xl font-bold text-[#e0e0e0] mb-2">Community-Driven Learning</h3>
                <p className="text-[#a0a0a0]">Connect with fellow developers, share knowledge, and grow together in a supportive environment.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Brain className="h-12 w-12 text-[#b388ff] mb-4" />
                <h3 className="text-xl font-bold text-[#e0e0e0] mb-2">Adaptive Learning Paths</h3>
                <p className="text-[#a0a0a0]">Personalized quiz experiences that adapt to your skill level and learning pace.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="community" className="w-full py-12 md:py-24 lg:py-32 bg-[#1a1f2e]">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold text-[#b388ff] mb-6">Join Our Tech Community</h2>
            <p className="text-xl text-[#e0e0e0] mb-10 max-w-3xl mx-auto">
              DevQuizWare is proudly part of the DevSomeWare community. Connect with like-minded developers, access exclusive resources, and stay updated with the latest in tech.
            </p>
            <Button asChild size="lg" className="bg-[#b388ff] hover:bg-[#9c5cff] text-[#1a1f2e]">
              <Link href="/community">
                Visit Community
                <Zap className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="w-full py-6 bg-[#242b3d] border-t border-purple-500/20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-[#a0a0a0]">© 2024 DevQuizWare. All rights reserved.</p>
            <nav className="flex gap-4 sm:gap-6 mt-4 md:mt-0">
              <Link className="text-sm text-[#a0a0a0] hover:underline underline-offset-4" href="#">
                Terms of Service
              </Link>
              <Link className="text-sm text-[#a0a0a0] hover:underline underline-offset-4" href="#">
                Privacy Policy
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}

