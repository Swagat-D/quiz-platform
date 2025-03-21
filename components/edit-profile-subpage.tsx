import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Camera, Eye, Upload } from 'lucide-react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface EditProfileSubpageProps {
  username: string
  avatarUrl: string
  onClose: () => void
  onSave: (newUsername: string, newAvatarUrl: string, selectedFile: File | null) => void
}

export default function EditProfileSubpage({
  username,
  avatarUrl,
  onClose,
  onSave
}: EditProfileSubpageProps) {
  const [newUsername, setNewUsername] = useState(username)
  const [newAvatarUrl, setNewAvatarUrl] = useState(avatarUrl)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = () => {
    onSave(newUsername, newAvatarUrl, selectedFile);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-[#242b3d] border-purple-500/20 text-[#e0e0e0]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold text-purple-400">Edit Profile</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6 text-purple-400" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <Image
                src={newAvatarUrl}
                alt={newUsername}
                width={100}
                height={100}
                className="rounded-full mb-4"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-white">
                        <Eye className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#242b3d] border-purple-500/20 text-[#e0e0e0]">
                      <DialogHeader>
                        <DialogTitle className="text-purple-400">Profile Photo</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Your current profile photo
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex items-center justify-center p-6">
                        <Image
                          src={newAvatarUrl}
                          alt={newUsername}
                          width={300}
                          height={300}
                          className="rounded-lg"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div>
            <Label htmlFor="username" className="mb-2">Username</Label>
            <Input
              id="username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="bg-[#1a1f2e] border-purple-500/20 text-white"
            />
          </div>
          <Button onClick={handleSave} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

