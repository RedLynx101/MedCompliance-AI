import { 
  type Patient, type InsertPatient,
  type Encounter, type InsertEncounter,
  type ComplianceFlag, type InsertComplianceFlag,
  type TranscriptSegment, type InsertTranscriptSegment,
  type Analytics, type InsertAnalytics,
  patients, encounters, complianceFlags, transcriptSegments, analytics
} from "@shared/schema";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Patients
  getPatients(): Promise<Patient[]>;
  getPatient(id: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;

  // Encounters
  getEncounters(): Promise<Encounter[]>;
  getEncounter(id: string): Promise<Encounter | undefined>;
  getEncountersByPatient(patientId: string): Promise<Encounter[]>;
  createEncounter(encounter: InsertEncounter): Promise<Encounter>;
  updateEncounter(id: string, encounter: Partial<Encounter>): Promise<Encounter>;

  // Compliance Flags
  getComplianceFlags(encounterId: string): Promise<ComplianceFlag[]>;
  createComplianceFlag(flag: InsertComplianceFlag): Promise<ComplianceFlag>;
  updateComplianceFlag(id: string, flag: Partial<ComplianceFlag>): Promise<ComplianceFlag>;

  // Transcript Segments
  getTranscriptSegments(encounterId: string): Promise<TranscriptSegment[]>;
  createTranscriptSegment(segment: InsertTranscriptSegment): Promise<TranscriptSegment>;
  deleteTranscriptSegment(segmentId: string): Promise<void>;

  // Analytics
  getAnalytics(): Promise<Analytics[]>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
}

export class MemStorage implements IStorage {
  private patients: Map<string, Patient> = new Map();
  private encounters: Map<string, Encounter> = new Map();
  private complianceFlags: Map<string, ComplianceFlag> = new Map();
  private transcriptSegments: Map<string, TranscriptSegment> = new Map();
  private analytics: Map<string, Analytics> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create sample patients
    const patient1: Patient = {
      id: "patient-1",
      name: "John Doe",
      dateOfBirth: "1975-03-15",
      mrn: "123456789",
      createdAt: new Date(),
    };

    const patient2: Patient = {
      id: "patient-2", 
      name: "Maria Johnson",
      dateOfBirth: "1982-07-22",
      mrn: "987654321",
      createdAt: new Date(),
    };

    const patient3: Patient = {
      id: "patient-3",
      name: "Robert Wilson", 
      dateOfBirth: "1967-11-08",
      mrn: "456789123",
      createdAt: new Date(),
    };

    this.patients.set(patient1.id, patient1);
    this.patients.set(patient2.id, patient2);
    this.patients.set(patient3.id, patient3);

