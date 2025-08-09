import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Mail, Globe, Clock, GraduationCap, Briefcase, Award, AwardIcon } from "lucide-react"
import Image from "next/image"
import { StyledString } from "next/dist/build/swc/types"
import Link from "next/link"

interface ResumeResponse {
    success: boolean
    message: string
    data: {
        resume: Resume
        website: string
        experiences: Experience[]
        education: Education[]
        awardsAndHonors: Award[]
        elevatorPitch: any[]
    }
}

interface Resume {
    _id: string
    aboutUs: string
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
    createdAt: StyledString
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
    instituteName: string
    graduationDate: string
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


    return (
        <main className="min-h-screen">
            <div className="container">
                {/* Elevator Pitch Section */}
                <Card className="mb-8">
                    <CardContent className="p-6">
                        {resume?.elevatorPitch?.[0]?.video ? (
                            <video autoPlay controls className="w-full h-auto">
                                <source src={resume?.elevatorPitch[0]?.video?.url} />
                            </video>
                        ) : (
                            <div className="flex items-center justify-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">You don't have any Elevator Pitch</h2>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Main Resume Section */}
                <Card className="border-0">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-center text-center mb-2 lg:mb-0">
                            <h1 className="text-xl sm:text-4xl font-bold text-gray-800">My Resume</h1>
                        </div>

                        <div className="flex flex-col lg:flex-row border-b-2 lg:py-12 pb-4 gap-6 sm:px-6">
                            {/* Left Sidebar - Contact Info */}
                            <div className="lg:w-1/3 w-full">
                                <div className="mb-6 text-center lg:text-left">
                                    <div className="w-24 h-24 mx-auto lg:mx-0 rounded-md bg-gray-300 mb-4 overflow-hidden">
                                        {resume.resume.photo ? (
                                            <Image
                                                src={resume.resume.photo}
                                                alt={`${resume.resume.firstName} ${resume.resume.lastName}`}
                                                height={300}
                                                width={300}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                                                {resume.resume.firstName[0]}
                                                {resume.resume.lastName[0]}
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        {resume.resume.firstName} {resume.resume.lastName}
                                    </h2>
                                    <div className="flex gap-3 items-center">
                                        {resume.resume.sLink.map((linkObj: any, index: number) => {
                                            const [name, url] = Object.entries(linkObj).find(([key]) => key !== "_id") || [];
                                            return (
                                                <Link
                                                    key={index}
                                                    href={url as string}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline capitalize"
                                                >
                                                    {name}
                                                </Link>
                                            );
                                        })}
                                    </div>

                                </div>
                            </div>

                            {/* Right Content */}
                            <div className="lg:w-2/3 w-full space-y-6">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-800 mb-3 text-2xl border-b-2 pb-2">Contact Info</h3>
                                    <div>
                                        <p className="font-semibold text-base">Location</p>
                                        <p className="text-gray-600 text-sm">{resume.resume.country}</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-sm">
                                        <div>
                                            <p className="font-semibold text-base">Phone</p>
                                            <span className="text-gray-600">{resume.resume.phoneNumber}</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-base">Email</p>
                                            <p className="text-gray-600">{resume.resume.email}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-base">Website URL</p>
                                            <span className="text-blue-600">{resume.website || "www.example.com"}</span>
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
                        </div>

                        {/* About Section */}
                        <section className="border-b-2 py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
                            <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">About</h3>
                            <p className="text-gray-600 text-base leading-relaxed">
                                {resume.resume.aboutUs || "Here is about yourself"}
                            </p>
                        </section>

                        {/* Skills Section */}
                        <section className="border-b-2 py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
                            <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {resume.resume.skills.map((skill, index) => (
                                    <Badge key={index} className="text-white px-3 py-2 text-sm bg-[#2B7FD0] rounded-sm">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </section>

                        {/* Experience Section */}
                        <section className="border-b-2 py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
                            <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">Experience</h3>
                            <div className="space-y-6">
                                {resume.experiences
                                    .filter((exp) => exp.jobTitle)
                                    .map((exp) => (
                                        <div key={exp._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Briefcase className="w-8 h-8 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-[#595959] text-lg capitalize">{exp.jobTitle}</h4>
                                                <h3>{exp.employer}</h3>
                                                <p className="text-gray-500 text-sm">
                                                    {formatDate(exp.endDate)} - {formatDate(exp.startDate)}
                                                </p>
                                            </div>
                                            <p className="text-gray-600 text-sm flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                <span>{exp.city && `${exp.city}, `} {exp.country}</span>
                                            </p>
                                        </div>
                                    ))}
                            </div>
                        </section>

                        {/* Education Section */}
                        <section className="border-b-2 py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
                            <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">Education</h3>
                            <div className="space-y-6">
                                {resume.education.map((edu) => (
                                    <div key={edu._id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <GraduationCap className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-800 capitalize text-lg">
                                                {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                                            </h4>
                                            <p className="text-sm">{formatDate(edu.graduationDate)}</p>
                                            <p className="text-sm">{edu.instituteName}</p>
                                        </div>
                                        <p className="text-gray-600 text-sm flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            <span>{edu.city && `${edu.city}, `} {edu.state}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Awards & Honours Section */}
                        <section className="py-6 sm:py-10 lg:py-12 px-0 sm:px-6">
                            <h3 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">Awards & Honours</h3>
                            <div className="space-y-6">
                                {resume.awardsAndHonors.map((award) => (
                                    <div key={award._id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <AwardIcon className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-800 text-lg">{award.title}</h4>
                                            <p className="text-gray-500 text-sm">{formatDate(award.createdAt)}</p>
                                            {award.description && (
                                                <p className="text-gray-600 text-sm">{award.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
