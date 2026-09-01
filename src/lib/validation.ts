import type { FieldErrors, ProfilePayload, RegisterPayload } from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function required(value: string, message: string): string | undefined {
  if (!value.trim()) return message;
  return undefined;
}

export function validateRegister(
  payload: RegisterPayload & { confirmPassword: string },
): FieldErrors {
  const fields: FieldErrors = {};
  const firstName = required(payload.firstName, "Please enter your first name");
  const lastName = required(payload.lastName, "Please enter your last name");
  const email = required(payload.email, "Please enter your email");
  const password = required(payload.password, "Please enter a password");
  const confirmPassword = required(payload.confirmPassword, "Please confirm your password");

  if (firstName) fields.firstName = firstName;
  if (lastName) fields.lastName = lastName;
  if (email) fields.email = email;
  else if (!EMAIL_PATTERN.test(payload.email.trim())) fields.email = "Please enter a valid email";
  if (password) fields.password = password;
  else if (payload.password.length < 8) fields.password = "Password must be at least 8 characters";
  if (confirmPassword) fields.confirmPassword = confirmPassword;
  else if (payload.password !== payload.confirmPassword) {
    fields.confirmPassword = "Passwords do not match";
  }
  if (!payload.eligibilityConfirmed) {
    fields.eligibilityConfirmed = "Please confirm that you meet the membership eligibility requirements";
  }
  return fields;
}

export function validateLogin(email: string, password: string): FieldErrors {
  const fields: FieldErrors = {};
  if (!email.trim()) fields.email = "Please enter your email";
  else if (!EMAIL_PATTERN.test(email.trim())) fields.email = "Please enter a valid email";
  if (!password) fields.password = "Please enter your password";
  return fields;
}

export function validateForgotPassword(email: string): FieldErrors {
  const fields: FieldErrors = {};
  if (!email.trim()) fields.email = "Please enter your email";
  else if (!EMAIL_PATTERN.test(email.trim())) fields.email = "Please enter a valid email";
  return fields;
}

export function validateResetPassword(password: string, confirmPassword: string): FieldErrors {
  const fields: FieldErrors = {};
  if (!password) fields.password = "Please enter a new password";
  else if (password.length < 8) fields.password = "Password must be at least 8 characters";
  if (!confirmPassword) fields.confirmPassword = "Please confirm your password";
  else if (password !== confirmPassword) fields.confirmPassword = "Passwords do not match";
  return fields;
}

export function validateProfile(
  payload: ProfilePayload & { confirmPassword?: string },
): FieldErrors {
  const fields: FieldErrors = {};
  if (!payload.firstName.trim()) fields.firstName = "Please enter your first name";
  if (!payload.lastName.trim()) fields.lastName = "Please enter your last name";
  if (!payload.email.trim()) fields.email = "Please enter your email";
  else if (!EMAIL_PATTERN.test(payload.email.trim())) fields.email = "Please enter a valid email";

  const newPassword = payload.newPassword?.trim() ?? "";
  if (newPassword) {
    if (newPassword.length < 8) fields.newPassword = "New password must be at least 8 characters";
    if (!payload.currentPassword) {
      fields.currentPassword = "Enter your current password to set a new one.";
    }
    if (payload.confirmPassword !== undefined && payload.confirmPassword !== newPassword) {
      fields.confirmPassword = "Passwords do not match";
    }
  }
  return fields;
}
