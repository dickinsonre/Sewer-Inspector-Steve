import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const nodeSchema = z.object({
  id: z.string(),
  type: z.enum(['junction', 'outfall', 'storage']),
  x: z.number(),
  y: z.number(),
  depth: z.number(),
  maxDepth: z.number(),
  invert: z.number(),
});

export const conduitSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  diameter: z.number(),
  flow: z.number(),
  maxFlow: z.number(),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  nodes: z.array(nodeSchema),
  conduits: z.array(conduitSchema),
});

export const insertProjectSchema = projectSchema.omit({ id: true });

export type Node = z.infer<typeof nodeSchema>;
export type Conduit = z.infer<typeof conduitSchema>;
export type Project = z.infer<typeof projectSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
