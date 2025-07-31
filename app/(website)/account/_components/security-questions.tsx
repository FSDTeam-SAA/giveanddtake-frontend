"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"

interface SecurityQuestionsProps {
  onBack: () => void
  onComplete: (token: string) => void
}

export function SecurityQuestions({ onBack, onComplete }: SecurityQuestionsProps) {
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>(["", "", "", "", ""])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const session = useSession()

  const userEmail = session.data?.user?.email

  // Fetch security questions from API
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/default-security-questions`)
        const data = await response.json()

        if (data.success) {
          // Take first 5 questions or all available questions
          const availableQuestions = data.date || data.data || []
          setQuestions(availableQuestions.slice(0, 5))
        } else {
          throw new Error(data.message || "Failed to fetch questions")
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load security questions"
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [])

  // Handle answer change for specific question
  const handleAnswerChange = (index: number, value: string) => {
    const updatedAnswers = [...answers]
    updatedAnswers[index] = value
    setAnswers(updatedAnswers)
  }

  // Handle email change


  // Handle form submission - verify security answers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()



    // Validate that all questions have answers
    const filledAnswers = answers.filter((answer) => answer.trim() !== "")
    if (filledAnswers.length < questions.length) {
      toast.error("Please answer all security questions")
      return
    }

    // Prepare answers array (only the answers, not question-answer pairs)
    const answersArray = answers.slice(0, questions.length).map((answer) => answer.trim())

    setSubmitting(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/verify-security-answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          answers: answersArray,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(data.message || "Security answers verified successfully!")

        // Extract reset token from response
        const resetToken = data.data?.resetToken
        if (resetToken) {
          onComplete(resetToken)
        } else {
          throw new Error("Reset token not received from server")
        }
      } else {
        throw new Error(data.message || "Failed to verify security answers")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to verify security answers"
      toast.error(errorMessage)
      console.error("Security verification error:", err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading questions...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="text-center py-8">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={onBack} variant="outline">
            Go Back
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-4">
        <CardTitle className="text-2xl font-bold">Verify Your Security Questions</CardTitle>
        <CardDescription>
          Please answer your security questions to verify your identity and reset your password.
        </CardDescription>
      </div>
      <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          

          {/* Security Questions */}
          {questions.map((question, index) => (
            <div key={index} className="space-y-2">
              <Label htmlFor={`question-${index}`} className="text-sm font-medium text-blue-600">
                {question}
              </Label>
              <Input
                id={`question-${index}`}
                type="text"
                value={answers[index]}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder="Enter your answer"
                className="mt-2"
                required
              />
            </div>
          ))}

          <div className="flex space-x-4 pt-4">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="flex-1 bg-transparent"
              disabled={submitting}
            >
              Back
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify Answers"
              )}
            </Button>
          </div>
        </form>

        {/* Progress indicator */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Progress</span>
            <span>
              {answers.filter((answer) => answer.trim() !== "").length}/{questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(answers.filter((answer) => answer.trim() !== "").length / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
