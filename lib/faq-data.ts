import type React from "react";

export const faqData = [
  {
    question: "How do I record an elevator video pitch?",
    answer: "You can record this on our site or through the mobile app.",
  },
  {
    question: "Who has access to my elevator video pitch?",
    answer:
      "Only you have access to your Elevator Video Pitch© video and resume, and any recruiter when you apply for a role with them.",
  },
  {
    question:
      "Can recruiters off the platform view my elevator video pitch if I include the link in my CV?",
    answer:
      "Recruiters who subscribe to EVP and who you’ve applied to a job with will have access to your pitch. A recruiter will be directed to subscribe to EVP if you apply to a job with them that has not been advertised on our site.",
  },
  {
    question: "How do I delete my elevator video pitch and profile?",
    answer:
      "Select ‘delete’ (not deactivate) and your profile will be removed after 30 days.",
  },
  {
    question: "How do I deactivate my account to take a break from EVP?",
    answer:
      "Select ‘deactivate’ (not delete) and your profile will be hidden from public view until you restore it.",
  },
  {
    question:
      "What is the difference between account deletion and deactivation?",
    answer:
      "Deletion means your account will be permanently removed after 30 days; deactivation pauses your account until you reactivate it.",
  },
  {
    question: "How can I receive a refund for my subscriptions?",
    answer:
      "We have deliberately set our subscription fees low to ensure millions of jobseekers across the globe find a job fast. 30 Seconds is sufficient time to articulate your skills to recruiters so please consider staying on a free plan to avoid undue service charges to your pockets in the event you subscribe and then require a refund. Please reach out to us via our contact page to discuss your refund request.",
  },
  {
    question: "Do all recruiters get to view my elevator video pitch?",
    answer:
      "Only recruiters whom you’ve applied to a job with on EVP’s platform will have access.",
  },
  {
    question: "Is Elevator Video Pitch Ltd. a registered data controller?",
    answer:
      "Yes, we are registered with the UK Information Commissioners Office as a data controller.",
  },
  {
    question: "What is the minimum age for using the site?",
    answer: `
You must be at least 16 years old to use Elevator Video Pitch. In regions where the law requires you to be older than 16 to use our services without parental consent, the minimum age is the age at which such parental consent is not required.

 `,
  },
  {
    question: "How do I change my password?",
    answer: "Select ‘forgot my password’ to start changing your password.",
  },
  {
    question: "What should I wear for my elevator video pitch recording?",
    answer: "Dress up for the sector and role you’re aspiring to.",
  },
  {
    question: "How can I replace my Elevator Video Pitch?",
    answer:
      "Delete the old pitch on our site and upload a new one. Your video is encrypted and scrambled for security.",
  },
  {
    question: "Do you sell our data to third parties?",
    answer:
      "No, we do not sell your data to third parties. Please view our Privacy Policy.",
  },
  {
    question: "Where can I view my payments history?",
    answer: "On your payments history page.",
  },
  {
    question: "Can I send a message to other members?",
    answer:
      "Members can only send their profile and application to a recruiter for a specific role and respond to follow-up messages offline.",
  },
  {
    question: "Where can I view my messages?",
    answer: "In your messages panel.",
  },
];

export type FaqItem = {
  question: string;
  answer: string | React.ReactElement;
};
