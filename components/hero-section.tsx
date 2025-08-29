"use client"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, Variants } from "framer-motion"

export function HeroSection() {
  const session = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialJobTitle = searchParams.get("title") || ""
  const initialLocation = searchParams.get("location") || ""
  const [jobTitleInput, setJobTitleInput] = useState(initialJobTitle)
  const [locationInput, setLocationInput] = useState(initialLocation)

  useEffect(() => {
    setJobTitleInput(searchParams.get("title") || "")
    setLocationInput(searchParams.get("location") || "")
  }, [searchParams])

  const handleSearch = () => {
    const currentParams = new URLSearchParams()
    if (jobTitleInput) {
      currentParams.set("title", jobTitleInput)
    }
    if (locationInput) {
      currentParams.set("location", locationInput)
    }
    currentParams.set("page", "1")
    router.push(`/alljobs?${currentParams.toString()}`)
  }

  const bubbleVariants: Variants = {
    float: {
      y: [0, -8, 0],
      x: [0, 2, 0],
      rotate: [0, 5, 0],
      transition: {
        duration: 4,
        repeat: Number.POSITIVE_INFINITY,
        ease: [0.4, 0.0, 0.2, 1] as const,
      },
    },
    floatSlow: {
      y: [0, -12, 0],
      x: [0, -3, 0],
      rotate: [0, -3, 0],
      transition: {
        duration: 6,
        repeat: Number.POSITIVE_INFINITY,
        ease: [0.4, 0.0, 0.2, 1] as const,
      },
    },
    floatFast: {
      y: [0, -6, 0],
      x: [0, 4, 0],
      rotate: [0, 8, 0],
      transition: {
        duration: 3,
        repeat: Number.POSITIVE_INFINITY,
        ease: [0.4, 0.0, 0.2, 1] as const,
      },
    },
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
      },
    },
  }

  const formVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
        delay: 0.4,
      },
    },
  }

  const badgeVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
      },
    },
  }

  return (
    <section className="container relative w-full px-4 py-8 md:py-12 lg:py-24 overflow-hidden min-h-[70vh]">
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-blue-100/20 pointer-events-none"
        suppressHydrationWarning={true}
      />

      <motion.div
        variants={bubbleVariants}
        animate="floatSlow"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 0.8, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute top-[15%] right-[10%] hidden lg:block"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={80}
          height={80}
          className="border border-[#9EC7DC] rounded-full p-2 w-[40px] h-[40px] lg:w-[60px] lg:h-[60px] opacity-80 hover:scale-110 transition-transform duration-300"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="floatFast"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="absolute top-[25%] right-[25%] hidden md:block"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={40}
          height={40}
          className="border border-[#9EC7DC] rounded-full p-2 w-[20px] h-[20px] md:w-[30px] md:h-[30px] opacity-60 hover:scale-110 transition-transform duration-300"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="float"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute top-[40%] right-[15%] hidden md:block"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={100}
          height={100}
          className="border border-[#9EC7DC] rounded-full p-2 w-[50px] h-[50px] md:w-[70px] md:h-[70px] lg:w-[90px] lg:h-[90px] hover:scale-110 transition-transform duration-300"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="floatSlow"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 0.75, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="absolute top-[55%] right-[8%] hidden lg:block"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={60}
          height={60}
          className="border border-[#9EC7DC] rounded-full p-2 w-[35px] h-[35px] lg:w-[50px] lg:h-[50px] opacity-75 hover:scale-110 transition-transform duration-300"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="floatFast"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 1.0 }}
        className="absolute top-[320px] hidden md:block left-[50%] lg:left-[550px] -translate-x-1/2 -translate-y-1/2 lg:ml-[40px]"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={200}
          height={200}
          className="border border-[#9EC7DC] rounded-full p-2 w-[30px] h-[30px] md:w-[40px] md:h-[40px] lg:w-[50px] lg:h-[50px] hover:scale-110 transition-transform duration-300"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="floatSlow"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="absolute hidden md:block bottom-[200px] md:bottom-[300px] left-[60%] lg:left-[690px]"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={100}
          height={100}
          className="border border-[#9EC7DC] rounded-full p-2 w-[30px] h-[30px] md:w-[50px] md:h-[50px] lg:w-[100px] lg:h-[100px] hover:scale-110 transition-transform duration-300"
        />
      </motion.div>

      <motion.div
        variants={bubbleVariants}
        animate="float"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 0.7, scale: 1 }}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="absolute bottom-[15%] right-[30%] hidden lg:block"
        suppressHydrationWarning={true}
      >
        <Image
          src="/assets/hero.png"
          alt="Abstract blue circle"
          width={70}
          height={70}
          className="border border-[#9EC7DC] rounded-full p-2 w-[40px] h-[40px] lg:w-[55px] lg:h-[55px] opacity-70 hover:scale-110 transition-transform duration-300"
        />
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container px-0 md:px-6 grid lg:grid-cols-2 gap-8 items-center relative z-10"
        suppressHydrationWarning={true}
      >
        <div
          className="flex flex-col text-center lg:text-left"
          suppressHydrationWarning={true}
        >
          <motion.h1
            variants={itemVariants}
            className="text-2xl font-bold leading-[120%] sm:text-3xl md:text-[40px] text-[#2B7FD0]"
          >
            Shape Your Future <br className="hidden sm:block" /> with the Right Elevator Pitch
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-sm md:text-[16px] font-normal leading-[150%] text-[#595959] max-w-[355px] mx-auto lg:mx-0 mt-6 md:mt-[48px]"
          >
            Unlock your full potential and begin creating the life you truly deserve — one meaningful opportunity at a
            time.
          </motion.p>

          {session?.status === "authenticated" && (
            <motion.div
              variants={formVariants}
              initial="hidden"
              animate="visible"
              className="w-full lg:max-w-[396px] mt-8 md:mt-[48px] mx-auto lg:mx-0"
            >
              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300"
                >
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
                  <div className="space-y-1 sm:border-l sm:pl-4 border-gray-200 text-start">
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
                </motion.div>
                <div className="flex items-start justify-start">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
                    <Button
                      onClick={handleSearch}
                      className="w-full sm:w-[160px] bg-[#2B7FD0] hover:bg-[#2B7FD0]/80 h-[51px] text-white rounded-[8px] mt-2 sm:mt-6 transition-all duration-300"
                    >
                      Search
                    </Button>
                  </motion.div>
                </div>
              </div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.8,
                    },
                  },
                }}
                className="flex flex-wrap gap-2 items-center justify-center lg:justify-start text-xs sm:text-sm mt-6 md:mt-[48px]"
              >
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  )
}