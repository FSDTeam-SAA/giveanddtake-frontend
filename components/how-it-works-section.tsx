import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, Search, Briefcase } from "lucide-react"

export function HowItWorksSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
      <div className="container px-4 md:px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          How It Works in three simple steps
        </h2>
        <div className="max-w-2xl mx-auto mt-4 text-gray-500 md:text-xl">
          <ol className="list-decimal list-inside text-left space-y-1">
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
