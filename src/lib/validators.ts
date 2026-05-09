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
  websiteId: z.string().cuid(),
  title: z.string().min(2).max(120),
  message: z.string().min(3).max(250),
  iconUrl: z.string().url().optional().or(z.literal("")),
  clickUrl: z.string().url(),
  browser: z.string().optional(),
  location: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  scheduleAt: z.string().optional(),
  saveAsDraft: z.string().optional(),
});
