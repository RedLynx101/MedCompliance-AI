import { 
  type Patient, type InsertPatient,
  type Encounter, type InsertEncounter,
  type ComplianceFlag, type InsertComplianceFlag,
  type TranscriptSegment, type InsertTranscriptSegment,
  type Analytics, type InsertAnalytics
} from "@shared/schema";
import { randomUUID } from "crypto";

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

export const storage = new MemStorage();
