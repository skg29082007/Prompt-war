import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, queuesTable, queueEntriesTable, zonesTable } from "@workspace/db";
import {
  JoinQueueParams,
  JoinQueueBody,
  ListQueueEntriesParams,
  LeaveQueueParams,
} from "@workspace/api-zod";

const router = Router();

function computeWait(queueLength: number, avgServiceTimeMinutes: number, activeServers: number): number {
  if (activeServers <= 0) return queueLength * avgServiceTimeMinutes;
  return Math.round(((queueLength * avgServiceTimeMinutes) / activeServers) * 10) / 10;
}

router.get("/queues", async (req, res): Promise<void> => {
  const queues = await db.select().from(queuesTable);
  const zones = await db.select().from(zonesTable);
  const entries = await db.select().from(queueEntriesTable).where(eq(queueEntriesTable.status, "waiting"));

  const result = queues.map((q) => {
    const zone = zones.find((z) => z.id === q.zoneId);
    const queueLength = entries.filter((e) => e.queueId === q.id).length;
    return {
      id: q.id,
      zoneId: q.zoneId,
      zoneName: zone?.name ?? "Unknown",
      queueLength,
      avgServiceTimeMinutes: q.avgServiceTimeMinutes,
      activeServers: q.activeServers,
      estimatedWaitMinutes: computeWait(queueLength, q.avgServiceTimeMinutes, q.activeServers),
      isOpen: q.isOpen,
    };
  });

  res.json(result);
});

router.post("/queues/:id/join", async (req, res): Promise<void> => {
  const parsedParams = JoinQueueParams.safeParse({ id: Number(req.params.id) });
  if (!parsedParams.success) {
    res.status(400).json({ error: "Invalid queue ID" });
    return;
  }
  const parsedBody = JoinQueueBody.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.message });
    return;
  }

  const queue = await db
    .select()
    .from(queuesTable)
    .where(eq(queuesTable.id, parsedParams.data.id))
    .then((rows) => rows[0]);

  if (!queue) {
    res.status(404).json({ error: "Queue not found" });
    return;
  }

  if (!queue.isOpen) {
    res.status(400).json({ error: "Queue is closed" });
    return;
  }

  const waitingEntries = await db
    .select()
    .from(queueEntriesTable)
    .where(and(eq(queueEntriesTable.queueId, queue.id), eq(queueEntriesTable.status, "waiting")));

  const position = waitingEntries.length + 1;
  const estimatedWaitMinutes = computeWait(position, queue.avgServiceTimeMinutes, queue.activeServers);

  const entry = await db
    .insert(queueEntriesTable)
    .values({
      queueId: queue.id,
      attendeeName: parsedBody.data.attendeeName,
      attendeeContact: parsedBody.data.attendeeContact,
      position,
      status: "waiting",
    })
    .returning()
    .then((rows) => rows[0]);

  res.status(201).json({
    id: entry.id,
    queueId: entry.queueId,
    attendeeName: entry.attendeeName,
    attendeeContact: entry.attendeeContact ?? undefined,
    position: entry.position,
    estimatedWaitMinutes,
    status: entry.status,
    joinedAt: entry.joinedAt.toISOString(),
  });
});

router.get("/queues/:id/entries", async (req, res): Promise<void> => {
  const parsed = ListQueueEntriesParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid queue ID" });
    return;
  }

  const queue = await db
    .select()
    .from(queuesTable)
    .where(eq(queuesTable.id, parsed.data.id))
    .then((rows) => rows[0]);

  if (!queue) {
    res.status(404).json({ error: "Queue not found" });
    return;
  }

  const entries = await db
    .select()
    .from(queueEntriesTable)
    .where(eq(queueEntriesTable.queueId, parsed.data.id));

  const waitingCount = entries.filter((e) => e.status === "waiting").length;

  res.json(
    entries.map((e) => ({
      id: e.id,
      queueId: e.queueId,
      attendeeName: e.attendeeName,
      attendeeContact: e.attendeeContact ?? undefined,
      position: e.position,
      estimatedWaitMinutes: computeWait(e.position, queue.avgServiceTimeMinutes, queue.activeServers),
      status: e.status,
      joinedAt: e.joinedAt.toISOString(),
    })),
  );
});

router.delete("/queues/entries/:entryId", async (req, res): Promise<void> => {
  const parsed = LeaveQueueParams.safeParse({ entryId: Number(req.params.entryId) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid entry ID" });
    return;
  }

  const entry = await db
    .update(queueEntriesTable)
    .set({ status: "left" })
    .where(eq(queueEntriesTable.id, parsed.data.entryId))
    .returning()
    .then((rows) => rows[0]);

  if (!entry) {
    res.status(404).json({ error: "Queue entry not found" });
    return;
  }

  const queue = await db
    .select()
    .from(queuesTable)
    .where(eq(queuesTable.id, entry.queueId))
    .then((rows) => rows[0]);

  res.json({
    id: entry.id,
    queueId: entry.queueId,
    attendeeName: entry.attendeeName,
    attendeeContact: entry.attendeeContact ?? undefined,
    position: entry.position,
    estimatedWaitMinutes: 0,
    status: entry.status,
    joinedAt: entry.joinedAt.toISOString(),
  });
});

export default router;
