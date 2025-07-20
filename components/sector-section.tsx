import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Building, Home, TrendingUp, Banknote, Network, Utensils, Shield } from "lucide-react"

export function SectorSection() {
  const sectors = [
    { name: "Technical Support", icon: Settings },
    { name: "Business Development", icon: Building },
    { name: "Real Estate Business", icon: Home },
    { name: "Share Market Analysis", icon: TrendingUp },
    { name: "Finance & Banking Service", icon: Banknote },
    { name: "IT & Networking Services", icon: Network },
    { name: "Restaurant Services", icon: Utensils },
    { name: "Defence & Fire Service", icon: Shield },
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Sector</h2>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-12">
          {sectors.map((sector, index) => {
            const Icon = sector.icon
            return (
              <Card
                key={index}
                className="flex flex-col items-center p-6 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-4">
                  <Icon className="h-12 w-12 text-v0-blue-500" />
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
