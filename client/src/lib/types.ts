import { type Patient, type Encounter, type ComplianceFlag, type TranscriptSegment, type Analytics } from "@shared/schema";

export interface EncounterWithPatient extends Encounter {
  patient?: Patient;
  complianceFlags?: ComplianceFlag[];
  transcriptSegments?: TranscriptSegment[];
}

export interface AnalyticsResponse {
  physicianAnalytics: Analytics[];
  summary: {
    totalPatients: number;
    avgComplianceScore: number;
    totalTimeSaved: number;
    avgDenialRate: number;
    monthlyCostSavings: number;
  };
}

export interface PostVisitReport {
  encounter: Encounter;
  patient: Patient;
  riskLevel: string;
  riskScore: number;
  finalSoapNotes: any;
  codingSuggestions: {
    icdCodes: string[];
    cptCodes: string[];
  };
  unresolvedFlags: ComplianceFlag[];
}

export interface TranscriptMessage {
  speaker: "doctor" | "patient";
  content: string;
  timestamp: number;
}
