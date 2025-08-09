import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlayIcon } from "lucide-react"

export default function RecruiterDashboard() {
    return (
        <div className="min-h-screen  py-8 px-4 md:px-6 lg:px-8">
            <div className=" container mx-auto ">
                <h1 className="text-[48px] text-[#131313] font-bold text-center mb-8">Recruiter Dashboard</h1>

                {/* Recruiter Information Section */}
                <section className="mb-10 ">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="flex items-center mb-4 border-b border-[#999999] pb-3">
                            <h2 className="text-3xl font-bold text-[#131313]">Recruiter Information</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                            {/* Left Column */}
                            <div className="flex flex-col gap-6">
                                <div className="flex items-start space-x-3">
                                    <Image
                                        src="/assets/Layer_2_1_.png"
                                        alt="Company Logo"
                                        width={1000}
                                        height={1000}
                                        className="mt-1 w-[50px] h-[48px]"
                                    />
                                    <div>
                                        <p className="font-medium text-[22px] text-[#000000]">Company Name</p>
                                        <p className="text-[18px] text-[#707070]">TechNova Solutions</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium text-[22px] text-[#000000]">About Us</p>
                                    <p className="text-base text-[#707070] leading-relaxed">
                                        TechNova Solutions is a leading IT company focused on developing smart, scalable, and user-friendly
                                        digital solutions. We specialize in mobile and web development, cloud integration, and AI-based tools
                                        for businesses of all sizes.
                                    </p>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="flex flex-col gap-6">
                                <div>
                                    <p className="font-medium text-[22px] text-[#000000]">Email</p>
                                    <p className="text-[18px] text-[#707070]">contact@technova.io</p>
                                </div>
                                <div>
                                    <p className="font-medium text-[#131313]">Website</p>
                                    <Link href="#" className="text-[18px] text-[#707070] underline">
                                        yourwebsite.com
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Elevator Pitch Section */}
                <section className="mb-10">
                    <h2 className="text-[32px] text-[#4D4D4D] font-semibold mb-4 text-center">Your Elevator Pitch</h2>
                    <div className="relative w-full h-[500px]  mx-auto aspect-video rounded-lg overflow-hidden shadow-lg">
                        <Image
                            src="/video-placeholder.png"
                            alt="Elevator Pitch Video Thumbnail"
                            layout="fill"
                            objectFit="cover"
                            className="w-full h-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                            <Button className="rounded-full w-16 h-16 bg-white bg-opacity-80 text-gray-800 hover:bg-white transition-colors flex items-center justify-center">
                                <PlayIcon className="w-8 h-8 fill-current" />
                                <span className="sr-only">Play video</span>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Your Jobs Section */}
                <section className="mb-10">
                    <h2 className="text-2xl text-[#000000] font-semibold mb-4">Your Jobs</h2>
                    <div className=" rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-base text-[#2B7FD0] font-bold">Job Title</TableHead>
                                    <TableHead className="text-base text-[#2B7FD0] font-bold">Applicants</TableHead>
                                    <TableHead className="text-base text-[#2B7FD0] font-bold">Status</TableHead>
                                    <TableHead className="text-base text-[#2B7FD0] font-bold">Deadline</TableHead>
                                    <TableHead className="text-base text-[#2B7FD0] font-bold">Actions</TableHead>
                                    <TableHead className="text-base text-[#2B7FD0] font-bold">Deactivation Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="text-base text-[#000000] font-medium">
                                    <TableCell className="font-medium">UI Designer</TableCell>
                                    <TableCell>23</TableCell>
                                    <TableCell>Active</TableCell>
                                    <TableCell>Jul 12</TableCell>
                                    <TableCell>
                                        <Link href="#" className="">
                                            View
                                        </Link>
                                    </TableCell>
                                    <TableCell>Jul 12</TableCell>
                                </TableRow>
                                <TableRow className="text-base text-[#000000] font-medium">
                                    <TableCell className="font-medium">Backend Developer</TableCell>
                                    <TableCell>15</TableCell>
                                    <TableCell>Pending</TableCell>
                                    <TableCell>Aug 1</TableCell>
                                    <TableCell>
                                        <Link href="#" className="text-blue-600 hover:underline">
                                            View
                                        </Link>
                                    </TableCell>
                                    <TableCell>Aug 1</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </section>

                {/* Job Cards Section */}

                <section className="mb-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-[907px] mx-auto">
                        {/* Card 1 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-[#000000] text-2xl font-normal">
                                    <span className="font-semibold">Job Title :</span> Senior UI/UX Designer
                                </CardTitle>
                                <div className="flex justify-between pt-10">
                                    <CardDescription className="text-base text-[#000000] font-normal">
                                        <span className="font-semibold">Status:</span> Full-time
                                        <br />
                                        <span className="font-semibold">Posted:</span> Jun 12 2025
                                    </CardDescription>
                                    <div className="text-2xl font-bold text-[#000000] bg-[#E6F3FF] px-4 py-2 rounded-[8px]">
                                        23
                                        <p className="text-sm font-normal text-gray-500">Applicants</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center">
                                <div className="space-x-2">
                                    <Button className="bg-red-600 w-[160px] hover:bg-red-700 text-white text-base">Delete</Button>
                                    <Button className="w-[160px] text-base text-[#000000]" variant="outline">Republish</Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Card 2 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-[#000000] text-2xl font-normal">
                                    <span className="font-semibold">Job Title :</span> Backend Developer
                                </CardTitle>
                                <div className="flex justify-between pt-10">
                                    <CardDescription className="text-base text-[#000000] font-normal">
                                        <span className="font-semibold">Status:</span> Full-time
                                        <br />
                                        <span className="font-semibold">Posted:</span> Jul 5 2025
                                    </CardDescription>
                                    <div className="text-2xl font-bold text-[#000000] bg-[#E6F3FF] px-4 py-2 rounded-[8px]">
                                        15
                                        <p className="text-sm font-normal text-gray-500">Applicants</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center">
                                <div className="space-x-2">
                                    <Button className="bg-red-600 w-[160px] hover:bg-red-700 text-white text-base">Delete</Button>
                                    <Button className="w-[160px] text-base text-[#000000]" variant="outline">Republish</Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Card 3 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-[#000000] text-2xl font-normal">
                                    <span className="font-semibold">Job Title :</span> Frontend Developer
                                </CardTitle>
                                <div className="flex justify-between pt-10">
                                    <CardDescription className="text-base text-[#000000] font-normal">
                                        <span className="font-semibold">Status:</span> Contract
                                        <br />
                                        <span className="font-semibold">Posted:</span> Jul 15 2025
                                    </CardDescription>
                                    <div className="text-2xl font-bold text-[#000000] bg-[#E6F3FF] px-4 py-2 rounded-[8px]">
                                        32
                                        <p className="text-sm font-normal text-gray-500">Applicants</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center">
                                <div className="space-x-2">
                                    <Button className="bg-red-600 w-[160px] hover:bg-red-700 text-white text-base">Delete</Button>
                                    <Button className="w-[160px] text-base text-[#000000]" variant="outline">Republish</Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Card 4 */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-[#000000] text-2xl font-normal">
                                    <span className="font-semibold">Job Title :</span> Product Manager
                                </CardTitle>
                                <div className="flex justify-between pt-10">
                                    <CardDescription className="text-base text-[#000000] font-normal">
                                        <span className="font-semibold">Status:</span> Part-time
                                        <br />
                                        <span className="font-semibold">Posted:</span> Aug 1 2025
                                    </CardDescription>
                                    <div className="text-2xl font-bold text-[#000000] bg-[#E6F3FF] px-4 py-2 rounded-[8px]">
                                        18
                                        <p className="text-sm font-normal text-gray-500">Applicants</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center">
                                <div className="space-x-2">
                                    <Button className="bg-red-600 w-[160px] hover:bg-red-700 text-white text-base">Delete</Button>
                                    <Button className="w-[160px] text-base text-[#000000]" variant="outline">Republish</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Applicant List Section */}
                <section className="mb-10">
                  

                    <div className=" overflow-hidden">
                        {/* Header Row */}
                        <div className="grid grid-cols-12 items-center p-4 border-b  font-semibold text-2xl text-[#000000] pb-10 ">
                            <div className="col-span-2">Picture</div>
                            <div className="col-span-3">Name</div>
                            <div className="col-span-2">Experience</div>
                            <div className="col-span-2">Applied</div>
                            <div className="col-span-3">Actions</div>
                        </div>

                        {/* Applicant Rows */}
                        <div className="divide-y border-none">
                            {/* First Applicant */}
                            <div className="grid grid-cols-12 items-center p-4 bg-[#E6F3FF] text-[#000000] text-xl">
                                <div className="col-span-2">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src="/applicant-profile.png" />
                                        <AvatarFallback>AL</AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="col-span-3 font-medium">Adam L.</div>
                                <div className="col-span-2">5 Years</div>
                                <div className="col-span-2">June 17</div>
                                <div className="col-span-3 flex space-x-2">
                                    <Button
                                        variant="outline"
                                        className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent text-sm h-8"
                                    >
                                        Applicant Details
                                    </Button>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white text-sm h-8"
                                    >
                                        Shortlist
                                    </Button>
                                    <Button
                                        className="bg-red-600 hover:bg-red-700 text-white text-sm h-8"
                                    >
                                        Reject
                                    </Button>
                                </div>
                            </div>

                            {/* Second Applicant */}
                            <div className="grid grid-cols-12 items-center p-4 bg-[#E6F3FF] text-[#000000] text-xl">
                                <div className="col-span-2">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src="/applicant-profile.png" />
                                        <AvatarFallback>AL</AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="col-span-3 font-medium">Adam L.</div>
                                <div className="col-span-2">5 Years</div>
                                <div className="col-span-2">June 17</div>
                                <div className="col-span-3 flex space-x-2">
                                    <Button
                                        variant="outline"
                                        className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent text-sm h-8"
                                    >
                                        Applicant Details
                                    </Button>
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white text-sm h-8"
                                    >
                                        Shortlist
                                    </Button>
                                    <Button
                                        className="bg-red-600 hover:bg-red-700 text-white text-sm h-8"
                                    >
                                        Reject
                                    </Button>
                                </div>
                            </div>
                        </div>
                            <p className=" text-base text-[#000000] font-semibold text-right mt-8 cursor-pointer">See All</p>
                    </div>
                </section>

                {/* Post A Job Button */}
                <div className="text-center mt-10">
                    <Button className="bg-[#2B7FD0] hover:bg-[#2B7FD0]/85 text-white px-8 py-3 text-lg">Post A Job</Button>
                </div>
            </div>
        </div>
    )
}
