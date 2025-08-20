"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function ScrollingInfoBar() {
  const items = [
    {
      text: "Companies showcase their culture with a video pitch",
      role: "company",
    },
    {
      text: "Recruiters present top opportunities through video",
      role: "recruiter",
    },
    {
      text: "Candidates stand out with a 60-second elevator pitch",
      role: "candidate",
    },
    {
      text: "Attach your pitch video directly to your CV/resume",
      role: "candidate",
    },
    {
      text: "Build trust instantly with authentic video introductions",
      role: "company",
    },
    {
      text: "Connect faster — video pitches cut through the noise",
      role: "recruiter",
    },
  ];

  // Duplicate items to create a seamless loop
  const duplicatedItems = [...items, ...items];

  const roleButtonText: Record<string, string> = {
    company: "Sign Up as Company",
    recruiter: "Sign Up as Recruiter",
    candidate: "Sign Up as Candidate",
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
            <Button
              asChild
              variant="secondary"
              className="bg-white text-v0-blue-500 hover:bg-gray-100 text-sm h-auto py-1.5 px-3"
            >
              <Link href={`/signup?role=${item.role}`}>
                {roleButtonText[item.role]}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
