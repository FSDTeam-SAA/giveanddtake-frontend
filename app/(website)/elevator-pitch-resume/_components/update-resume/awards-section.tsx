"use client"

import type { UseFormReturn } from "react-hook-form"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

interface AwardsSectionProps {
  form: UseFormReturn<any>
}

export const AwardsSection = ({ form }: AwardsSectionProps) => {
  const awards = form.watch("awards") || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Awards & Honors (Optional)</CardTitle>
        <p className="text-sm text-muted-foreground">Highlight your achievements and recognitions.</p>
      </CardHeader>
      <CardContent>
        {awards.map((award: any, index: number) => {
          if (award.type === "delete") return null

          return (
            <div key={index} className="space-y-4 rounded-lg border p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`awards.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Award Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Employee of the Year" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`awards.${index}.issuer`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issuer</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Company Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`awards.${index}.date`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Received</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. January 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name={`awards.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the award and its significance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {awards.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const currentAwards = form.getValues("awards") || []
                    const awardToRemove = currentAwards[index]

                    if (awardToRemove._id) {
                      const updatedAwards = [...currentAwards]
                      updatedAwards[index] = {
                        ...awardToRemove,
                        type: "delete",
                      }
                      form.setValue("awards", updatedAwards)
                    } else {
                      const updatedAwards = currentAwards.filter((_: any, i: number) => i !== index)
                      form.setValue("awards", updatedAwards)
                    }
                  }}
                >
                  Remove Award
                </Button>
              )}
            </div>
          )
        })}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const currentAwards = form.getValues("awards") || []
            form.setValue("awards", [
              ...currentAwards,
              {
                type: "create",
                title: "",
                issuer: "",
                date: "",
                description: "",
              },
            ])
          }}
        >
          Add Award
        </Button>
      </CardContent>
    </Card>
  )
}
