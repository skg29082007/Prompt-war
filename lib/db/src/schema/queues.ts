import { pgTable, serial, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { zonesTable } from "./zones";

export const queuesTable = pgTable("queues", {
  id: serial("id").primaryKey(),
  zoneId: integer("zone_id").notNull().references(() => zonesTable.id),
  avgServiceTimeMinutes: real("avg_service_time_minutes").notNull().default(3),
  activeServers: integer("active_servers").notNull().default(2),
  isOpen: boolean("is_open").notNull().default(true),
});

export const insertQueueSchema = createInsertSchema(queuesTable).omit({ id: true });
export type InsertQueue = z.infer<typeof insertQueueSchema>;
export type Queue = typeof queuesTable.$inferSelect;
