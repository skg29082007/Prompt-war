import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { zonesTable } from "./zones";

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  zoneId: integer("zone_id").notNull().references(() => zonesTable.id),
  type: text("type", { enum: ["overcrowding", "long_wait", "gate_closed", "rebalance_suggested", "general"] }).notNull(),
  message: text("message").notNull(),
  severity: text("severity", { enum: ["info", "warning", "critical"] }).notNull(),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true, createdAt: true, resolvedAt: true, resolved: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
