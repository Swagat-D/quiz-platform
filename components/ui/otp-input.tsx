"use client"

import { useRef, useState } from 'react'
import { Input } from './input'

interface OTPInputProps {
  length?: number
  onComplete?: (otp: string) => void
}

export function OTPInput({ length = 6, onComplete }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return
    
    const newOtp = [...otp]
    newOtp[index] = value.substring(value.length - 1)
    setOtp(newOtp)

    // Move to next input if value is entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onComplete when all digits are filled
    if (newOtp.every(digit => digit !== '')) {
      onComplete?.(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const pastedDigits = pastedData.slice(0, length).split('')

    if (pastedDigits.every(digit => !isNaN(Number(digit)))) {
      const newOtp = [...otp]
      pastedDigits.forEach((digit, index) => {
        newOtp[index] = digit
      })
      setOtp(newOtp)

      // Focus last filled input
      const lastFilledIndex = Math.min(pastedDigits.length - 1, length - 1)
      inputRefs.current[lastFilledIndex]?.focus()

      if (newOtp.every(digit => digit !== '')) {
        onComplete?.(newOtp.join(''))
      }
    }
  }

  return (
    <div className="flex gap-2">
      {otp.map((digit, index) => (
        <Input
          key={index}
          ref={el => inputRefs.current[index] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(index, e.target.value)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-12 h-12 text-center text-lg font-semibold bg-[#1a1f2e] border-purple-500/20 text-[#e0e0e0]"
        />
      ))}
    </div>
  )
}