    // Create sample encounters
    const encounter1: Encounter = {
      id: "encounter-1",
      patientId: "patient-1",
      appointmentTime: new Date("2024-12-24T14:30:00"),
      encounterType: "Follow-up",
      chiefComplaint: "Back pain",
      status: "in_progress",
      complianceRisk: "high",
      confidenceScore: 72,
      recordingDuration: 272,
      soapNotes: {
        subjective: "48-year-old male presents for follow-up of chronic lower back pain. Pain duration: 6 weeks, started after lifting. Reports worsening with prolonged sitting.",
        objective: "Vital signs: BP 128/84, HR 72, Temp 98.6°F. Physical exam pending.",
        assessment: "Chronic lower back pain, likely mechanical etiology. ICD-10: M54.5",
        plan: "Continue current treatment, physical therapy referral."
      },
      icdCodes: ["M54.5"],
      cptCodes: ["99213"],
      claimRiskScore: 72,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const encounter2: Encounter = {
      id: "encounter-2",
      patientId: "patient-2", 
      appointmentTime: new Date("2024-12-24T15:00:00"),
      encounterType: "Annual Physical",
      chiefComplaint: "Routine checkup",
      status: "completed",
      complianceRisk: "low",
      confidenceScore: 95,
      recordingDuration: 0,
      soapNotes: {
        subjective: "42-year-old female presents for annual physical examination. No acute complaints.",
        objective: "Vital signs normal. Complete physical examination performed.",
        assessment: "Healthy adult female. No acute issues identified.",
        plan: "Continue routine care, mammogram due next year."
      },
      icdCodes: ["Z00.00"],
      cptCodes: ["99395"],
      claimRiskScore: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const encounter3: Encounter = {
      id: "encounter-3",
      patientId: "patient-3",
      appointmentTime: new Date("2024-12-24T15:30:00"), 
      encounterType: "Consultation",
      chiefComplaint: "Chest pain",
      status: "scheduled",
      complianceRisk: "medium",
      confidenceScore: 87,
      recordingDuration: 0,
      soapNotes: null,
      icdCodes: [],
      cptCodes: [],
      claimRiskScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.encounters.set(encounter1.id, encounter1);
    this.encounters.set(encounter2.id, encounter2);
    this.encounters.set(encounter3.id, encounter3);

    // Create sample analytics
    const analytics1: Analytics = {
      id: "analytics-1",
      physicianId: "dr-chen",
      physicianName: "Dr. Sarah Chen",
      week: "2024-51",
      patientsCount: 47,
      complianceScore: 94.0,
      timeSaved: 12.4,
      denialRate: 2.1,
      createdAt: new Date(),
    };

    const analytics2: Analytics = {
      id: "analytics-2", 
      physicianId: "dr-rodriguez",
      physicianName: "Dr. Michael Rodriguez",
      week: "2024-51",
      patientsCount: 52,
      complianceScore: 87.0,
      timeSaved: 10.8,
      denialRate: 4.3,
      createdAt: new Date(),
    };

    const analytics3: Analytics = {
      id: "analytics-3",
      physicianId: "dr-thompson", 
      physicianName: "Dr. Emily Thompson",
      week: "2024-51",
      patientsCount: 41,
      complianceScore: 91.0,
      timeSaved: 11.2,
      denialRate: 2.8,
      createdAt: new Date(),
    };

    this.analytics.set(analytics1.id, analytics1);
    this.analytics.set(analytics2.id, analytics2);
    this.analytics.set(analytics3.id, analytics3);
  }

  // Patients
  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    const patient: Patient = { 
      ...insertPatient, 
      id,
      createdAt: new Date(),
    };
    this.patients.set(id, patient);
    return patient;
  }

  // Encounters
  async getEncounters(): Promise<Encounter[]> {
    return Array.from(this.encounters.values());
  }

  async getEncounter(id: string): Promise<Encounter | undefined> {
    return this.encounters.get(id);
  }

  async getEncountersByPatient(patientId: string): Promise<Encounter[]> {
    return Array.from(this.encounters.values()).filter(
      encounter => encounter.patientId === patientId
    );
  }

  async createEncounter(insertEncounter: InsertEncounter): Promise<Encounter> {
    const id = randomUUID();
    const encounter: Encounter = {
      ...insertEncounter,
      id,
      status: insertEncounter.status || "scheduled",
      complianceRisk: insertEncounter.complianceRisk || "low",
      confidenceScore: insertEncounter.confidenceScore || 95,
      recordingDuration: insertEncounter.recordingDuration || 0,
      claimRiskScore: insertEncounter.claimRiskScore || 0,
      soapNotes: insertEncounter.soapNotes || null,
      icdCodes: insertEncounter.icdCodes || [],
      cptCodes: insertEncounter.cptCodes || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.encounters.set(id, encounter);
    return encounter;
  }

  async updateEncounter(id: string, updateData: Partial<Encounter>): Promise<Encounter> {
    const existing = this.encounters.get(id);
    if (!existing) {
      throw new Error(`Encounter ${id} not found`);
    }
    
    const updated: Encounter = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.encounters.set(id, updated);
    return updated;
  }

  // Compliance Flags
  async getComplianceFlags(encounterId: string): Promise<ComplianceFlag[]> {
    return Array.from(this.complianceFlags.values()).filter(
      flag => flag.encounterId === encounterId
    );
  }

  async createComplianceFlag(insertFlag: InsertComplianceFlag): Promise<ComplianceFlag> {
    const id = randomUUID();
    const flag: ComplianceFlag = {
      ...insertFlag,
      id,
      isResolved: insertFlag.isResolved || false,
      userAction: insertFlag.userAction || null,
      createdAt: new Date(),
    };
    this.complianceFlags.set(id, flag);
    return flag;
  }

  async updateComplianceFlag(id: string, updateData: Partial<ComplianceFlag>): Promise<ComplianceFlag> {
    const existing = this.complianceFlags.get(id);
    if (!existing) {
      throw new Error(`Compliance flag ${id} not found`);
    }
    
    const updated: ComplianceFlag = {
      ...existing,
      ...updateData,
    };
    this.complianceFlags.set(id, updated);
    return updated;
  }

  // Transcript Segments
  async getTranscriptSegments(encounterId: string): Promise<TranscriptSegment[]> {
    return Array.from(this.transcriptSegments.values())
      .filter(segment => segment.encounterId === encounterId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  async createTranscriptSegment(insertSegment: InsertTranscriptSegment): Promise<TranscriptSegment> {
    const id = randomUUID();
    const segment: TranscriptSegment = {
      ...insertSegment,
      id,
      createdAt: new Date(),
    };
    this.transcriptSegments.set(id, segment);
    return segment;
  }

  async deleteTranscriptSegment(segmentId: string): Promise<void> {
    this.transcriptSegments.delete(segmentId);
  }

  // Analytics
  async getAnalytics(): Promise<Analytics[]> {
    return Array.from(this.analytics.values());
  }

  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const id = randomUUID();
    const analytics: Analytics = {
      ...insertAnalytics,
      id,
      createdAt: new Date(),
    };
    this.analytics.set(id, analytics);
    return analytics;
  }
}

// PostgreSQL Storage Implementation
export class PostgreSQLStorage implements IStorage {
  private db;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
  }

  // Patients
  async getPatients(): Promise<Patient[]> {
    return this.db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    const result = await this.db.select().from(patients).where(eq(patients.id, id)).limit(1);
    return result[0];
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const result = await this.db.insert(patients).values(insertPatient).returning();
    return result[0];
  }

  // Encounters
  async getEncounters(): Promise<Encounter[]> {
    return this.db.select().from(encounters).orderBy(desc(encounters.createdAt));
  }

  async getEncounter(id: string): Promise<Encounter | undefined> {
    const result = await this.db.select().from(encounters).where(eq(encounters.id, id)).limit(1);
    return result[0];
  }

  async getEncountersByPatient(patientId: string): Promise<Encounter[]> {
    return this.db.select().from(encounters).where(eq(encounters.patientId, patientId)).orderBy(desc(encounters.createdAt));
  }

  async createEncounter(insertEncounter: InsertEncounter): Promise<Encounter> {
    const result = await this.db.insert(encounters).values(insertEncounter).returning();
    return result[0];
  }

  async updateEncounter(id: string, updateData: Partial<Encounter>): Promise<Encounter> {
    const result = await this.db.update(encounters)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(encounters.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Encounter ${id} not found`);
    }
    return result[0];
  }

  // Compliance Flags
  async getComplianceFlags(encounterId: string): Promise<ComplianceFlag[]> {
    return this.db.select().from(complianceFlags)
      .where(eq(complianceFlags.encounterId, encounterId))
      .orderBy(desc(complianceFlags.createdAt));
  }

  async createComplianceFlag(insertFlag: InsertComplianceFlag): Promise<ComplianceFlag> {
    const result = await this.db.insert(complianceFlags).values(insertFlag).returning();
    return result[0];
  }

  async updateComplianceFlag(id: string, updateData: Partial<ComplianceFlag>): Promise<ComplianceFlag> {
    const result = await this.db.update(complianceFlags)
      .set(updateData)
      .where(eq(complianceFlags.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Compliance flag ${id} not found`);
    }
    return result[0];
  }

  // Transcript Segments
  async getTranscriptSegments(encounterId: string): Promise<TranscriptSegment[]> {
    return this.db.select().from(transcriptSegments)
      .where(eq(transcriptSegments.encounterId, encounterId))
      .orderBy(transcriptSegments.timestamp);
  }

  async createTranscriptSegment(insertSegment: InsertTranscriptSegment): Promise<TranscriptSegment> {
    const result = await this.db.insert(transcriptSegments).values(insertSegment).returning();
    return result[0];
  }

  async deleteTranscriptSegment(segmentId: string): Promise<void> {
    await this.db.delete(transcriptSegments).where(eq(transcriptSegments.id, segmentId));
  }

  // Analytics
  async getAnalytics(): Promise<Analytics[]> {
    return this.db.select().from(analytics).orderBy(desc(analytics.createdAt));
  }

  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const result = await this.db.insert(analytics).values(insertAnalytics).returning();
    return result[0];
  }
}

