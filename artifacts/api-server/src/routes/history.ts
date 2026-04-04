import { Router, type Request, type Response } from "express";
import { db, analysesTable } from "@workspace/db";
import { desc, eq, count, sql } from "drizzle-orm";
import {
  ListAnalysesQueryParams,
  GetAnalysisParams,
  DeleteAnalysisParams,
  GetTopSpeciesQueryParams,
  SaveAnalysisBody,
} from "@workspace/api-zod";

const router = Router();

// Helper to format a DB row as an API record
function formatRecord(r: typeof analysesTable.$inferSelect) {
  return {
    id: r.id,
    filename: r.filename,
    analyzed_at: r.analyzed_at,
    detection_count: r.detection_count,
    top_species: r.top_species,
    top_confidence: r.top_confidence,
    detections: r.detections,
    location: { lat: r.lat, lon: r.lon, week: r.week },
    settings: { min_conf: r.min_conf, sensitivity: r.sensitivity, overlap: r.overlap },
  };
}

router.get("/history", async (req: Request, res: Response) => {
  const parsed = ListAnalysesQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = parsed.success ? (parsed.data.offset ?? 0) : 0;

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(analysesTable).orderBy(desc(analysesTable.analyzed_at)).limit(limit).offset(offset),
    db.select({ value: count() }).from(analysesTable),
  ]);

  res.json({ analyses: rows.map(formatRecord), total: Number(total) });
});

router.post("/history", async (req: Request, res: Response) => {
  const parsed = SaveAnalysisBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid body" });

  const { result, original_filename } = parsed.data;
  const { detections, location, settings } = result;

  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const top = sorted[0];

  const [saved] = await db
    .insert(analysesTable)
    .values({
      filename: original_filename,
      detection_count: detections.length,
      top_species: top?.common_name ?? null,
      top_confidence: top?.confidence ?? null,
      detections: detections as any,
      lat: location.lat ?? null,
      lon: location.lon ?? null,
      week: location.week ?? null,
      min_conf: settings.min_conf ?? 0.1,
      sensitivity: settings.sensitivity ?? 1.0,
      overlap: settings.overlap ?? 0.0,
    })
    .returning();

  res.status(201).json(formatRecord(saved));
});

router.get("/history/stats", async (_req: Request, res: Response) => {
  const [stats] = await db
    .select({
      total_analyses: count(),
      total_detections: sql<number>`coalesce(sum(${analysesTable.detection_count}), 0)`,
    })
    .from(analysesTable);

  const [uniqRow] = await db
    .select({ unique_species: sql<number>`count(distinct top_species)` })
    .from(analysesTable);

  const total = Number(stats.total_analyses);
  const detections = Number(stats.total_detections);

  res.json({
    total_analyses: total,
    total_detections: detections,
    unique_species: Number(uniqRow.unique_species),
    avg_detections_per_analysis: total > 0 ? detections / total : 0,
  });
});

router.get("/history/top-species", async (req: Request, res: Response) => {
  const parsed = GetTopSpeciesQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

  const rows = await db.execute(sql`
    SELECT
      det->>'scientific_name' AS scientific_name,
      det->>'common_name' AS common_name,
      COUNT(*)::int AS count,
      AVG((det->>'confidence')::float)::float AS avg_confidence
    FROM analyses,
         jsonb_array_elements(detections) AS det
    GROUP BY det->>'scientific_name', det->>'common_name'
    ORDER BY count DESC
    LIMIT ${limit}
  `);

  res.json({
    species: rows.rows.map((r: any) => ({
      scientific_name: r.scientific_name,
      common_name: r.common_name,
      count: r.count,
      avg_confidence: parseFloat(r.avg_confidence),
    })),
  });
});

router.get("/history/:id", async (req: Request, res: Response) => {
  const parsed = GetAnalysisParams.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid id" });

  const [row] = await db.select().from(analysesTable).where(eq(analysesTable.id, parsed.data.id));

  if (!row) return void res.status(404).json({ error: "Analysis not found" });
  res.json(formatRecord(row));
});

router.delete("/history/:id", async (req: Request, res: Response) => {
  const parsed = DeleteAnalysisParams.safeParse(req.params);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid id" });

  const deleted = await db
    .delete(analysesTable)
    .where(eq(analysesTable.id, parsed.data.id))
    .returning();

  if (deleted.length === 0) return void res.status(404).json({ error: "Analysis not found" });
  res.status(204).send();
});

export default router;
