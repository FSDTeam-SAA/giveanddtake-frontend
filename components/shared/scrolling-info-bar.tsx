"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function ScrollingInfoBar() {
  const items = [
    { text: "30-Second Free Elevator Pitch", link: "#" },
    { text: "Perfect Your Message", link: "#" },
    { text: "Elevate Your Business", link: "#" },
    { text: "30-Second Free Elevator Pitch", link: "#" },
    { text: "Perfect Your Message", link: "#" },
    { text: "Elevate Your Business", link: "#" },
  ];

  // Duplicate items to create a seamless loop
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div className="bg-v0-blue-500 text-white py-3 px-4 md:px-6 overflow-hidden relative">
      <motion.div
        className="flex items-center gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-100%"] }}
        transition={{
          x: {
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            duration: 30, // Adjust duration for speed
            ease: "linear",
          },
        }}
      >
        {duplicatedItems.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <Link
              href={item.link}
              className="flex items-center gap-2 hover:underline text-sm"
            >
              <span className="h-2 w-2 rounded-full bg-white" />
              {item.text}
            </Link>
            {index % 3 === 1 && ( // Add "Get Started" button after every second item in the original list
              <Button
                variant="secondary"
                className="bg-white text-v0-blue-500 hover:bg-gray-100 text-sm h-auto py-1.5 px-3"
              >
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
