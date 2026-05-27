import { router, publicProcedure, protectedProcedure } from "./trpc";
import { vehicles, eq, and, marketPrices, inArray } from "@wishlist/db";
import { insertVehicleSchema, updateVehicleSchema } from "./schemas/vehicle";
import { z } from "zod";
import { UTApi } from "uploadthing/server";
import { scrapeMarketPrices } from "./services/scraper";

const utapi = new UTApi();

export const appRouter = router({
  getVehicles: protectedProcedure.query(async ({ ctx }) => {
    const data = await ctx.db
      .select()
      .from(vehicles)
      .where(eq(vehicles.userId, ctx.userId));

    if (data.length === 0) {
      return [];
    }

    const vehicleIds = data.map((v) => v.id);
    const pricesData = await ctx.db
      .select()
      .from(marketPrices)
      .where(inArray(marketPrices.vehicleId, vehicleIds));

    const pricesMap = new Map<number, typeof pricesData>();
    for (const p of pricesData) {
      if (p.vehicleId !== null) {
        let arr = pricesMap.get(p.vehicleId);
        if (!arr) {
          arr = [];
          pricesMap.set(p.vehicleId, arr);
        }
        arr.push(p);
      }
    }

    return data.map((v) => {
      const vPrices = pricesMap.get(v.id) || [];
      const validPrices = vPrices.filter((p) => p.price !== null) as {
        price: number;
      }[];
      const avgPrice =
        validPrices.length > 0
          ? Math.round(
              validPrices.reduce((sum, p) => sum + p.price, 0) /
                validPrices.length,
            ) / 100
          : null;

      return {
        ...v,
        price: v.price ? v.price / 100 : null,
        averageMarketPrice: avgPrice,
      };
    });
  }),
  getModelsForMake: protectedProcedure
    .input(z.object({ make: z.string(), year: z.number() }))
    .query(async ({ input }) => {
      try {
        const makeClean = input.make.trim();
        if (!makeClean) return [];

        const url = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeyear/make/${encodeURIComponent(makeClean)}/modelyear/${input.year}?format=json`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return [];

        const data = await res.json();
        const results = data.Results || [];

        // Filter unique model names and sort alphabetically
        const modelNames = results
          .map((r: any) => r.Model_Name as string)
          .filter(Boolean);

        return Array.from(new Set(modelNames)).sort();
      } catch (error) {
        console.error("Failed to fetch models from NHTSA:", error);
        return [];
      }
    }),
  addVehicle: protectedProcedure
    .input(insertVehicleSchema)
    .mutation(async ({ ctx, input }) => {
      const { price, ...rest } = input;
      const priceCents = price ? Math.round(price * 100) : null;

      const [insertedVehicle] = await ctx.db
        .insert(vehicles)
        .values({
          ...rest,
          price: priceCents ?? undefined,
          userId: ctx.userId,
        })
        .returning();

      if (insertedVehicle) {
        try {
          const scraped = await scrapeMarketPrices(
            insertedVehicle.year,
            insertedVehicle.make,
            insertedVehicle.model,
            insertedVehicle.trim,
            insertedVehicle.price,
          );

          await ctx.db.insert(marketPrices).values(
            scraped.map((s) => ({
              vehicleId: insertedVehicle.id,
              source: s.source,
              price: s.price,
              url: s.url,
              lastFetchedAt: new Date(),
            })),
          );
        } catch (error) {
          console.error("Failed to seed initial market prices:", error);
        }
      }

      return [insertedVehicle];
    }),
  updateVehicle: protectedProcedure
    .input(updateVehicleSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, price, ...data } = input;

      // 1. If a new image is provided, get the old one to clean it up
      if (data.imageUrl !== undefined) {
        const [oldVehicle] = await ctx.db
          .select()
          .from(vehicles)
          .where(and(eq(vehicles.id, id), eq(vehicles.userId, ctx.userId)))
          .limit(1);

        if (oldVehicle?.imageUrl && oldVehicle.imageUrl !== data.imageUrl) {
          try {
            const fileKey = oldVehicle.imageUrl.split("/").pop();
            if (fileKey) {
              await utapi.deleteFiles(fileKey);
            }
          } catch (error) {
            console.error("Failed to cleanup old image:", error);
          }
        }
      }

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
      // 1. Get the vehicle to find the image URL
      const [vehicle] = await ctx.db
        .select()
        .from(vehicles)
        .where(and(eq(vehicles.id, input.id), eq(vehicles.userId, ctx.userId)))
        .limit(1);

      if (!vehicle) {
        throw new Error("Vehicle not found");
      }

      // 2. If there's an image, delete it from UploadThing
      if (vehicle.imageUrl) {
        try {
          // Extract the key from the URL (everything after the last /)
          const fileKey = vehicle.imageUrl.split("/").pop();
          if (fileKey) {
            await utapi.deleteFiles(fileKey);
          }
        } catch (error) {
          console.error("Failed to delete image from UploadThing:", error);
          // We continue anyway so the DB record is cleaned up even if the image delete fails
        }
      }

      // 3. Delete the record from the database
      return await ctx.db
        .delete(vehicles)
        .where(and(eq(vehicles.id, input.id), eq(vehicles.userId, ctx.userId)))
        .returning();
    }),
  getMarketPrices: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [vehicle] = await ctx.db
        .select()
        .from(vehicles)
        .where(
          and(
            eq(vehicles.id, input.vehicleId),
            eq(vehicles.userId, ctx.userId),
          ),
        )
        .limit(1);

      if (!vehicle) {
        throw new Error("Vehicle not found or access denied");
      }

      const data = await ctx.db
        .select()
        .from(marketPrices)
        .where(eq(marketPrices.vehicleId, input.vehicleId));

      return data.map((p) => ({
        ...p,
        price: p.price ? p.price / 100 : null,
      }));
    }),
  refreshMarketPrices: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [vehicle] = await ctx.db
        .select()
        .from(vehicles)
        .where(
          and(
            eq(vehicles.id, input.vehicleId),
            eq(vehicles.userId, ctx.userId),
          ),
        )
        .limit(1);

      if (!vehicle) {
        throw new Error("Vehicle not found or access denied");
      }

      const scraped = await scrapeMarketPrices(
        vehicle.year,
        vehicle.make,
        vehicle.model,
        vehicle.trim,
        vehicle.price,
      );

      await ctx.db
        .delete(marketPrices)
        .where(eq(marketPrices.vehicleId, input.vehicleId));

      const inserted = await ctx.db
        .insert(marketPrices)
        .values(
          scraped.map((s) => ({
            vehicleId: input.vehicleId,
            source: s.source,
            price: s.price,
            url: s.url,
            lastFetchedAt: new Date(),
          })),
        )
        .returning();

      return inserted.map((p) => ({
        ...p,
        price: p.price ? p.price / 100 : null,
      }));
    }),
});

export type AppRouter = typeof appRouter;
