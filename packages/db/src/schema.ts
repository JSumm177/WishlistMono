import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const vehicles = sqliteTable("vehicles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  price: integer("price"), // Stored in cents
  imageUrl: text("image_url"),
  userId: text("user_id").notNull(), // Clerk User ID
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;

export const marketPrices = sqliteTable("market_prices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  source: text("source").notNull(), // 'cargurus' | 'carmax' | 'carvana' | 'cars_and_bids' | 'bring_a_trailer'
  price: integer("price"), // Price in cents
  url: text("url").notNull(), // Direct search page url
  lastFetchedAt: integer("last_fetched_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export type MarketPrice = typeof marketPrices.$inferSelect;
export type NewMarketPrice = typeof marketPrices.$inferInsert;
