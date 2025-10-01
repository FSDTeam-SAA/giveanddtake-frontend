"use client";

import type React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Upload, Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Cropper from "react-easy-crop";
import TextEditor from "@/components/MultiStepJobForm/TextEditor";
import { SocialLinksSection } from "../social-links-section";
import type { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

interface Country {
  country: string;
  cities: string[];
}

interface DialCode {
  name: string;
  code: string;
  dial_code: string;
}

interface Option {
  value: string;
  label: string;
}

function Combobox({
  options,
  value,
  onChange,
  placeholder,
  minSearchLength = 0,
  disabled = false,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minSearchLength?: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, options]);

  const displayedOptions = filteredOptions.slice(0, 100);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent"
          disabled={disabled}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {search.length < minSearchLength ? (
              <CommandEmpty>
                Type at least {minSearchLength} characters to search.
              </CommandEmpty>
            ) : displayedOptions.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : null}
            <CommandGroup>
              {displayedOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {filteredOptions.length > 100 && (
              <CommandItem disabled>
                More results available. Refine your search.
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface PersonalInfoSectionProps {
  form: UseFormReturn<any>;
  photoPreview: string | null;
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PersonalInfoSection({
  form,
  photoPreview,
  onPhotoUpload,
}: PersonalInfoSectionProps) {
  const formCountry = form.watch("country");
  const [selectedCountry, setSelectedCountry] = useState<string>(
    formCountry || ""
  );
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Fetch countries
  const { data: countriesData, isLoading: isLoadingCountries } = useQuery<
    Country[]
  >({
    queryKey: ["countries"],
    queryFn: async () => {
      const response = await fetch(
        "https://countriesnow.space/api/v0.1/countries"
      );
      const data = await response.json();
      if (data.error) throw new Error("Failed to fetch countries");
      return data.data as Country[];
    },
  });

  // Fetch dial codes
  const { data: dialCodesData, isLoading: isLoadingDialCodes } = useQuery<
    DialCode[]
  >({
    queryKey: ["dialCodes"],
    queryFn: async () => {
      const response = await fetch(
        "https://countriesnow.space/api/v0.1/countries/codes"
      );
      const data = await response.json();
      if (data.error) throw new Error("Failed to fetch dial codes");
      return data.data as DialCode[];
    },
  });

  // Fetch cities for Personal Information
  const { data: citiesData, isLoading: isLoadingCities } = useQuery<string[]>({
    queryKey: ["cities", selectedCountry],
    queryFn: async () => {
      if (!selectedCountry) return [];
      const response = await fetch(
        "https://countriesnow.space/api/v0.1/countries/cities",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ country: selectedCountry }),
        }
      );
      const data = await response.json();
      if (data.error) throw new Error("Failed to fetch cities");
      return data.data as string[];
    },
    enabled: !!selectedCountry,
  });

  const countryOptions = useMemo(
    () =>
      countriesData?.map((c) => ({ value: c.country, label: c.country })) || [],
    [countriesData]
  );

  const cityOptions = useMemo(
    () => citiesData?.map((c) => ({ value: c, label: c })) || [],
    [citiesData]
  );

  // Handle country data side effects
  useEffect(() => {
    if (
      countriesData &&
      countriesData.length > 0 &&
      !formCountry &&
      !selectedCountry
    ) {
      const defaultCountry = countriesData[0].country;
      setSelectedCountry(defaultCountry);
      form.setValue("country", defaultCountry);
    }
    if (formCountry && formCountry !== selectedCountry) {
      setSelectedCountry(formCountry);
    }
  }, [countriesData, form, formCountry, selectedCountry]);

  // Function to handle image upload and initiate cropping
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to crop image
  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  // Function to generate cropped image
  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number }
  ): Promise<string> => {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return canvas.toDataURL("image/jpeg");
  };

  // Handle crop confirmation
  const handleCropConfirm = async () => {
    if (imageSrc && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
        // Call the original onPhotoUpload with a synthetic event
        onPhotoUpload({
          target: { files: [dataURLtoFile(croppedImage, "profile.jpg")] },
        } as any);
        setShowCropper(false);
        setImageSrc(null);
      } catch (e) {
        console.error("Error cropping image:", e);
      }
    }
  };

  // Convert data URL to File object
  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  return (
    <>
      {/* About Us Section */}
      <Card className="border-2 border-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-start gap-8">
            {/* Photo Upload with Cropper */}
            <div className="flex-shrink-0">
              <Label className="text-sm font-medium text-blue-600 mb-2 block">
                Photo
              </Label>
              <div
                className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => document.getElementById("photo-upload")?.click()}
              >
                {photoPreview ? (
                  <Image
                    src={photoPreview || "/placeholder.svg"}
                    alt="Preview"
                    width={100}
                    height={100}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Upload className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <Input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              {showCropper && imageSrc && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-4 rounded-lg w-[90vw] max-w-[500px]">
                    <div className="relative w-full h-[300px]">
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCropper(false);
                          setImageSrc(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="button" onClick={handleCropConfirm}>Crop & Save</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* About Us Text Area */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <FormLabel className="text-blue-600 font-medium">
                  About Me
                </FormLabel>
              </div>
              <FormField
                control={form.control}
                name="aboutUs"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TextEditor
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Word count: {field.value.trim().split(/\s+/).length}
                      /200
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title*</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Mr" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mr">Mr.</SelectItem>
                        <SelectItem value="mrs">Mrs.</SelectItem>
                        <SelectItem value="ms">Ms.</SelectItem>
                        <SelectItem value="dr">Dr.</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Your First Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sur Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Your Last Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country*</FormLabel>
                  <FormControl>
                    <Combobox
                      options={countryOptions}
                      value={field.value || ""}
                      onChange={(value) => {
                        field.onChange(value);
                        setSelectedCountry(value);
                      }}
                      placeholder={
                        isLoadingCountries
                          ? "Loading countries..."
                          : "Select Country"
                      }
                      minSearchLength={0}
                      disabled={isLoadingCountries}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City*</FormLabel>
                  <FormControl>
                    <Combobox
                      options={cityOptions}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={
                        !selectedCountry
                          ? "Select country first"
                          : isLoadingCities
                          ? "Loading cities..."
                          : "Select City"
                      }
                      minSearchLength={2}
                      disabled={isLoadingCities || !selectedCountry}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip Code / Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Zip/Postal Code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address*</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter Your Email Address"
                      disabled
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number*</FormLabel>
                  <FormControl>
                    <Input
                      disabled
                      placeholder={
                        isLoadingDialCodes
                          ? "Loading..."
                          : selectedCountry
                          ? `${
                              dialCodesData?.find(
                                (dc) => dc.name === selectedCountry
                              )?.dial_code || ""
                            } Enter phone number`
                          : "Select country first"
                      }
                      {...field}
                      onChange={(e) => {
                        const selectedDialCode = dialCodesData?.find(
                          (dc) => dc.name === selectedCountry
                        )?.dial_code;
                        let value = e.target.value;
                        if (
                          selectedDialCode &&
                          !value.startsWith(selectedDialCode)
                        ) {
                          value =
                            selectedDialCode + value.replace(/^\+\d+/, "");
                        }
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="immediatelyAvailable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">
                      Immediately Available
                    </FormLabel>
                    <FormDescription>
                      Check if you are available to start immediately
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <SocialLinksSection form={form} />
        </CardContent>
      </Card>
    </>
  );
}