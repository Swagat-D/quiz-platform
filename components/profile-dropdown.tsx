// components/profile-dropdown.tsx
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
  const [imageError, setImageError] = useState(false)
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

  useEffect(() => {
    // Reset image error when user changes
    setImageError(false)
  }, [session?.user?.image])

  const handleEditProfile = () => {
    setShowEditProfile(true)
    setIsOpen(false)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const renderAvatar = () => {
    if (imageError || !session?.user?.image) {
      return <User className="h-5 w-5" />
    }
    
    return (
      <div className="relative w-6 h-6 rounded-full overflow-hidden">
        <Image
          src={avatarUrl}
          alt={username}
          width={24}
          height={24}
          className="rounded-full object-cover"
          onError={handleImageError}
          unoptimized={true} // Skip Next.js image optimization if having issues
        />
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="text-[#e0e0e0] hover:text-white hover:bg-purple-500/10"
        onClick={() => setIsOpen(!isOpen)}
      >
        {renderAvatar()}
      </Button>
      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-72 bg-[#242b3d] border-purple-500/20 text-[#e0e0e0] shadow-lg rounded-md overflow-hidden">
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              {imageError || !session?.user?.image ? (
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-purple-400" />
                </div>
              ) : (
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={avatarUrl}
                    alt={username}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    onError={handleImageError}
                    unoptimized={true}
                  />
                </div>
              )}
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
          avatarUrl={imageError ? "/placeholder.svg" : avatarUrl}
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