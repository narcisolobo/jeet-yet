import { z } from "zod";

const signUpSchema = z
  .object({
    email: z.email("Please enter a valid email."),
    password: z
      .string()
      .min(12, "Must be at least 12 characters.")
      .regex(/[a-z]/, "Must include a lowercase letter.")
      .regex(/[A-Z]/, "Must include an uppercase letter.")
      .regex(/[0-9]/, "Must include a number.")
      .regex(/[^A-Za-z0-9]/, "Must include a special character."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });

type SignUpInput = z.infer<typeof signUpSchema>;
type SignUpFieldErrors = Partial<Record<keyof SignUpInput, string[]>>;

export { signUpSchema, type SignUpInput, type SignUpFieldErrors };
