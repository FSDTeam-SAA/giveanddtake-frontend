import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Mail, Globe, Clock, GraduationCap, Briefcase } from "lucide-react"
import Image from "next/image"

interface ResumeResponse {
    success: boolean
    message: string
    data: {
        resume: Resume
        experiences: Experience[]
        education: Education[]
        awardsAndHonors: Award[]
        elevatorPitch: any[]
    }
}

interface Resume {
    _id: string
    userId: string
    type: string
    photo: string | null
    title: string
    firstName: string
    lastName: string
    country: string
    zipCode: string
    email: string
    phoneNumber: string
    skills: string[]
    sLink: any[]
    createdAt: string
    updatedAt: string
    __v: number
}

interface Experience {
    _id: string
    userId: string
    employer?: string
    jobTitle?: string
    startDate?: string
    endDate?: string
    country?: string
    city?: string
    zip?: string
    jobDescription?: string
    jobCategory?: string
    createdAt: string
    updatedAt: string
    __v: number
}

interface Education {
    _id: string
    userId: string
    city?: string
    state?: string
    degree: string
    fieldOfStudy?: string
    createdAt: string
    updatedAt: string
    __v: number
}

interface Award {
    _id: string
    userId: string
    title: string
    description?: string
    createdAt: string
    updatedAt: string
    __v: number
}

interface MyResumeProps {
    resume: ResumeResponse["data"]
}

export default function MyResume({ resume }: MyResumeProps) {
    const formatDate = (dateString?: string) => {
        if (!dateString) return "Present"
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
        })
    }

    const getSkillColor = (index: number) => {
        const colors = [
            "bg-blue-500 hover:bg-blue-600",
            "bg-green-500 hover:bg-green-600",
            "bg-purple-500 hover:bg-purple-600",
            "bg-orange-500 hover:bg-orange-600",
            "bg-pink-500 hover:bg-pink-600",
            "bg-indigo-500 hover:bg-indigo-600",
        ]
        return colors[index % colors.length]
    }



    return (
        <div className="min-h-screen">
            <div className="container">
                {/* Elevator Pitch Section */}
                <Card className="mb-8">
                    <CardContent className="p-6">
                        {
                            resume?.elevatorPitch?.[0]?.video ? (
                                <video autoPlay>
                                    <source src={resume?.elevatorPitch[0]?.video?.url} />
                                </video>
                            )
                                :
                                (
                                    <div className="flex items-center justify-center mb-4">
                                        <h2 className="text-xl font-semibold text-gray-800">You don't have any Elevator Pitch</h2>
                                    </div>
                                )
                        }
                    </CardContent>
                </Card>

                {/* Main Resume Section */}
                <Card className="border-0">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-center p-6">
                            <h1 className="text-4xl font-bold text-gray-800">My Resume</h1>
                        </div>

                        <div className="flex flex-col lg:flex-row">
                            {/* Left Sidebar - Contact Info */}
                            <div className="lg:w-1/3 p-6">
                                <div className="mb-6">
                                    <div className="w-20 h-20 rounded-md bg-gray-300 mb-4 overflow-hidden">
                                        {resume.resume.photo ? (
                                            <Image
                                                src={resume.resume.photo || "/placeholder.svg"}
                                                alt={`${resume.resume.firstName} ${resume.resume.lastName}`}
                                                height={300}
                                                width={300}
                                                className="w-full h-full object-cover rounded-md"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                                                {resume.resume.firstName[0]}
                                                {resume.resume.lastName[0]}
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        {resume.resume.firstName} {resume.resume.lastName[0]}.
                                    </h2>
                                    <p className="text-gray-600 capitalize">{resume.resume.title}</p>
                                </div>

                            </div>

                            {/* Right Content */}
                            <div className="lg:w-2/3 p-6">
                                <div className="space-y-4">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-800 mb-3 text-2xl border-b-2 pb-2">Contact Info</h3>
                                        <div className="text-xl">
                                            <p className="font-semibold">Location</p>
                                            <p className="text-gray-600">{resume.resume.country}</p>
                                        </div>
                                        <div className="space-y-3 text-sm flex justify-between items-center">
                                            <div className="text-xl">
                                                <p className="font-semibold">Phone</p>
                                                <span className="text-gray-600">{resume.resume.phoneNumber}</span>
                                            </div>
                                            <div className="text-xl">
                                                <p className="font-semibold">Email</p>
                                                <p className="text-gray-600">{resume.resume.email}</p>
                                            </div>
                                            <div className="text-xl">
                                                <p className="font-semibold">Website URL</p>
                                                <span className="text-blue-600">www.website.com</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-gray-500" />
                                            <span className="font-semibold text-gray-800 text-sm">Availability to Start</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Immediately Available</p>
                                    </div>
                                </div>
                                {/* About Section */}

                            </div>

                        </div>
                        <section className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">About</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                A seasoned professional with an excellent background in IT and proven commercial development
                                experience as a C++ developer, along with a solid knowledge of the software development life cycle.
                                Well versed in many key MS software development skills such as C++, C#, .NET, SQL, Python, Java,
                                Swift, PHP, React.js experience, Python, Adobe Illustrator.
                            </p>
                            <p className="text-gray-600 text-sm leading-relaxed mt-2">
                                <strong>Programming Languages:</strong> C++, C#, .NET, SQL, Python, Java, Swift, PHP, React.js
                                experience, Python, Adobe Illustrator.
                            </p>
                        </section>

                        {/* Skills Section */}
                        <section className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {resume.resume.skills.map((skill, index) => (
                                    <Badge key={index} className={`${getSkillColor(index)} text-white px-3 py-1 text-sm`}>
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </section>

                        {/* Experience Section */}
                        <section className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Experience</h3>
                            <div className="space-y-4">
                                {resume.experiences
                                    .filter((exp) => exp.jobTitle || exp.employer)
                                    .map((exp) => (
                                        <div key={exp._id} className="flex gap-4">
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Briefcase className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-800">{exp.jobTitle || "Position"}</h4>
                                                <p className="text-gray-600 text-sm">
                                                    {exp.employer || "Company"} • {exp.city && `${exp.city}, `}
                                                    {exp.country}
                                                </p>
                                                <p className="text-gray-500 text-xs">
                                                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                                                </p>
                                                {exp.jobDescription && <p className="text-gray-600 text-sm mt-1">{exp.jobDescription}</p>}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </section>

                        {/* Education Section */}
                        <section className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Education</h3>
                            <div className="space-y-4">
                                {resume.education.map((edu) => (
                                    <div key={edu._id} className="flex gap-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <GraduationCap className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-800 capitalize">
                                                {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                                            </h4>
                                            <p className="text-gray-600 text-sm">
                                                {edu.city && `${edu.city}, `}
                                                {edu.state}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Awards & Honours Section */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Awards & Honours</h3>
                            <div className="space-y-4">
                                {resume.awardsAndHonors.map((award) => (
                                    <div key={award._id} className="flex gap-4">
                                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            {/* Award Icon */}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-800">{award.title}</h4>
                                            {award.description && <p className="text-gray-600 text-sm">{award.description}</p>}
                                            <p className="text-gray-500 text-xs">{formatDate(award.createdAt)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
