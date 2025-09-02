"use client";

import { Metadata } from "next";
import { motion, Variants } from "framer-motion";
import Image from "next/image";

// Bubble animation variants
const bubbleVariants: Variants = {
  float: {
    y: [0, -10, 0],
    transition: { repeat: Infinity, duration: 2, ease: "easeInOut" as const },
  },
  floatSlow: {
    y: [0, -15, 0],
    transition: { repeat: Infinity, duration: 3, ease: "easeInOut" as const },
  },
  floatFast: {
    y: [0, -8, 0],
    transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" as const },
  },
};

// Right side floating bubbles component (inside container)
function RightBackgroundBubbles() {
  return (
    <div className="absolute inset-0 flex justify-center items-center overflow-hidden pointer-events-none">
      <div className="relative w-full h-full">
        {/* Bubble 1 */}
        <motion.div
          variants={bubbleVariants}
          animate="floatSlow"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 0.8, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-[15%] right-[10%] hidden lg:block"
        >
          <Image
            src="/assets/hero.png"
            alt="Abstract bubble"
            width={80}
            height={80}
            className="border border-[#9EC7DC] rounded-full p-2 w-[60px] h-[60px] opacity-80 hover:scale-110 transition-transform duration-300"
          />
        </motion.div>

        {/* Bubble 2 */}
        <motion.div
          variants={bubbleVariants}
          animate="floatFast"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="absolute top-[25%] right-[25%] hidden md:block"
        >
          <Image
            src="/assets/hero.png"
            alt="Abstract bubble"
            width={40}
            height={40}
            className="border border-[#9EC7DC] rounded-full p-2 w-[30px] h-[30px] opacity-60 hover:scale-110 transition-transform duration-300"
          />
        </motion.div>

        {/* Bubble 3 */}
        <motion.div
          variants={bubbleVariants}
          animate="float"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="absolute top-[40%] right-[15%] hidden md:block"
        >
          <Image
            src="/assets/hero.png"
            alt="Abstract bubble"
            width={100}
            height={100}
            className="border border-[#9EC7DC] rounded-full p-2 w-[70px] h-[70px] hover:scale-110 transition-transform duration-300"
          />
        </motion.div>

        {/* Bubble 4 */}
        <motion.div
          variants={bubbleVariants}
          animate="floatSlow"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 0.75, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="absolute top-[55%] right-[8%] hidden lg:block"
        >
          <Image
            src="/assets/hero.png"
            alt="Abstract bubble"
            width={60}
            height={60}
            className="border border-[#9EC7DC] rounded-full p-2 w-[50px] h-[50px] opacity-75 hover:scale-110 transition-transform duration-300"
          />
        </motion.div>

        {/* Bubble 5 */}
        <motion.div
          variants={bubbleVariants}
          animate="floatFast"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="absolute top-[60%] right-[25%] hidden md:block"
        >
          <Image
            src="/assets/hero.png"
            alt="Abstract bubble"
            width={200}
            height={200}
            className="border border-[#9EC7DC] rounded-full p-2 w-[50px] h-[50px] hover:scale-110 transition-transform duration-300"
          />
        </motion.div>

        {/* Bubble 6 */}
        <motion.div
          variants={bubbleVariants}
          animate="floatSlow"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="absolute bottom-[20%] right-[20%] hidden md:block"
        >
          <Image
            src="/assets/hero.png"
            alt="Abstract bubble"
            width={100}
            height={100}
            className="border border-[#9EC7DC] rounded-full p-2 w-[80px] h-[80px] hover:scale-110 transition-transform duration-300"
          />
        </motion.div>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "About | Elevator Pitch",
  description: "Learn more about Elevator Pitch",
};

export default function AboutUsPage() {
  return (
    <div className="relative bg-white py-20 overflow-hidden">
      <div className="container relative">
        {/* Right Background Bubbles inside container */}
        <RightBackgroundBubbles />

        <div className="relative z-10">
          {/* About Section */}
          <div className="mb-6 space-y-2 max-w-2xl">
            <h2 className="text-3xl md:text-[40px] font-semibold text-[#131313] mb-3">
              About Us
            </h2>
            <p className="text-base font-normal text-[#545454] leading-relaxed">
              Elevator Video Pitch was initially conceived in 2016 at a time
              of high employment amidst a ‘skills shortage’ which has abated.
            </p>
            <p className="text-base font-normal text-[#545454] leading-relaxed">
              Today, millions of knowledgeable, highly skilled and competent
              professionals, graduates, school leavers have tried unsuccessfully
              for years to find a job. We see you, we hear you, we care.
            </p>
          </div>

          {/* Vision & Mission */}
          <div className="flex flex-col md:flex-row items-start justify-between mb-6 gap-y-10">
            <div className="flex-1 space-y-6 text-left">
              <div>
                <h2 className="text-3xl md:text-[36px] font-semibold text-[#131313] mb-3">
                  Our Vision
                </h2>
                <p className="text-base text-[#545454] leading-relaxed">
                  To amplify the voices of millions of jobseekers globally and
                  get everyone their desired jobs.
                </p>
              </div>
              <div>
                <h2 className="text-3xl md:text-[36px] font-semibold text-[#131313] mb-3">
                  Our Mission
                </h2>
                <p className="text-base text-[#545454] leading-relaxed">
                  To provide jobseekers and professionals globally with a
                  platform to be seen and heard by leading employers, beyond a
                  paper resume.
                </p>
              </div>
            </div>
          </div>

          {/* What We Offer */}
          <div className="mb-6 max-w-3xl">
            <h2 className="text-3xl md:text-[36px] font-semibold text-[#131313] mb-3">
              What We Offer
            </h2>
            <p className="text-base text-[#545454] leading-relaxed">
              We offer the opportunity for each candidate to pitch yourself to
              companies, and for companies and recruiters to pitch their
              corporate culture to you. After all, it’s often said that job
              interviews are two-way meetings between a candidate and a company!
            </p>
          </div>

          {/* Unique Business Content */}
          <div className="mb-10 max-w-4xl">
            <h2 className="text-3xl md:text-[36px] font-semibold text-[#131313] mb-4">
              Unique Business Content
            </h2>
            <ul className="list-disc list-inside text-base text-[#545454] leading-relaxed space-y-2 text-justify">
              <li>Our platform is the first global portal where you can:</li>
              <li>Upload your elevator video pitch for free (in most cases).</li>
              <li>Apply for jobs seamlessly.</li>
              <li>
                Receive timely feedback, positive or constructive, through our
                intuitive EVP dashboard.
              </li>
              <li>Stay confident—your dream job is on its way!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
