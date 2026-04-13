import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, staffMessagesTable, zonesTable } from "@workspace/db";
import { CreateStaffMessageBody } from "@workspace/api-zod";

const router = Router();

router.get("/staff/messages", async (req, res): Promise<void> => {
  const messages = await db
    .select()
    .from(staffMessagesTable)
    .orderBy(staffMessagesTable.createdAt);

  const zones = await db.select().from(zonesTable);

  const formatted = messages.map((m) => {
    const zone = m.zoneId ? zones.find((z) => z.id === m.zoneId) : null;
    return {
      id: m.id,
      author: m.author,
      role: m.role,
      message: m.message,
      zoneId: m.zoneId ?? null,
      zoneName: zone?.name ?? null,
      createdAt: m.createdAt.toISOString(),
    };
  });

  res.json(formatted);
});

router.post("/staff/messages", async (req, res): Promise<void> => {
  const parsed = CreateStaffMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const msg = await db
    .insert(staffMessagesTable)
    .values(parsed.data)
    .returning()
    .then((rows) => rows[0]);

  const zone = msg.zoneId
    ? await db
        .select()
        .from(zonesTable)
        .where(eq(zonesTable.id, msg.zoneId))
        .then((rows) => rows[0])
    : null;

  res.status(201).json({
    id: msg.id,
    author: msg.author,
    role: msg.role,
    message: msg.message,
    zoneId: msg.zoneId ?? null,
    zoneName: zone?.name ?? null,
    createdAt: msg.createdAt.toISOString(),
  });
});

export default router;
