"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"

interface CustomCalendarProps {
  selectedDate?: Date
  onDateSelect: (date: Date | undefined) => void
}

export default function CustomCalendar({ selectedDate, onDateSelect }: CustomCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(selectedDate)

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    onDateSelect(newDate)
  }

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={handleDateSelect}
      disabled={(date) => date < new Date()}
      className="rounded-md border"
    />
  )
}
