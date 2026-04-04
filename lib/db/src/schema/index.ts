import { pgTable, serial, text, integer, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  analyzed_at: timestamp("analyzed_at").defaultNow().notNull(),
  detection_count: integer("detection_count").notNull().default(0),
  top_species: text("top_species"),
  top_confidence: real("top_confidence"),
  detections: jsonb("detections").notNull().default([]),
  lat: real("lat"),
  lon: real("lon"),
  week: integer("week"),
  min_conf: real("min_conf").notNull().default(0.1),
  sensitivity: real("sensitivity").notNull().default(1.0),
  overlap: real("overlap").notNull().default(0.0),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({ id: true, analyzed_at: true });
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
