import { router, publicProcedure, protectedProcedure } from "./trpc";
import { vehicles, eq, and } from "@wishlist/db";
import { insertVehicleSchema, updateVehicleSchema } from "./schemas/vehicle";
import { z } from "zod";

export const appRouter = router({
  getVehicles: protectedProcedure.query(async ({ ctx }) => {
    const data = await ctx.db
      .select()
      .from(vehicles)
      .where(eq(vehicles.userId, ctx.userId));

    return data.map(v => ({
      ...v,
      price: v.price ? v.price / 100 : null
    }));
  }),
  addVehicle: protectedProcedure
    .input(insertVehicleSchema)
    .mutation(async ({ ctx, input }) => {
      const { price, ...rest } = input;
      return await ctx.db
        .insert(vehicles)
        .values({
          ...rest,
          price: price ? Math.round(price * 100) : undefined,
          userId: ctx.userId,
        })
        .returning();
    }),
  updateVehicle: protectedProcedure
    .input(updateVehicleSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, price, ...data } = input;
      return await ctx.db
        .update(vehicles)
        .set({
          ...data,
          price: price ? Math.round(price * 100) : undefined,
        })
        .where(and(eq(vehicles.id, id), eq(vehicles.userId, ctx.userId)))
        .returning();
    }),
  deleteVehicle: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .delete(vehicles)
        .where(and(eq(vehicles.id, input.id), eq(vehicles.userId, ctx.userId)))
        .returning();
    }),
});

export type AppRouter = typeof appRouter;
