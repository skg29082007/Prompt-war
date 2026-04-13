import { Router } from "express";
import { db, alertsTable, zonesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/analytics/peak-times", async (req, res): Promise<void> => {
  const peakTimes = [
    { hour: "10:00", attendees: 12000, label: "Doors Open" },
    { hour: "11:00", attendees: 28000, label: "Pre-Game Rush" },
    { hour: "12:00", attendees: 52000, label: "Arriving" },
    { hour: "13:00", attendees: 71000, label: "Game Start" },
    { hour: "14:00", attendees: 78000, label: "Peak" },
    { hour: "15:00", attendees: 76000, label: "Halftime" },
    { hour: "16:00", attendees: 80000, label: "2nd Half" },
    { hour: "17:00", attendees: 74000, label: "Final Minutes" },
    { hour: "18:00", attendees: 55000, label: "Exodus" },
    { hour: "19:00", attendees: 22000, label: "Dispersing" },
    { hour: "20:00", attendees: 5000, label: "Venue Clear" },
  ];
  res.json(peakTimes);
});

router.get("/analytics/wait-times", async (req, res): Promise<void> => {
  const zones = await db.select().from(zonesTable);
  const waitTimes = zones.map((z) => {
    const occupancyPercent = z.capacity > 0 ? (z.currentCount / z.capacity) * 100 : 0;
    const avgWait = Math.max(1, (occupancyPercent / 100) * 15);
    const peakWait = Math.min(30, avgWait * 1.8);
    return {
      zoneName: z.name,
      zoneType: z.type,
      avgWaitMinutes: Math.round(avgWait * 10) / 10,
      peakWaitMinutes: Math.round(peakWait * 10) / 10,
    };
  });
  res.json(waitTimes);
});

router.get("/analytics/incidents", async (req, res): Promise<void> => {
  const alerts = await db.select().from(alertsTable).orderBy(alertsTable.createdAt);
  const zones = await db.select().from(zonesTable);

  const incidents = alerts.map((a, i) => {
    const zone = zones.find((z) => z.id === a.zoneId);
    return {
      id: i + 1,
      alertId: a.id,
      zoneName: zone?.name ?? "Unknown",
      type: a.type,
      description: a.message,
      severity: a.severity,
      occurredAt: a.createdAt.toISOString(),
      resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null,
    };
  });

  res.json(incidents);
});

export default router;
