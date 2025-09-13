"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Plus, X, Link } from "lucide-react";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import Image from "next/image";

interface SocialLink {
  label: string;
  url: string;
}

interface SocialLinksSectionProps {
  form: UseFormReturn<any>;
}

const defaultSocialLinks = [
  { label: "LinkedIn", url: "" },
  { label: "GitHub", url: "" },
  { label: "Portfolio", url: "" },
  { label: "Twitter", url: "" },
  { label: "Instagram", url: "" },
  { label: "Facebook", url: "" },
];

export function SocialLinksSection({ form }: SocialLinksSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sLink",
  });

  // Initialize with default social links if empty
  if (fields.length === 0) {
    defaultSocialLinks.forEach((link) => append(link));
  }

  const addSocialLink = () => {
    append({ label: "", url: "" });
  };

  const removeSocialLink = (index: number) => {
    // Don't allow removing if it's one of the first 6 default links, just clear them
    if (index < 6) {
      form.setValue(`sLink.${index}.label`, "");
      form.setValue(`sLink.${index}.url`, "");
    } else {
      remove(index);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link className="h-5 w-5 text-blue-600" />
          <div>
            <CardTitle className="text-lg font-medium">Social Links</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Add your social media profiles and professional links (optional)
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Social Icons Preview */}

        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`sLink.${index}.label`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          index < 6
                            ? defaultSocialLinks[index]?.label ||
                              "e.g. LinkedIn"
                            : "e.g. YouTube, TikTok"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`sLink.${index}.url`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/profile"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-6"
              onClick={() => removeSocialLink(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          className="mt-4 bg-transparent"
          onClick={addSocialLink}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add More Social Links
        </Button>

        <p className="text-xs text-gray-500 mt-2">
          The first 6 fields are common social platforms. You can add more
          custom links below.
        </p>
      </CardContent>
    </Card>
  );
}
