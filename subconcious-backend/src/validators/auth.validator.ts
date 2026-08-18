import { z } from "zod";

export const signupSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Must be a valid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters"),
});

export const signinSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Must be a valid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
