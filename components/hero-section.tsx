import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Play } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative w-full py-12 md:py-24 lg:py-32 overflow-hidden">
      {/* Background abstract shapes - more subtle and blue */}
      <Image
        src="/placeholder.svg?height=200&width=200"
        alt="Abstract circle"
        width={200}
        height={200}
        className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 opacity-10 blur-md"
      />
      <Image
        src="/placeholder.svg?height=150&width=150"
        alt="Abstract circle"
        width={150}
        height={150}
        className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 opacity-10 blur-md"
      />
      <Image
        src="/placeholder.svg?height=100&width=100"
        alt="Abstract circle"
        width={100}
        height={100}
        className="absolute bottom-1/4 left-1/3 -translate-x-1/2 translate-y-1/2 opacity-10 blur-md"
      />
      <Image
        src="/placeholder.svg?height=250&width=250"
        alt="Abstract circle"
        width={250}
        height={250}
        className="absolute top-1/3 right-0 translate-x-1/2 -translate-y-1/2 opacity-10 blur-md"
      />

      <div className="container px-4 md:px-6 grid lg:grid-cols-2 gap-8 items-center relative z-10">
        <div className="flex flex-col space-y-4 text-center lg:text-left">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-gray-900">
            Shape Your Future with the Right Elevator Pitch
          </h1>
          <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl">
            Unlock your full potential and begin creating the life you truly deserve — one meaningful opportunity at a
            time.
          </p>
          <div className="w-full max-w-md mx-auto lg:mx-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="space-y-1">
                <Label
                  htmlFor="job-title"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Job Title
                </Label>
                <Input
                  id="job-title"
                  placeholder="Input Job type"
                  className="w-full border-none focus-visible:ring-0"
                />
              </div>
              <div className="space-y-1 border-l pl-4 border-gray-200">
                <Label
                  htmlFor="location"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="Search Location"
                  className="w-full border-none focus-visible:ring-0"
                />
              </div>
            </div>
            <Button className="w-full bg-v0-blue-500 hover:bg-v0-blue-600 text-white">Search</Button>
            <div className="flex flex-wrap gap-2 items-center justify-center lg:justify-start text-sm">
              <span className="font-medium text-gray-700">Trending Keywords:</span>
              <Badge variant="outline" className="px-3 py-1 rounded-full border-gray-400 text-gray-700 bg-gray-100">
                Web Development
              </Badge>
              <Badge variant="outline" className="px-3 py-1 rounded-full border-gray-400 text-gray-700 bg-gray-100">
                UI/UX Design
              </Badge>
            </div>
          </div>
        </div>
        <div className="relative flex justify-center items-center h-[300px] md:h-[400px] lg:h-[500px] rounded-3xl overflow-hidden shadow-lg border border-gray-200">
          <Image
            src="/placeholder.svg?height=500&width=700"
            alt="Job Search Video Placeholder"
            width={700}
            height={500}
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Button
              variant="ghost"
              size="icon"
              className="h-20 w-20 rounded-full bg-white/80 hover:bg-white text-v0-blue-500"
            >
              <Play className="h-10 w-10 fill-current" />
              <span className="sr-only">Play video</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
