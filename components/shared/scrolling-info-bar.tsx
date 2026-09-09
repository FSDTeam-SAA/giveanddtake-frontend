"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Role = "candidate" | "recruiter" | "company";

type ScrollingInfo = {
  enabled: boolean;
  speedSeconds: number;
  groups: Array<{
    role: Role;
    buttonText: string;
    texts: string[];
  }>;
};

const DEFAULT_SCROLLING_INFO: ScrollingInfo = {
  enabled: true,
  speedSeconds: 70,
  groups: [
    {
      role: "candidate",
      buttonText: "Candidates Access",
      texts: [
        "Amplify your Profile", "IT", "Data", "AI", "Leadership", "Education",
        "Engineering", "Aviation", "Oil & Gas", "Health Care", "Social Care",
        "Legal", "Tradesmen", "Film & TV", "Marketing", "Catering", "Hospitality",
        "Content Creation", "Events Management", "Compères", "Multimedia",
        "Pharmaceutical", "Medical", "Leadership", "Admin", "Graduates", "Trainees",
        "Apprentices", "Experienced Professionals", "All Skills & All Levels Welcome",
        "Record Your Free 30-Second Elevator Pitch", "Apply to Jobs", "Start your Dream Job",
      ],
    },
    {
      role: "recruiter",
      buttonText: "Recruiters Access",
      texts: [
        "Post Job Adverts", "Hear the Pitch behind the Resume",
        "One-click Candidate feedback", "All job posts free until January 2027",
      ],
    },
    {
      role: "company",
      buttonText: "Companies Access",
      texts: [
        "60-Seconds Company Culture Pitch", "Post Job Adverts",
        "Hear the Pitch behind the Resume", "One-click Candidate feedback",
        "All job posts free until January 2027",
      ],
    },
  ],
};

const isScrollingInfo = (value: unknown): value is ScrollingInfo => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ScrollingInfo>;
  return (
    typeof candidate.enabled === "boolean" &&
    typeof candidate.speedSeconds === "number" &&
    candidate.speedSeconds >= 10 &&
    candidate.speedSeconds <= 300 &&
    Array.isArray(candidate.groups) &&
    candidate.groups.length === 3 &&
    candidate.groups.every(
      (group) =>
        group &&
        ["candidate", "recruiter", "company"].includes(group.role) &&
        typeof group.buttonText === "string" &&
        Array.isArray(group.texts) &&
        group.texts.every((text) => typeof text === "string")
    )
  );
};

export function ScrollingInfoBar() {
  const [settings, setSettings] = useState<ScrollingInfo>(DEFAULT_SCROLLING_INFO);

  useEffect(() => {
    const controller = new AbortController();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) return () => controller.abort();

    void fetch(`${baseUrl.replace(/\/$/, "")}/scrolling-info`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load scrolling bar");
        return response.json();
      })
      .then((response) => {
        if (isScrollingInfo(response?.data)) setSettings(response.data);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Keep the built-in content when the API is temporarily unavailable.
      });

    return () => controller.abort();
  }, []);

  if (!settings.enabled) return null;

  const sequence = settings.groups.flatMap((group) => [
    { type: "button", role: group.role, text: group.buttonText },
    ...group.texts.map((text) => ({ type: "text", role: group.role, text })),
  ]);
  const duplicatedItems = [...sequence, ...sequence];

  return (
    <div className="bg-primary text-white py-3 px-4 md:px-6 overflow-hidden relative">
      <motion.div
        className="flex items-center gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: settings.speedSeconds,
            ease: "linear",
          },
        }}
        style={{ width: "max-content" }}
      >
        {duplicatedItems.map((item, index) => (
          <div key={`${item.role}-${item.type}-${index}`} className="flex items-center gap-4">
            {item.type === "button" ? (
              <Button
                asChild
                variant="secondary"
                className="bg-white text-v0-blue-500 hover:bg-gray-100 text-sm h-auto py-1.5 px-3"
              >
                <Link href={`/register?role=${item.role}`}>
                  {item.text}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <span className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-white" />
                {item.text}
              </span>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
