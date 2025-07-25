import PageHeaders from "@/components/shared/PageHeaders"
import Image from "next/image"

export default function AboutUsPage() {
  return (
    <div className=" bg-white py-12 ">
      <div className=" container ">
        {/* About Us Header Section */}
       <PageHeaders title="About Us" description="Elevator Video Pitches was initially conceived in 2016 at a time of high employment amidst a ‘skills shortage’ which has" subdiscription="Abated. Today, millions of knowledgeable, highly skilled and competent professionals, graduates, school leavers have tried unsuccessfully for years to find a job. We see you, we hear you, we care."/>

        {/* Vision, Mission, and Image Section */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-16">
          <div className="flex-1 space-y-10 text-center md:text-left">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Vision</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                To amplify the voices of millions of jobseekers globally and get
                <br />
                everyone their desired jobs.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Mission</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                To provide jobseekers and professionals globally with a platform to be
                <br />
                seen and heard by leading employers, beyond a paper resume.
              </p>
            </div>
          </div>
          <div className="flex-1 flex justify-center md:justify-end">
            <div className="relative w-full ">
              <Image
                src="/assets/about.jpg"
                alt="Modern office desk with laptop and camera"
                width={1000}
                height={1000}
                style={{ objectFit: "cover" }}
                className="rounded-xl w-[515px] h-[570px]"
              />
            </div>
          </div>
        </div>

        {/* What We Offer and Unique Business Content Section */}
        <div className="text-center md:text-left">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">What We Offer</h2>
            <p className="text-lg text-gray-700 leading-relaxed mx-auto max-w-4xl md:mx-0">
              {
                "We offer the opportunity for each candidate to pitch yourself to companies and companies and recruiters to pitch their corporate culture to you,"
              }
              <br />
              {"after all it's often said that job interviews are two-way meetings between a candidate and a company!"}
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Unique Business content</h2>
            <ul className="list-disc list-inside text-lg text-gray-700 leading-relaxed space-y-2 mx-auto max-w-4xl md:mx-0">
              <li>Our platform is the first global portal where you can:</li>
              <li>Upload your elevator video pitch for free (in most cases).</li>
              <li>Apply for jobs seamlessly.</li>
              <li>Receive timely feedback, positive or constructive, through our intuitive EVP dashboard.</li>
              <li>Stay confident—your dream job is on its way!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
