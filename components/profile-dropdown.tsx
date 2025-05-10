// components/profile-dropdown.tsx - Update the component to use session data
'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { User } from 'lucide-react'
import Image from 'next/image'
import { useSession } from "next-auth/react"
import EditProfileSubpage from './edit-profile-subpage'
import { LogoutButton } from './logout-button'

export function ProfileDropdown() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const username = session?.user?.name || "User"
  const email = session?.user?.email || ""
  const avatarUrl = session?.user?.image || "/placeholder.svg"

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownRef])

  const handleEditProfile = () => {
    setShowEditProfile(true)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="text-[#e0e0e0] hover:text-white hover:bg-purple-500/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        {session?.user?.image ? (
          <Image
            src={avatarUrl}
            alt={username}
            width={24}
            height={24}
            className="rounded-full"
          />
        ) : (
          <User className="h-5 w-5" />
        )}
      </Button>
      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-72 bg-[#242b3d] border-purple-500/20 text-[#e0e0e0] shadow-lg rounded-md overflow-hidden">
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src={avatarUrl}
                alt={username}
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <h3 className="font-medium text-white">{username}</h3>
                <p className="text-sm text-gray-400">{email}</p>
              </div>
            </div>
            <div className="pt-2 space-y-2">
              <Button 
                variant="secondary" 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleEditProfile}
              >
                Edit Profile
              </Button>
              <LogoutButton 
                variant="outline" 
                className="w-full border-purple-500/20 text-white hover:bg-purple-500/10"
                text="Sign Out"
              />
            </div>
          </div>
        </Card>
      )}
      {showEditProfile && (
        <EditProfileSubpage
          username={username}
          avatarUrl={avatarUrl}
          onClose={() => setShowEditProfile(false)}
          onSave={async (newUsername, newAvatarUrl, selectedFile) => {
            // Handle saving the updated profile information to database
            try {
              const formData = new FormData();
              formData.append('username', newUsername);
              if (selectedFile) {
                formData.append('avatar', selectedFile);
              }
              
              const response = await fetch('/api/user/profile', {
                method: 'PUT',
                body: formData,
              });
              
              if (!response.ok) {
                throw new Error('Failed to update profile');
              }
              
              // Force refresh session to get updated data
              window.location.reload();
            } catch (error) {
              console.error('Error updating profile:', error);
              alert('Failed to update profile');
            }
            
            setShowEditProfile(false);
          }}
        />
      )}
    </div>
  )
}