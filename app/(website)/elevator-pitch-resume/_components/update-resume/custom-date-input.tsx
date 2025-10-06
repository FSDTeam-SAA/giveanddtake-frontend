"use client"

import type React from "react"
import { Input } from "@/components/ui/input"

export const CustomDateInput = ({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.replace(/\D/g, "") // Remove non-digits

    if (inputValue.length >= 2) {
      inputValue = inputValue.slice(0, 2) + "/" + inputValue.slice(2, 6)
    }

    if (inputValue.length > 7) {
      inputValue = inputValue.slice(0, 7)
    }

    onChange(inputValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const cursorPosition = (e.target as HTMLInputElement).selectionStart || 0
      if (cursorPosition === 3 && value.charAt(2) === "/") {
        e.preventDefault()
        onChange(value.slice(0, 2))
      }
    }
  }

  return (
    <Input
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      maxLength={7}
    />
  )
}
