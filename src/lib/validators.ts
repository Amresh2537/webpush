import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(120),
});

export const websiteSchema = z.object({
  name: z.string().min(2).max(80),
  domain: z.string().url(),
  logo: z.string().url().optional().or(z.literal("")),
});

export const verifyWebsiteSchema = z.object({
  websiteId: z.string().cuid(),
  method: z.enum(["META", "DNS"]),
});

export const campaignSchema = z.object({
  websiteId: z.string().cuid({ message: "Please select a website" }),
  title: z
    .string()
    .min(2, { message: "Title must be at least 2 characters" })
    .max(120, { message: "Title must be 120 characters or fewer" }),
  message: z
    .string()
    .min(3, { message: "Message must be at least 3 characters" })
    .max(250, { message: "Message must be 250 characters or fewer" }),
  iconUrl: z
    .string()
    .url({ message: "Icon URL must be a valid URL" })
    .optional()
    .or(z.literal("")),
  clickUrl: z.string().url({ message: "Click URL must be a valid URL (include https://)" }),
  browser: z.string().optional(),
  location: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  scheduleAt: z.string().optional(),
  saveAsDraft: z.string().optional(),
});
