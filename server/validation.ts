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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

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
