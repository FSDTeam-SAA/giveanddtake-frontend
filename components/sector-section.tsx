import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Building, Home, TrendingUp, Banknote, Network, Utensils, Shield } from "lucide-react"
import Image from "next/image"

export function SectorSection() {
  const sectors = [
    { name: "Technical Support", icon: "/assets/1.png"},
    { name: "Business Development",icon: "/assets/2.png"},
    { name: "Real Estate Business", icon: "/assets/3.png"},
    { name: "Share Market Analysis", icon: "/assets/4.png" },
    { name: "Finance & Banking Service", icon: "/assets/5.png" },
    { name: "IT & Networking Services",icon: "/assets/6.png"},
    { name: "Restaurant Services", icon: "/assets/7.png" },
    { name: "Defence & Fire Service",icon: "/assets/8.png"},
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Sector</h2>
         <div className="w-[196px] h-[6px] bg-[#2B7FD0] rounded-[35px] mx-auto mt-4"></div>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-12">
          {sectors.map((sector, index) => {
            const Icon = sector.icon
            return (
              <Card
                key={index}
                className="flex flex-col items-center p-6 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-4">
                 <Image src={sector.icon} alt={sector.name} width={100} height={100} className="h-[64px] w-[64px]" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <CardTitle className="text-lg font-semibold">{sector.name}</CardTitle>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
