// app/page.tsx - Updated Landing Page
import LandingNav from "@/components/landing-nav"
import { Button } from "@/components/ui/button"
import { ArrowRight, Code, Users, Brain, Zap, Play, Star, Trophy, BookOpen, Clock, Shield, ChevronDown } from 'lucide-react'
import Link from "next/link"

export default function LandingPage() {
  const stats = [
    { number: "10K+", label: "Active Developers", icon: <Users className="h-5 w-5" /> },
    { number: "500+", label: "Quiz Challenges", icon: <BookOpen className="h-5 w-5" /> },
    { number: "50K+", label: "Questions Solved", icon: <Trophy className="h-5 w-5" /> },
    { number: "24/7", label: "Learning Support", icon: <Clock className="h-5 w-5" /> }
  ];

  const features = [
    {
      icon: <Code className="h-8 w-8" />,
      title: "Interactive Coding Challenges",
      description: "Engage with real-world coding scenarios and sharpen your skills through hands-on practice.",
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Community-Driven Learning",
      description: "Connect with fellow developers, share knowledge, and grow together in a supportive environment.",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "Adaptive Learning Paths",
      description: "Personalized quiz experiences that adapt to your skill level and learning pace.",
      color: "from-pink-500 to-red-600"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Senior Frontend Developer",
      company: "TechCorp",
      content: "DevQuizWare transformed my learning journey. The interactive challenges are perfectly crafted.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "Full Stack Engineer",
      company: "StartupXYZ",
      content: "The community aspect is incredible. I've learned more here than in traditional courses.",
      rating: 5
    },
    {
      name: "Emily Johnson",
      role: "Backend Developer",
      company: "DataFlow Inc",
      content: "Adaptive learning paths helped me focus on areas I needed to improve most.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1c] via-[#1a1f2e] to-[#2a1f3d] text-white overflow-hidden">
      <LandingNav />
      
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-20 w-24 h-24 bg-pink-500/10 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl animate-pulse delay-3000"></div>
      </div>

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 md:px-6">
          <div className="container mx-auto text-center">
            <div className="inline-block p-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-8">
              <div className="px-6 py-2 bg-black rounded-full text-sm">
                🚀 Join 10K+ developers already learning
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Level Up Your
              </span>
              <br />
              <span className="text-white">Dev Skills</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Master coding through interactive challenges, connect with a thriving community, 
              and accelerate your career with <span className="text-purple-400 font-semibold">DevQuizWare</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button asChild size="lg" className="group bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-4 text-lg font-semibold transition-all transform hover:scale-105">
                <Link href="/signup">
                  Start Learning Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="group border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10 px-8 py-4 text-lg font-semibold">
                <Link href="#demo">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="flex items-center justify-center mb-2 text-purple-400 group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white">{stat.number}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-6 w-6 text-gray-400" />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-black/20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Powerful Features
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Everything you need to master coding and advance your developer career
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-purple-500/30 transition-all group">
                  <div className={`bg-gradient-to-r ${feature.color} p-4 rounded-xl inline-block mb-6 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Loved by Developers
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                See what our community has to say about their learning journey
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-purple-500/30 transition-all transform hover:scale-105">
                  <div className="flex items-center gap-2 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 italic">&quot;{testimonial.content}&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">{testimonial.name[0]}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-gray-400 text-sm">{testimonial.role} at {testimonial.company}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section id="community" className="py-20 bg-black/20">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Join Our Tech Community
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
              DevQuizWare is proudly part of the DevSomeWare community. Connect with like-minded 
              developers, access exclusive resources, and stay updated with the latest in tech.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button asChild size="lg" className="group bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-4 text-lg font-semibold">
                <Link href="/community">
                  <Zap className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  Visit Community
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10 px-8 py-4 text-lg font-semibold">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 text-gray-400 flex-wrap">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>Secure Platform</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                <span>Industry Recognition</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>Global Community</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-16 border-t border-white/10 bg-black/40">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  DevQuizWare
                </span>
              </div>
              <p className="text-gray-400">
                Empowering developers worldwide with interactive learning experiences.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/challenges" className="hover:text-white transition-colors">Challenges</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/discord" className="hover:text-white transition-colors">Discord</Link></li>
                <li><Link href="/github" className="hover:text-white transition-colors">GitHub</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2024 DevQuizWare. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}