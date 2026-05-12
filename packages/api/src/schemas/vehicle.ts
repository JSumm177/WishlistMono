import { z } from "zod";

export const insertVehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  price: z.number().positive().optional(), // Removed .int() to allow dollar/decimal input
});

export const updateVehicleSchema = insertVehicleSchema.extend({
  id: z.number().int(),
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type UpdateVehicle = z.infer<typeof updateVehicleSchema>;
