import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Registration number, username, or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must include at least one capital letter")
  .regex(/[0-9]/, "Password must include at least one number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must include at least one special character");

export const registerSchema = z.object({
  studentId: z
    .string()
    .min(14, "Registration number must be at least 14 characters")
    .max(15, "Registration number cannot exceed 15 characters")
    .refine((val) => val.startsWith("25"), {
      message: "You are not eligible to apply/register in this IPT program",
    }),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: strongPasswordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
  programId: z.number().int().positive("Please select your program of study"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const staffRegisterSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: strongPasswordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
  department: z.string().min(1, "Please select your department"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const applicationSchema = z
  .object({
    pref1: z.number().int().positive("First preference is required"),
    pref2: z.number().int().positive("Second preference is required"),
  })
  .refine(
    (data) => data.pref1 !== data.pref2,
    { message: "Preferences must be 2 distinct clusters" }
  );

export const allocationSchema = z.object({
  applicationId: z.number().int().positive("Application ID is required"),
  clusterId: z.number().int().positive("Cluster ID is required"),
});

export const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  abbreviation: z.string().min(1, "Abbreviation is required"),
});

export const programSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  departmentId: z.number().int().positive("Department is required"),
});

export const clusterManageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  capacity: z.number().int().min(0).optional(),
  location: z.string().optional(),
  departmentSlots: z
    .array(z.object({ departmentId: z.number(), slots: z.number().int().min(0) }))
    .optional(),
});

export const studentAdminSchema = z.object({
  studentId: z.string().min(3, "Registration number required"),
  fullName: z.string().min(2, "Full name required"),
  department: z.string().min(1, "Department required"),
  program: z.string().min(1, "Program required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type AllocationInput = z.infer<typeof allocationSchema>;
