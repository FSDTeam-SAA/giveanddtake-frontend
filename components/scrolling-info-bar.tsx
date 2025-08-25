"use client";
import { useEffect, useState } from "react";

export function ScrollingInfoBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const messages = [
    "🚀 Find your dream job with our AI-powered matching system",
    "💼 Connect with top recruiters and companies worldwide",
    "📈 Boost your career with professional elevator pitches",
    "🎯 Get matched with opportunities that fit your skills",
    "🌟 Join thousands of successful job seekers on our platform",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="bg-[#4B98DE] text-white py-2 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center">
          <div className="animate-pulse">
            <p className="text-sm font-medium text-center transition-all duration-500">
              {messages[currentIndex]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
