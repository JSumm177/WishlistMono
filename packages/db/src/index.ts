import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

export * from "drizzle-orm";
export * from "./schema";

let dbInstance: BetterSQLite3Database | null = null;

// Gating the database initialization for Node.js only.
// This prevents the mobile app from trying to bundle better-sqlite3.
if (
  typeof window === "undefined" &&
  typeof process !== "undefined" &&
  process.versions &&
  process.versions.node
) {
  const Database = require("better-sqlite3");
  const { drizzle } = require("drizzle-orm/better-sqlite3");
  const path = require("path");
  const fs = require("fs");

  let projectRootCache: string | null = null;
  const getProjectRoot = () => {
    if (projectRootCache) return projectRootCache;

    let curr = __dirname;
    while (curr !== path.parse(curr).root) {
      if (fs.existsSync(path.join(curr, "pnpm-workspace.yaml"))) {
        projectRootCache = curr;
        return curr;
      }
      curr = path.dirname(curr);
    }
    projectRootCache = process.cwd();
    return projectRootCache;
  };

  const dbPath = path.join(getProjectRoot(), "packages/db/local.db");
  const sqlite = new Database(dbPath);
  dbInstance = drizzle(sqlite);
}

export const db = dbInstance as BetterSQLite3Database;
