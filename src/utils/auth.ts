import { betterAuth, BetterAuthPlugin } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "#src/db/index.js";
import { schema } from "#src/db/schema.js";
import { expo } from "@better-auth/expo";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [expo() as unknown as BetterAuthPlugin],
});
