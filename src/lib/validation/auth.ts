import { z } from "zod";

export const normalizeUsername = (value: string) =>
  value.normalize("NFKC").trim().toLocaleLowerCase("en-US");

export const usernameSchema = z
  .string()
  .transform(normalizeUsername)
  .pipe(
    z
      .string()
      .min(3, "Username must contain at least 3 characters.")
      .max(24, "Username cannot exceed 24 characters.")
      .regex(
        /^[a-z0-9_](?:[a-z0-9_.]*[a-z0-9_])?$/,
        "Use letters, numbers, underscores or dots without a dot at either end.",
      ),
  );

export const emailSchema = z
  .string()
  .trim()
  .pipe(z.email("Enter a valid email address."));

export const passwordSchema = z
  .string()
  .min(10, "Password must contain at least 10 characters.")
  .regex(/[a-z]/, "Add at least one lowercase letter.")
  .regex(/[A-Z]/, "Add at least one uppercase letter.")
  .regex(/[0-9]/, "Add at least one number.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const onboardingSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must contain at least 2 characters.")
    .max(50, "Display name cannot exceed 50 characters."),
  username: usernameSchema,
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
