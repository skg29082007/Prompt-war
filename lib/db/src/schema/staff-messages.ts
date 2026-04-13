import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { zonesTable } from "./zones";

export const staffMessagesTable = pgTable("staff_messages", {
  id: serial("id").primaryKey(),
  author: text("author").notNull(),
  role: text("role", { enum: ["supervisor", "security", "concessions", "medical", "operations"] }).notNull(),
  message: text("message").notNull(),
  zoneId: integer("zone_id").references(() => zonesTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStaffMessageSchema = createInsertSchema(staffMessagesTable).omit({ id: true, createdAt: true });
export type InsertStaffMessage = z.infer<typeof insertStaffMessageSchema>;
export type StaffMessage = typeof staffMessagesTable.$inferSelect;
