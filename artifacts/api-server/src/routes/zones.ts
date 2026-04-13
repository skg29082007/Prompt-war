import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, zonesTable } from "@workspace/db";
import {
  GetZoneParams,
  UpdateZoneOccupancyParams,
  UpdateZoneOccupancyBody,
} from "@workspace/api-zod";

const router = Router();

function computeStatus(occupancyPercent: number): "normal" | "busy" | "critical" {
  if (occupancyPercent >= 90) return "critical";
  if (occupancyPercent >= 75) return "busy";
  return "normal";
}

function formatZone(zone: typeof zonesTable.$inferSelect) {
  const occupancyPercent = zone.capacity > 0
    ? Math.round((zone.currentCount / zone.capacity) * 100)
    : 0;
  const waitTimeMinutes = Math.max(0, (occupancyPercent / 100) * 15);
  return {
    ...zone,
    occupancyPercent,
    waitTimeMinutes: Math.round(waitTimeMinutes * 10) / 10,
    status: computeStatus(occupancyPercent),
    updatedAt: zone.updatedAt.toISOString(),
  };
}

router.get("/zones", async (req, res): Promise<void> => {
  const zones = await db.select().from(zonesTable).orderBy(zonesTable.id);
  res.json(zones.map(formatZone));
});

router.get("/zones/summary", async (req, res): Promise<void> => {
  const zones = await db.select().from(zonesTable);
  const formatted = zones.map(formatZone);
  const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
  const totalAttendees = zones.reduce((sum, z) => sum + z.currentCount, 0);
  const overallOccupancyPercent = totalCapacity > 0
    ? Math.round((totalAttendees / totalCapacity) * 100)
    : 0;
  const criticalZones = formatted.filter((z) => z.status === "critical").length;
  const busyZones = formatted.filter((z) => z.status === "busy").length;
  const normalZones = formatted.filter((z) => z.status === "normal").length;
  const avgWaitTimeMinutes =
    formatted.length > 0
      ? Math.round(
          (formatted.reduce((sum, z) => sum + z.waitTimeMinutes, 0) /
            formatted.length) *
            10,
        ) / 10
      : 0;

  const { alertsTable } = await import("@workspace/db");
  const activeAlerts = await db
    .select()
    .from(alertsTable)
    .then((rows) => rows.filter((a) => !a.resolved).length);

  res.json({
    totalCapacity,
    totalAttendees,
    overallOccupancyPercent,
    criticalZones,
    busyZones,
    normalZones,
    activeAlerts,
    avgWaitTimeMinutes,
  });
});

router.get("/zones/:id", async (req, res): Promise<void> => {
  const parsed = GetZoneParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid zone ID" });
    return;
  }
  const zone = await db
    .select()
    .from(zonesTable)
    .where(eq(zonesTable.id, parsed.data.id))
    .then((rows) => rows[0]);
  if (!zone) {
    res.status(404).json({ error: "Zone not found" });
    return;
  }
  res.json(formatZone(zone));
});

router.patch("/zones/:id", async (req, res): Promise<void> => {
  const parsedParams = UpdateZoneOccupancyParams.safeParse({ id: Number(req.params.id) });
  if (!parsedParams.success) {
    res.status(400).json({ error: "Invalid zone ID" });
    return;
  }
  const parsedBody = UpdateZoneOccupancyBody.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.message });
    return;
  }
  const updated = await db
    .update(zonesTable)
    .set({ currentCount: parsedBody.data.currentCount })
    .where(eq(zonesTable.id, parsedParams.data.id))
    .returning();
  if (!updated[0]) {
    res.status(404).json({ error: "Zone not found" });
    return;
  }
  res.json(formatZone(updated[0]));
});

export default router;
