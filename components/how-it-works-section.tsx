import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, Search, Briefcase } from "lucide-react"

export function HowItWorksSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
      <div className="container px-4 md:px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-[40px] text-[#000000]">
          How It Works in three simple steps
        </h2>
        <div className="w-[196px] h-[6px] bg-[#2B7FD0] rounded-[35px] mx-auto mt-4"></div>
        <div className="md:text-xl">
          <ol className="list-decimal list-inside  space-y-1 text-[#707070] font-medium text-center mt-[32px]">
            <li>Record or upload your video elevator pitch (60 seconds free or upgrade!)</li>
            <li>Add a link to your video elevator pitch in your CV/resume</li>
            <li>Search and apply for jobs on our site</li>
          </ol>
        </div>
        <div className="grid gap-8 md:grid-cols-3 mt-12">
          <Card className="flex flex-col items-center p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <UserPlus className="h-12 w-12 text-v0-blue-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              <CardTitle className="text-xl font-semibold">Create Account</CardTitle>
              <p className="text-gray-500">
                Sign up in seconds and build your profile to start your job search journey.
              </p>
            </CardContent>
          </Card>
          <Card className="flex flex-col items-center p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <Search className="h-12 w-12 text-v0-blue-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              <CardTitle className="text-xl font-semibold">Explore Our Jobs</CardTitle>
              <p className="text-gray-500">Explore thousands of job listings.</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col items-center p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <Briefcase className="h-12 w-12 text-v0-blue-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              <CardTitle className="text-xl font-semibold">Get A Job</CardTitle>
              <p className="text-gray-500">Apply with ease, follow recruiters, and land your next opportunity.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
