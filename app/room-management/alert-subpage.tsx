import { useState } from 'react'
import { X, Send } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AlertSubpageProps {
  onClose: () => void;
  roomCode: string;
}

export default function AlertSubpage({ onClose, roomCode }: AlertSubpageProps) {
  const [alertMessage, setAlertMessage] = useState('')

  const handleSendAlert = () => {
    // TODO: Implement sending the alert to all participants
    console.log(`Sending alert to room ${roomCode}: ${alertMessage}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#242b3d] rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-purple-400">Send Alert</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6 text-purple-400" />
          </Button>
        </div>
        <Input
          placeholder="Enter alert message"
          value={alertMessage}
          onChange={(e) => setAlertMessage(e.target.value)}
          className="mb-4 bg-[#1a1f2e] border-purple-500/20 text-white"
        />
        <Button 
          onClick={handleSendAlert} 
          className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:opacity-90 text-white font-medium"
          disabled={!alertMessage.trim()}
        >
          <Send className="h-5 w-5 mr-2" />
          Send Alert
        </Button>
      </div>
    </div>
  )
}

