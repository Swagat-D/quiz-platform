import Navbar from '@/components/navbar'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <Card className="bg-[#242b3d] border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-[#b388ff]">Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-[#e0e0e0] mb-2">Name</label>
                <Input id="name" placeholder="Your name" className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]" />
              </div>
              <div>
                <label htmlFor="email" className="block text-[#e0e0e0] mb-2">Email</label>
                <Input id="email" type="email" placeholder="Your email" className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]" />
              </div>
              <div>
                <label htmlFor="message" className="block text-[#e0e0e0] mb-2">Message</label>
                <Textarea id="message" placeholder="Your message" className="bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]" />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">Send Message</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