// Database seeding function
export async function seedDatabase() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  
  // Check if data already exists
  const existingPatients = await db.select().from(patients).limit(1);
  if (existingPatients.length > 0) {
    console.log('Database already seeded');
    return;
  }

  console.log('Seeding database...');
  
  // Create sample patients
  const patient1 = await db.insert(patients).values({
    id: "patient-1",
    name: "John Doe",
    dateOfBirth: "1975-03-15",
    mrn: "123456789",
  }).returning();

  const patient2 = await db.insert(patients).values({
    id: "patient-2", 
    name: "Maria Johnson",
    dateOfBirth: "1982-07-22",
    mrn: "987654321",
  }).returning();

  const patient3 = await db.insert(patients).values({
    id: "patient-3",
    name: "Robert Wilson", 
    dateOfBirth: "1967-11-08",
    mrn: "456789123",
  }).returning();

  // Create sample encounters
  await db.insert(encounters).values([
    {
      id: "encounter-1",
      patientId: "patient-1",
      appointmentTime: new Date("2024-12-24T14:30:00"),
      encounterType: "Follow-up",
      chiefComplaint: "Back pain",
      status: "in_progress",
      complianceRisk: "high",
      confidenceScore: 72,
      recordingDuration: 272,
      soapNotes: {
        subjective: "48-year-old male presents for follow-up of chronic lower back pain. Pain duration: 6 weeks, started after lifting. Reports worsening with prolonged sitting.",
        objective: "Vital signs: BP 128/84, HR 72, Temp 98.6°F. Physical exam pending.",
        assessment: "Chronic lower back pain, likely mechanical etiology. ICD-10: M54.5",
        plan: "Continue current treatment, physical therapy referral."
      },
      icdCodes: ["M54.5"],
      cptCodes: ["99213"],
      claimRiskScore: 72,
    },
    {
      id: "encounter-2",
      patientId: "patient-2", 
      appointmentTime: new Date("2024-12-24T15:00:00"),
      encounterType: "Annual Physical",
      chiefComplaint: "Routine checkup",
      status: "completed",
      complianceRisk: "low",
      confidenceScore: 95,
      recordingDuration: 0,
      soapNotes: {
        subjective: "42-year-old female presents for annual physical examination. No acute complaints.",
        objective: "Vital signs normal. Complete physical examination performed.",
        assessment: "Healthy adult female. No acute issues identified.",
        plan: "Continue routine care, mammogram due next year."
      },
      icdCodes: ["Z00.00"],
      cptCodes: ["99395"],
      claimRiskScore: 5,
    },
    {
      id: "encounter-3",
      patientId: "patient-3",
      appointmentTime: new Date("2024-12-24T15:30:00"), 
      encounterType: "Consultation",
      chiefComplaint: "Chest pain",
      status: "scheduled",
      complianceRisk: "medium",
      confidenceScore: 87,
      recordingDuration: 0,
      soapNotes: null,
      icdCodes: [],
      cptCodes: [],
      claimRiskScore: 0,
    }
  ]);

  // Create sample analytics
  await db.insert(analytics).values([
    {
      id: "analytics-1",
      physicianId: "dr-chen",
      physicianName: "Dr. Sarah Chen",
      week: "2024-51",
      patientsCount: 47,
      complianceScore: 94.0,
      timeSaved: 12.4,
      denialRate: 2.1,
    },
    {
      id: "analytics-2", 
      physicianId: "dr-rodriguez",
      physicianName: "Dr. Michael Rodriguez",
      week: "2024-51",
      patientsCount: 52,
      complianceScore: 87.0,
      timeSaved: 10.8,
      denialRate: 4.3,
    },
    {
      id: "analytics-3",
      physicianId: "dr-thompson", 
      physicianName: "Dr. Emily Thompson",
      week: "2024-51",
      patientsCount: 41,
      complianceScore: 91.0,
      timeSaved: 11.2,
      denialRate: 2.8,
    }
  ]);

  console.log('Database seeded successfully');
}

// Initialize storage based on environment
const createStorage = async (): Promise<IStorage> => {
  const storage = new PostgreSQLStorage();
  
  // Seed database if needed (for demo purposes, seed in both dev and production)
  await seedDatabase();
  
  return storage;
};

// Create storage instance
let storageInstance: IStorage | null = null;

export const getStorage = async (): Promise<IStorage> => {
  if (!storageInstance) {
    storageInstance = await createStorage();
  }
  return storageInstance;
};

// For backwards compatibility during transition
export const storage = new MemStorage();
