import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, alertsTable, zonesTable } from "@workspace/db";
import { CreateAlertBody, ResolveAlertParams } from "@workspace/api-zod";

const router = Router();

async function formatAlert(alert: typeof alertsTable.$inferSelect) {
  const zone = await db
    .select()
    .from(zonesTable)
    .where(eq(zonesTable.id, alert.zoneId))
    .then((rows) => rows[0]);

  return {
    id: alert.id,
    zoneId: alert.zoneId,
    zoneName: zone?.name ?? "Unknown",
    type: alert.type,
    message: alert.message,
    severity: alert.severity,
    resolved: alert.resolved,
    createdAt: alert.createdAt.toISOString(),
    resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : null,
  };
}

router.get("/alerts", async (req, res): Promise<void> => {
  const resolvedParam = req.query.resolved;
  let alerts = await db.select().from(alertsTable).orderBy(alertsTable.createdAt);

  if (resolvedParam !== undefined) {
    const resolved = resolvedParam === "true";
    alerts = alerts.filter((a) => a.resolved === resolved);
  }

  const formatted = await Promise.all(alerts.map(formatAlert));
  res.json(formatted);
});

router.post("/alerts", async (req, res): Promise<void> => {
  const parsed = CreateAlertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const zone = await db
    .select()
    .from(zonesTable)
    .where(eq(zonesTable.id, parsed.data.zoneId))
    .then((rows) => rows[0]);

  if (!zone) {
    res.status(404).json({ error: "Zone not found" });
    return;
  }

  const alert = await db
    .insert(alertsTable)
    .values(parsed.data)
    .returning()
    .then((rows) => rows[0]);

  res.status(201).json(await formatAlert(alert));
});

router.patch("/alerts/:id/resolve", async (req, res): Promise<void> => {
  const parsed = ResolveAlertParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid alert ID" });
    return;
  }

  const updated = await db
    .update(alertsTable)
    .set({ resolved: true, resolvedAt: new Date() })
    .where(eq(alertsTable.id, parsed.data.id))
    .returning()
    .then((rows) => rows[0]);

  if (!updated) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  res.json(await formatAlert(updated));
});

export default router;
