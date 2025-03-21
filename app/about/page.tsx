import Navbar from '@/components/navbar'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <Card className="bg-[#242b3d] border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-[#b388ff]">About DevQuizWare</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#e0e0e0] mb-4">
              DevQuizWare is an interactive platform designed to help developers enhance their coding skills through engaging quizzes and challenges.
            </p>
            <p className="text-[#e0e0e0] mb-4">
              Our mission is to make learning and practicing coding concepts fun, accessible, and effective for developers of all levels.
            </p>
            <p className="text-[#e0e0e0]">
              Whether you&#39;re a beginner looking to reinforce your knowledge or an experienced developer aiming to stay sharp, DevQuizWare has something for everyone.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

