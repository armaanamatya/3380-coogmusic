import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { readFileSync, mkdirSync } from "fs";
import path, { join } from "path";
import { fileURLToPath } from "url";

// ESM-friendly __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getDb() {
  // Ensure the data directory exists
  const dataDir = join(__dirname, "../../data");
  mkdirSync(dataDir, { recursive: true });

  const dbFile = join(dataDir, "coogmusic.db");

  const db = await open({
    filename: join(process.cwd(), "data/coogmusic.db"),
    driver: sqlite3.Database,
  });

  // Apply schema on startup
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
  await db.exec(schema);

  return db;
}
