import { z } from "zod";

export const insertVehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z
    .number()
    .int()
    .min(1900)
    .refine((year) => year <= new Date().getFullYear() + 1, {
      message: "Year cannot be more than 1 year in the future",
    }),
  price: z.number().positive().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const updateVehicleSchema = insertVehicleSchema.extend({
  id: z.number().int(),
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type UpdateVehicle = z.infer<typeof updateVehicleSchema>;
