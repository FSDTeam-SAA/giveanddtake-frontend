"use client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export function HeroSection() {
  const session = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialJobTitle = searchParams.get("title") || "";
  const initialLocation = searchParams.get("location") || "";
  const [jobTitleInput, setJobTitleInput] = useState(initialJobTitle);
  const [locationInput, setLocationInput] = useState(initialLocation);

  useEffect(() => {
    setJobTitleInput(searchParams.get("title") || "");
    setLocationInput(searchParams.get("location") || "");
  }, [searchParams]);

  const handleSearch = () => {
    const currentParams = new URLSearchParams();
    if (jobTitleInput) {
      currentParams.set("title", jobTitleInput);
    }
    if (locationInput) {
      currentParams.set("location", locationInput);
    }
    currentParams.set("page", "1");
    router.push(`/alljobs?${currentParams.toString()}`);
  };

  const bubbleVariants = {
    float: {
      y: [0, -5, 0],
      transition: {
        duration: 3,
        repeat: Number.POSITIVE_INFINITY,
        ease: [0.4, 0.0, 0.2, 1] as const,
      },
    },
    floatSlow: {
      y: [0, -5, 0],
      transition: {
        duration: 4,
        repeat: Number.POSITIVE_INFINITY,
        ease: [0.4, 0.0, 0.2, 1] as const,
      },
    },
    floatFast: {
      y: [0, -4, 0],
      transition: {
        duration: 2.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: [0.4, 0.0, 0.2, 1] as const,
      },
    },
  };

  return (
    <section className="container relative w-full px-4 py-8 md:py-12 lg:py-24 overflow-hidden">
      {/* Top left area bubbles */}
      <motion.div
        variants={bubbleVariants}
        animate="float"
        className="absolute top-[10%] left-[5%] hidden md:block"
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={60}
          height={60}
          className="border border-[#9EC7DC] rounded-full p-2 w-[25px] h-[25px] md:w-[35px] md:h-[35px] lg:w-[45px] lg:h-[45px] opacity-70"
        />
      </motion.div>

      {/* Top right area bubbles */}
      <motion.div
        variants={bubbleVariants}
        animate="floatSlow"
        className="absolute top-[15%] right-[10%] hidden lg:block"
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={80}
          height={80}
          className="border border-[#9EC7DC] rounded-full p-2 w-[40px] h-[40px] lg:w-[60px] lg:h-[60px] opacity-80"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="floatFast"
        className="absolute top-[25%] right-[25%] hidden md:block"
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={40}
          height={40}
          className="border border-[#9EC7DC] rounded-full p-2 w-[20px] h-[20px] md:w-[30px] md:h-[30px] opacity-60"
        />
      </motion.div>

      {/* Center right area bubbles (replacing the commented image) */}
      <motion.div
        variants={bubbleVariants}
        animate="float"
        className="absolute top-[40%] right-[15%] hidden md:block"
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={100}
          height={100}
          className="border border-[#9EC7DC] rounded-full p-2 w-[50px] h-[50px] md:w-[70px] md:h-[70px] lg:w-[90px] lg:h-[90px]"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="floatSlow"
        className="absolute top-[55%] right-[8%] hidden lg:block"
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={60}
          height={60}
          className="border border-[#9EC7DC] rounded-full p-2 w-[35px] h-[35px] lg:w-[50px] lg:h-[50px] opacity-75"
        />
      </motion.div>

      {/* Original bubbles with enhanced animations */}
      <motion.div
        variants={bubbleVariants}
        animate="floatFast"
        className="absolute top-[320px] hidden md:block left-[50%] lg:left-[550px] -translate-x-1/2 -translate-y-1/2 lg:ml-[40px]"
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={200}
          height={200}
          className="border border-[#9EC7DC] rounded-full p-2 w-[30px] h-[30px] md:w-[40px] md:h-[40px] lg:w-[50px] lg:h-[50px]"
        />
      </motion.div>

      {/* <motion.div
        variants={bubbleVariants}
        animate="float"
        className="absolute top-[55%] hidden lg:block left-[30%] lg:left-[400px] lg:ml-[80px] -mt-[40px]"
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={150}
          height={150}
          className="border border-[#9EC7DC] rounded-full p-2 w-[40px] h-[40px] md:w-[60px] md:h-[60px] lg:w-[80px] lg:h-[80px]"
        />
      </motion.div> */}

      <motion.div
        variants={bubbleVariants}
        animate="floatSlow"
        className="absolute hidden md:block bottom-[200px] md:bottom-[300px] left-[60%] lg:left-[690px]"
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={100}
          height={100}
          className="border border-[#9EC7DC] rounded-full p-2 w-[30px] h-[30px] md:w-[50px] md:h-[50px] lg:w-[100px] lg:h-[100px]"
        />
      </motion.div>

      {/* Bottom area bubbles */}
      <motion.div
        variants={bubbleVariants}
        animate="floatFast"
        className="absolute bottom-[10%] left-[15%] hidden md:block"
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={50}
          height={50}
          className="border border-[#9EC7DC] rounded-full p-2 w-[25px] h-[25px] md:w-[35px] md:h-[35px] opacity-65"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="float"
        className="absolute bottom-[15%] right-[30%] hidden lg:block"
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={70}
          height={70}
          className="border border-[#9EC7DC] rounded-full p-2 w-[40px] h-[40px] lg:w-[55px] lg:h-[55px] opacity-70"
        />
      </motion.div>

      <div className="container px-0 md:px-6 grid lg:grid-cols-2 gap-8 items-center relative z-10">
        <div className="flex flex-col text-center lg:text-left">
          <h1 className="text-2xl font-bold leading-[120%] sm:text-3xl md:text-[40px] text-[#2B7FD0]">
            Shape Your Future <br className="hidden sm:block" /> with the Right
            Elevator Pitch
          </h1>
          <p className="text-sm md:text-[16px] font-normal leading-[150%] text-[#595959] max-w-[355px] mx-auto lg:mx-0 mt-6 md:mt-[48px]">
            Unlock your full potential and begin creating the life you truly
            deserve — one meaningful opportunity at a time.
          </p>
          {session?.status === "authenticated" && (
            <div className="w-full lg:max-w-[396px] mt-8 md:mt-[48px] mx-auto lg:mx-0">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                  <div className="space-y-1 text-start">
                    <Label
                      htmlFor="job-title"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Job Title
                    </Label>
                    <input
                      id="job-title"
                      placeholder="Input Job type"
                      className="w-full border-none h-[24px] px-0 !focus:outline-none !focus:ring-0 outline-none"
                      value={jobTitleInput}
                      onChange={(e) => setJobTitleInput(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 sm:border-l sm:pl-4 border-gray-200  text-start">
                    <Label
                      htmlFor="location"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Location
                    </Label>
                    <input
                      id="location"
                      placeholder="Search Location"
                      className="w-full border-none h-[24px] px-0 !focus:outline-none !focus:ring-0 outline-none"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-start justify-start">
                  <Button
                    onClick={handleSearch}
                    className="w-full sm:w-[160px] bg-[#2B7FD0] hover:bg-[#2B7FD0]/80 h-[51px] text-white rounded-[8px] mt-2 sm:mt-6"
                  >
                    Search
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center justify-center lg:justify-start text-xs sm:text-sm mt-6 md:mt-[48px]">
                <span className="font-medium text-[#595959]">
                  Trending Keywords:
                </span>
                <Badge
                  variant="outline"
                  className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border-[#BAC4F6] text-[#999999] bg-gray-100"
                >
                  Web Development
                </Badge>
                <Badge
                  variant="outline"
                  className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border-[#BAC4F6] text-[#999999] bg-gray-100"
                >
                  UI/UX Design
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
