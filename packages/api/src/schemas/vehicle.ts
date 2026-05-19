import { z } from "zod";

export const insertVehicleSchema = z.object({
  make: z
    .string({ required_error: "Make is required" })
    .min(1, "Make is required"),
  model: z
    .string({ required_error: "Model is required" })
    .min(1, "Model is required"),
  year: z
    .number({ required_error: "Year is required" })
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  price: z.number().positive().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const updateVehicleSchema = insertVehicleSchema.extend({
  id: z.number().int(),
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type UpdateVehicle = z.infer<typeof updateVehicleSchema>;
