import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  mrn: text("mrn").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const encounters = pgTable("encounters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id).notNull(),
  appointmentTime: timestamp("appointment_time").notNull(),
  encounterType: text("encounter_type").notNull(),
  chiefComplaint: text("chief_complaint").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed
  complianceRisk: text("compliance_risk").notNull().default("low"), // low, medium, high
  confidenceScore: integer("confidence_score").notNull().default(95),
  recordingDuration: integer("recording_duration").default(0), // in seconds
  soapNotes: jsonb("soap_notes"),
  icdCodes: text("icd_codes").array(),
  cptCodes: text("cpt_codes").array(),
  claimRiskScore: integer("claim_risk_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const complianceFlags = pgTable("compliance_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  encounterId: varchar("encounter_id").references(() => encounters.id).notNull(),
  flagType: text("flag_type").notNull(),
  severity: text("severity").notNull(), // info, warning, error
  message: text("message").notNull(),
  explanation: text("explanation").notNull(),
  isResolved: boolean("is_resolved").default(false),
  userAction: text("user_action"), // accept, dismiss, null
  createdAt: timestamp("created_at").defaultNow(),
});

export const transcriptSegments = pgTable("transcript_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  encounterId: varchar("encounter_id").references(() => encounters.id).notNull(),
  speaker: text("speaker").notNull(), // doctor, patient
  content: text("content").notNull(),
  timestamp: integer("timestamp").notNull(), // seconds from start
  createdAt: timestamp("created_at").defaultNow(),
});

export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  physicianId: text("physician_id").notNull(),
  physicianName: text("physician_name").notNull(),
  week: text("week").notNull(), // YYYY-WW format
  patientsCount: integer("patients_count").notNull(),
  complianceScore: real("compliance_score").notNull(),
  timeSaved: real("time_saved").notNull(), // hours
  denialRate: real("denial_rate").notNull(), // percentage
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
});

export const insertEncounterSchema = createInsertSchema(encounters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComplianceFlagSchema = createInsertSchema(complianceFlags).omit({
  id: true,
  createdAt: true,
});

export const insertTranscriptSegmentSchema = createInsertSchema(transcriptSegments).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  createdAt: true,
});

// Types
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Encounter = typeof encounters.$inferSelect;
export type InsertEncounter = z.infer<typeof insertEncounterSchema>;

export type ComplianceFlag = typeof complianceFlags.$inferSelect;
export type InsertComplianceFlag = z.infer<typeof insertComplianceFlagSchema>;

export type TranscriptSegment = typeof transcriptSegments.$inferSelect;
export type InsertTranscriptSegment = z.infer<typeof insertTranscriptSegmentSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
