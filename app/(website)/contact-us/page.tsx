import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin, Clock, Search, Lock } from "lucide-react"

export default function Component() {
  return (
    <div className=" container mx-auto">
      <div className="bg-white rounded-lg  p-6 sm:p-8 lg:p-10   grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Form Section */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input id="first-name" placeholder="Enter Your First Name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input id="last-name" placeholder="Enter Your Last Name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input id="address" placeholder="" className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone-number">Phone Number</Label>
            <div className="relative">
              <Input id="phone-number" placeholder="Optional" className="pr-10" />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="What is this regarding?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">You Message</Label>
            <Textarea id="message" placeholder="Tell us how we can help you" className="min-h-[120px]" />
          </div>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Send Message</Button>
        </div>

        {/* Contact Information Section */}
        <div className="space-y-6 md:pl-8">
          <h2 className="text-xl font-semibold text-gray-800">Contract Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600">
                <Mail className="w-5 h-5" />
              </div>
              <a href="mailto:info@elevatorvideopitch.com" className="text-gray-700 hover:underline">
                info@elevatorvideopitch.com
              </a>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600">
                <Phone className="w-5 h-5" />
              </div>
              <a href="tel:+14065550120" className="text-gray-700 hover:underline">
                (406) 555-0120
              </a>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600">
                <MapPin className="w-5 h-5" />
              </div>
              <address className="text-gray-700 not-italic">
                70 Washington Square <br />
                South, New York, USA
              </address>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-gray-700">
                Monday to Friday, from <br />
                9am - 6pm GMT
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
