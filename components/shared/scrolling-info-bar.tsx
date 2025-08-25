"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function ScrollingInfoBar() {
  const items = [
    {
      text: "30-Second free Elevator Pitch (pay to upgrade)",
      role: "candidate",
      showButton: false,
    },
    {
      text: "Amplify your profile",
      role: "candidate",
      showButton: false,
    },
    {
      text: "Pitch to recruiters",
      role: "candidate",
      showButton: false,
    },
    {
      text: "Get a job!",
      role: "candidate",
      showButton: true,
    },
    {
      text: "Hear the human behind the profile",
      role: "recruiter",
      showButton: false,
    },
    {
      text: "Screen candidates online",
      role: "recruiter",
      showButton: false,
    },
    {
      text: "One-click candidate feedback",
      role: "recruiter",
      showButton: false,
    },
    {
      text: "Improve your brand",
      role: "company",
      showButton: false,
    },
    {
      text: "30-Second free Elevator Pitch (pay to upgrade)",
      role: "recruiter",
      showButton: true,
    },
  ];

  // Duplicate items to create a seamless loop
  const duplicatedItems = [...items, ...items];

  const roleButtonText: Record<string, string> = {
    company: "Sign Up as Recruiters & Companies",
    recruiter: "Sign Up as Recruiters & Companies",
    candidate: "Sign Up as Candidates",
  };

  return (
    <div className="bg-primary text-white py-3 px-4 md:px-6 overflow-hidden relative">
      <motion.div
        className="flex items-center gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-100%"] }}
        transition={{
          x: {
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            duration: 40, // slowed down a bit for readability
            ease: "linear",
          },
        }}
      >
        {duplicatedItems.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-white" />
              {item.text}
            </span>

            {/* Role-based signup button */}
            {item.showButton && (
              <Button
                asChild
                variant="secondary"
                className="bg-white text-v0-blue-500 hover:bg-gray-100 text-sm h-auto py-1.5 px-3"
              >
                <Link href={`/register?role=${item.role}`}>
                  {roleButtonText[item.role]}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
