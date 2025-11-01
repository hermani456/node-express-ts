import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { schema } from "./schema.js";

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL environment variable is not defined");
}
export const db = drizzle(process.env.POSTGRES_URL, {
  schema,
});
