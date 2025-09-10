import { z } from "zod";

export const jobSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  region: z.string().min(1, "City is required"),
  vacancy: z
    .number()
    .min(1, "Vacancy must be at least 1")
    .max(50, "Vacancy cannot exceed 50"),
  employmentType: z.enum([
    "full-time",
    "part-time",
    "internship",
    "contract",
    "temporary",
    "freelance",
    "volunteer",
  ]),
  experience: z.enum(["entry", "mid", "senior", "executive"]),
  locationType: z.enum(["onsite", "remote", "hybrid"]),
  careerStage: z.enum([
    "New Entry",
    "Experienced Professional",
    "Career Returner",
  ]),
  categoryId: z.string().min(1, "Category is required"),
  role: z.string(),
  compensation: z.number().optional(),
  expirationDate: z.string().min(1, "Expiration date is required"),
  companyUrl: z.string().url("Invalid URL").optional(),
  jobDescription: z
    .string()
    .max(2000, "Description too long")
    .min(1, "Description is required")
    .refine(
      (value) => {
        // Split the string by whitespace and filter out empty strings
        const wordCount = value
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length;
        return wordCount >= 20;
      },
      {
        message: "Job description must have at least 20 words",
      }
    ),
  publishDate: z.string().optional(),
  applicationRequirements: z
    .array(
      z.object({ id: z.string(), label: z.string(), required: z.boolean() })
    )
    .optional(),
  customQuestions: z
    .array(z.object({ id: z.string(), question: z.string().optional() }))
    .optional(),
  userId: z.string().optional(),
});

export type JobFormData = z.infer<typeof jobSchema>;
