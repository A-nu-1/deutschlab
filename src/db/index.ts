import "server-only";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error(
    "Missing Turso database environment variables."
  );
}

const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client);