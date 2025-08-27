import PageHeaders from "@/components/shared/PageHeaders";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About | Elevator Pitch",
  description: "Learn more about Elevator Pitch",
};

export default function AboutUsPage() {
  return (
    <div className=" bg-white py-12 ">
      <div className=" container ">
        {/* About Us Header Section */}
        <PageHeaders
          title="About Us"
          description="Elevator Video Pitches was initially conceived in 2016 at a time of high employment amidst a ‘skills shortage’ which has abated."
          subdescription=" Today, millions of knowledgeable, highly skilled and competent professionals, graduates, school leavers have tried unsuccessfully for years to find a job. We see you, we hear you, we care."
          align="left"
        />

        {/* Vision, Mission, and Image Section */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-y-5">
          <div className="flex-1 space-y-10 text-center md:text-left">
            <div>
              <h2 className="text-3xl md:text-[40px] font-semibold text-[#131313] mb-3">
                Our Vision
              </h2>
              <p className="text-base font-normal text-[#545454] leading-relaxed">
                To amplify the voices of millions of jobseekers globally and get
                everyone their desired jobs.
              </p>
            </div>
            <div>
              <h2 className="text-3xl md:text-[40px] font-bold text-[#131313] mb-3">
                Our Mission
              </h2>
              <p className="text-base font-normal text-[#545454] leading-relaxed">
                To provide jobseekers and professionals globally with a platform
                to be seen and heard by leading employers, beyond a paper
                resume.
              </p>
            </div>
          </div>
          <div className="">
            <div className="relative w-full ">
              <Image
                src="/assets/evp-bluebg1.jpg"
                alt="Modern office desk with laptop and camera"
                width={1000}
                height={1000}
                style={{ objectFit: "cover" }}
                className="w-full max-w-[500px] md:max-w-[600px] h-auto rounded-3xl shadow-xl mx-auto "
              />
            </div>
          </div>
        </div>

        {/* What We Offer and Unique Business Content Section */}
        <div className="text-center md:text-left">
          <div className="mb-10">
            <h2 className="text-3xl text-[38px] font-bold text-[#131313] mb-3">
              What We Offer
            </h2>
            <p className="text-base text-[#545454] leading-relaxed mx-auto max-w-4xl md:mx-0">
              {
                "We offer the opportunity for each candidate to pitch yourself to companies and companies and recruiters to pitch their corporate culture to you,"
              }
              <br />
              {
                "after all it's often said that job interviews are two-way meetings between a candidate and a company!"
              }
            </p>
          </div>
          <div>
            <h2 className="text-3xl text-[38px] font-bold text-[#131313] mb-4">
              Unique Business content
            </h2>
            <ul className="list-disc list-inside text-base text-[#545454] leading-relaxed space-y-2 mx-auto max-w-4xl md:mx-0 text-justify">
              <li>Our platform is the first global portal where you can:</li>
              <li>
                Upload your elevator video pitch for free (in most cases).
              </li>
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
