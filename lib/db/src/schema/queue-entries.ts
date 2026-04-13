import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { queuesTable } from "./queues";

export const queueEntriesTable = pgTable("queue_entries", {
  id: serial("id").primaryKey(),
  queueId: integer("queue_id").notNull().references(() => queuesTable.id),
  attendeeName: text("attendee_name").notNull(),
  attendeeContact: text("attendee_contact"),
  position: integer("position").notNull(),
  status: text("status", { enum: ["waiting", "called", "served", "left"] }).notNull().default("waiting"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQueueEntrySchema = createInsertSchema(queueEntriesTable).omit({ id: true, joinedAt: true });
export type InsertQueueEntry = z.infer<typeof insertQueueEntrySchema>;
export type QueueEntry = typeof queueEntriesTable.$inferSelect;
