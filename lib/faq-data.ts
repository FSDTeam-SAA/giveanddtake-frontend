import type React from "react"

export const faqData = [
  {
    question: "How do I record an elevator video pitch?",
    answer: "You can record directly on our website or through the EVP mobile app.",
  },
  {
    question: "Who has access to my elevator video pitch?",
    answer: "Only you and recruiters you apply to will have access to your video pitch and resume.",
  },
  {
    question: "Can recruiters outside EVP view my video if I share the link in my CV?",
    answer: "No—only EVP-subscribed recruiters you've applied to can access your video.",
  },
  {
    question: "How do I delete my video pitch and profile?",
    answer: "Select 'Delete' (not 'Deactivate'). Your profile will be permanently removed after 30 days.",
  },
  {
    question: "How do I close my account?",
    answer: "Select 'Delete' (not 'Deactivate'). Your account will be permanently closed after 30 days.",
  },
]

export type FaqItem = {
  question: string
  answer: string | React.ReactElement
}
