import { z } from "zod";

export const jobSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  department: z.string().optional(), // <-- optional
  country: z.string().min(1, "Country is required"),
  region: z.string().min(1, "City is required"),
  vacancy: z.string().min(1).regex(/^\d+$/, "Vacancy must be a number"),
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
  categoryId: z.string().min(1),
  role: z.string().min(1),
  compensation: z.string().optional(), // <-- optional
  expirationDate: z.string(),
  companyUrl: z.string().optional().or(z.literal("")), // <-- optional
  jobDescription: z.string().max(2000).min(1),
  publishDate: z.string().optional(), // <-- optional
  applicationRequirements: z
    .array(
      z.object({ id: z.string(), label: z.string(), required: z.boolean() })
    )
    .optional(), // <-- optional
  customQuestions: z
    .array(z.object({ id: z.string(), question: z.string().optional() }))
    .optional(), // <-- optional
  userId: z.string().optional(), // <-- optional
});

export type JobFormData = z.infer<typeof jobSchema>;
