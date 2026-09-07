import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .optional()
    .transform((value) => value ?? "");

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Please enter your first name").max(80, "First name is too long"),
  lastName: z.string().trim().min(1, "Please enter your last name").max(80, "Last name is too long"),
  email: z
    .email("Please enter a valid email")
    .trim()
    .max(254, "Email is too long")
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  phone: optionalText(40),
  city: optionalText(80),
  postcode: optionalText(20),
  heritageNotes: optionalText(500),
  eligibilityConfirmed: z.literal(true, {
    error: "Please confirm that you meet the membership eligibility requirements",
  }),
});

export const loginSchema = z.object({
  email: z
    .email("Please enter a valid email")
    .trim()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Please enter your password"),
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Please enter your first name").max(80, "First name is too long"),
  lastName: z.string().trim().min(1, "Please enter your last name").max(80, "Last name is too long"),
  email: z
    .email("Please enter a valid email")
    .trim()
    .max(254, "Email is too long")
    .transform((value) => value.toLowerCase()),
  phone: optionalText(40),
  city: optionalText(80),
  postcode: optionalText(20),
  heritageNotes: optionalText(500),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(72, "New password is too long")
    .optional()
    .or(z.literal("")),
});

export const forgotPasswordSchema = z.object({
  email: z
    .email("Please enter a valid email")
    .trim()
    .max(254, "Email is too long")
    .transform((value) => value.toLowerCase()),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().regex(/^[a-f0-9]{64}$/i, "This reset link is invalid or has expired."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i, "This verification link is invalid or has expired."),
});

export const resendVerificationSchema = z.object({
  email: z
    .email("Please enter a valid email")
    .trim()
    .max(254, "Email is too long")
    .transform((value) => value.toLowerCase())
    .optional(),
});

export const membershipStatusSchema = z.object({
  status: z.enum(["pending", "active", "rejected", "suspended"], {
    error: "Please choose a valid membership status.",
  }),
});

export const memberRoleSchema = z.object({
  role: z.enum(["member", "admin"], { error: "Please choose a valid role." }),
});

const optionalUrl = z
  .union([z.url("Please enter a valid URL"), z.literal("")])
  .optional()
  .transform((value) => value ?? "");

const dateOnly = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date.");

const timeOfDay = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}$/, "Please enter a valid time.");

const optionalTime = z
  .union([timeOfDay, z.literal("")])
  .optional()
  .transform((value) => (value ? value : null));

const optionalSlug = z
  .string()
  .trim()
  .max(80, "Slug is too long")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$|^$/, "Please enter a valid slug.")
  .optional()
  .transform((value) => value ?? "");

export const eventInputSchema = z.object({
  title: z.string().trim().min(1, "Please enter an event title").max(200, "Title is too long"),
  slug: optionalSlug,
  description: z.string().trim().max(10000, "Description is too long").optional().transform((value) => value ?? ""),
  eventDate: dateOnly,
  startTime: timeOfDay,
  endTime: optionalTime,
  location: z.string().trim().max(300, "Location is too long").optional().transform((value) => value ?? ""),
  eventUrl: optionalUrl,
});

export const newsInputSchema = z.object({
  kind: z.enum(["news", "update", "announcement"]).optional().transform((value) => value ?? "news"),
  title: z.string().trim().min(1, "Please enter a title").max(200, "Title is too long"),
  slug: optionalSlug,
  summary: z.string().trim().max(500, "Summary is too long").optional().transform((value) => value ?? ""),
  content: z.string().trim().min(1, "Please enter the content").max(50000, "Content is too long"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type EventInput = z.infer<typeof eventInputSchema>;
export type NewsInput = z.infer<typeof newsInputSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fields[key]) {
      fields[key] = issue.message;
    }
  }
  return fields;
}
