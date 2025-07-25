"use client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { VideoCarousel } from "./hero-video-carousel";
import { useSession } from "next-auth/react";

export function HeroSection() {
  const session = useSession();
  console.log(session);
  const videos = [
    {
      src: "https://www.w3schools.com/html/mov_bbb.mp4",
      alt: "Big Buck Bunny video",
    },
    {
      src: "https://www.w3schools.com/html/movie.mp4",
      alt: "Sample movie video",
    },
    {
      src: "/placeholder.svg?height=500&width=700",
      alt: "Job search video placeholder",
    },
  ];

  return (
    <section className="container relative w-full py-12 md:py-24 lg:py-32 overflow-hidden">
      {/* Background abstract shapes - more subtle and blue */}
      <Image
        src="/assets/hero.png"
        alt="Abstract blue circle"
        width={200}
        height={200}
        className="absolute top-1/2 left-2/4 -translate-x-1/2 -translate-y-1/2 border border-[#9EC7DC] rounded-full p-2 w-[50px] h-[50px]"
      />
      <Image
        src="/assets/hero.png"
        alt="Abstract blue circle"
        width={150}
        height={150}
        className="absolute top-[60%] left-1/3 -translate-x-1/2 -translate-y-1/2 ml-[80px] -mt-[40px] border border-[#9EC7DC] rounded-full p-2 z-50 w-[80px] h-[80px]"
      />
      <Image
        src="/assets/hero.png"
        alt="Abstract blue circle"
        width={100}
        height={100}
        className="absolute bottom-1/4 left-2/4 -translate-x-1/2 translate-y-1/2 border border-[#9EC7DC] rounded-full p-2"
      />
      <div className="container px-4 md:px-6 grid lg:grid-cols-2 gap-8 items-center relative z-10">
        <div className="flex flex-col space-y-4 text-center lg:text-left">
          <h1 className="text-[40px] font-bold tracking-tighter leading-[120%] sm:text-4xl md:text-5xl lg:text-6xl/none text-[#2B7FD0]">
            Shape Your Future with the Right Elevator Pitch
          </h1>
          <p className="text-[16px] font-normal leading-[150%] text-[#595959]">
            Unlock your full potential and begin creating the life you truly
            deserve — one meaningful opportunity at a time.
          </p>
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="space-y-1">
                  <Label
                    htmlFor="job-title"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Job Title
                  </Label>
                  <Input
                    id="job-title"
                    placeholder="Input Job type"
                    className="w-full border-none focus-visible:ring-0"
                  />
                </div>
                <div className="space-y-1 border-l pl-4 border-gray-200">
                  <Label
                    htmlFor="location"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="Search Location"
                    className="w-full border-none focus-visible:ring-0"
                  />
                </div>
              </div>
              <Button className="w-full bg-v0-blue-500 hover:bg-v0-blue-600 text-white">
                Search
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-center lg:justify-start text-sm mt-[48px]">
              <span className="font-medium text-gray-700">
                Trending Keywords:
              </span>
              <Badge
                variant="outline"
                className="px-3 py-1 rounded-full border-gray-400 text-gray-700 bg-gray-100"
              >
                Web Development
              </Badge>
              <Badge
                variant="outline"
                className="px-3 py-1 rounded-full border-gray-400 text-gray-700 bg-gray-100"
              >
                UI/UX Design
              </Badge>
            </div>
          </div>
        </div>
        {/* Replaced the static image with the VideoCarousel component */}
        <div>
          <div className="absolute ml-[70px] -mt-[10px]">
            <Image
              src="/assets/hero-video.svg"
              alt="Job search video placeholder"
              width={700}
              height={500}
              className="w-full h-[581px] rounded-xl"
            />
          </div>
          <div className="relative p-4">
            <VideoCarousel videos={videos} />
          </div>
        </div>
      </div>
    </section>
  );
}
