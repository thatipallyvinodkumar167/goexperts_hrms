import { defineConfig } from "prisma/config";

try {
  await import("dotenv/config");
} catch {
  // In hosted environments (e.g., Render), env vars are often injected directly.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
