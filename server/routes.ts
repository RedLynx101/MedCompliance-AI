import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { generateSOAPNotes, checkCompliance } from "./openai";
import { transcribeAudio } from "./whisper";
import { insertEncounterSchema, insertComplianceFlagSchema, insertTranscriptSegmentSchema } from "@shared/schema";
import multer from "multer";

// Configure multer for handling audio uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for audio files
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all patients
  app.get("/api/patients", async (req, res) => {
    try {
      const storage = await getStorage();
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  });

  // Get all encounters with patient data
  app.get("/api/encounters", async (req, res) => {
    try {
      const storage = await getStorage();
      const encounters = await storage.getEncounters();
      const patients = await storage.getPatients();
      
      const encountersWithPatients = encounters.map(encounter => {
        const patient = patients.find(p => p.id === encounter.patientId);
        return {
          ...encounter,
          patient
        };
      });
      
      res.json(encountersWithPatients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch encounters" });
    }
  });

  // Get specific encounter
  app.get("/api/encounters/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const encounter = await storage.getEncounter(req.params.id);
      if (!encounter) {
        return res.status(404).json({ error: "Encounter not found" });
      }
      
      const patient = await storage.getPatient(encounter.patientId);
      const complianceFlags = await storage.getComplianceFlags(encounter.id);
      const transcriptSegments = await storage.getTranscriptSegments(encounter.id);
      
      res.json({
        ...encounter,
        patient,
        complianceFlags,
        transcriptSegments
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch encounter" });
    }
  });

  // Update encounter
  app.patch("/api/encounters/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const updated = await storage.updateEncounter(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update encounter" });
    }
  });

  // Upload and transcribe audio
  app.post("/api/encounters/:id/transcribe", upload.single('audio'), async (req, res) => {
    try {
      const storage = await getStorage();
      
      if (!req.file) {
        return res.status(400).json({ 
          error: "No audio file provided",
          code: "MISSING_AUDIO_FILE" 
        });
      }

      // Validate encounter exists
      const encounter = await storage.getEncounter(req.params.id);
      if (!encounter) {
        return res.status(404).json({ 
          error: "Encounter not found",
          code: "ENCOUNTER_NOT_FOUND" 
        });
      }

      // Validate and parse request body
      const speakerSchema = insertTranscriptSegmentSchema.pick({ speaker: true });
      const timestampSchema = insertTranscriptSegmentSchema.pick({ timestamp: true });
      
      const speakerResult = speakerSchema.safeParse({ speaker: req.body.speaker });
      const timestampResult = timestampSchema.safeParse({ timestamp: parseInt(req.body.timestamp) || 0 });
      
      if (!speakerResult.success || !timestampResult.success) {
        return res.status(400).json({ 
          error: "Invalid speaker or timestamp",
          code: "VALIDATION_ERROR",
          details: {
            speaker: speakerResult.error?.issues,
            timestamp: timestampResult.error?.issues
          }
        });
      }

      const { speaker } = speakerResult.data;
      const { timestamp } = timestampResult.data;
      
      // Transcribe audio using Whisper with correct MIME type
      const transcribedText = await transcribeAudio(
        req.file.buffer, 
        req.file.mimetype, 
        req.file.originalname
      );
      
      if (!transcribedText.trim()) {
        return res.status(400).json({ 
          error: "No speech detected in audio",
          code: "NO_SPEECH_DETECTED" 
        });
      }

      // Add transcript segment
      const segment = await storage.createTranscriptSegment({
        encounterId: req.params.id,
        speaker,
        content: transcribedText.trim(),
        timestamp
      });

      // Get all transcript segments for this encounter
      const allSegments = await storage.getTranscriptSegments(req.params.id);
      const fullTranscript = allSegments
        .map((s: any) => `${s.speaker}: ${s.content}`)
        .join('\n');

      // Generate updated SOAP notes
      const soapNotes = await generateSOAPNotes(fullTranscript);
      
      // Check compliance
      const complianceCheck = await checkCompliance(soapNotes, fullTranscript);
      
      // Update encounter with new SOAP notes and risk score
      await storage.updateEncounter(req.params.id, {
        soapNotes,
        claimRiskScore: 100 - complianceCheck.riskScore // Invert so higher score = higher risk
      });

      // Create compliance flags
      for (const flag of complianceCheck.flags) {
        await storage.createComplianceFlag({
          encounterId: req.params.id,
          flagType: flag.type,
          severity: flag.severity,
          message: flag.message,
          explanation: flag.explanation
        });
      }

      res.json({
        segment,
        transcribedText,
        soapNotes,
        complianceFlags: complianceCheck.flags,
        suggestions: complianceCheck.suggestions
      });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  // Add transcript segment and generate SOAP notes (legacy endpoint for manual input)
  app.post("/api/encounters/:id/transcript", async (req, res) => {
    try {
      const storage = await getStorage();
      const { speaker, content, timestamp } = req.body;
      
      // Add transcript segment
      const segment = await storage.createTranscriptSegment({
        encounterId: req.params.id,
        speaker,
        content,
        timestamp
      });

      // Get all transcript segments for this encounter
      const allSegments = await storage.getTranscriptSegments(req.params.id);
      const fullTranscript = allSegments
        .map((s: any) => `${s.speaker}: ${s.content}`)
        .join('\n');

      // Generate updated SOAP notes
      const soapNotes = await generateSOAPNotes(fullTranscript);
      
      // Check compliance
      const complianceCheck = await checkCompliance(soapNotes, fullTranscript);
      
      // Update encounter with new SOAP notes and risk score
      await storage.updateEncounter(req.params.id, {
        soapNotes,
        claimRiskScore: 100 - complianceCheck.riskScore // Invert so higher score = higher risk
      });

      // Create compliance flags
      for (const flag of complianceCheck.flags) {
        await storage.createComplianceFlag({
          encounterId: req.params.id,
          flagType: flag.type,
          severity: flag.severity,
          message: flag.message,
          explanation: flag.explanation
        });
      }

      res.json({
        segment,
        soapNotes,
        complianceFlags: complianceCheck.flags,
        suggestions: complianceCheck.suggestions
      });
    } catch (error) {
      console.error("Error processing transcript:", error);
      res.status(500).json({ error: "Failed to process transcript" });
    }
  });

  // Handle compliance flag actions
  app.patch("/api/compliance-flags/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { userAction } = req.body;
      const updated = await storage.updateComplianceFlag(req.params.id, {
        userAction,
        isResolved: userAction === "accept" || userAction === "dismiss"
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update compliance flag" });
    }
  });

  // Get analytics data
  app.get("/api/analytics", async (req, res) => {
    try {
      const storage = await getStorage();
      const analytics = await storage.getAnalytics();
      
      // Calculate aggregate metrics
      const totalPatients = analytics.reduce((sum: number, a: any) => sum + a.patientsCount, 0);
      const avgComplianceScore = analytics.reduce((sum: number, a: any) => sum + a.complianceScore, 0) / analytics.length;
      const totalTimeSaved = analytics.reduce((sum: number, a: any) => sum + a.timeSaved, 0);
      const avgDenialRate = analytics.reduce((sum: number, a: any) => sum + a.denialRate, 0) / analytics.length;
      
      // Calculate estimated cost savings (assuming $150/hour saved)
      const monthlyCostSavings = totalTimeSaved * 4 * 150; // 4 weeks * $150/hour
      
      res.json({
        physicianAnalytics: analytics,
        summary: {
          totalPatients,
          avgComplianceScore: Math.round(avgComplianceScore),
          totalTimeSaved,
          avgDenialRate,
          monthlyCostSavings: Math.round(monthlyCostSavings)
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Generate post-visit report
  app.get("/api/encounters/:id/report", async (req, res) => {
    try {
      const storage = await getStorage();
      const encounter = await storage.getEncounter(req.params.id);
      if (!encounter) {
        return res.status(404).json({ error: "Encounter not found" });
      }

      const patient = await storage.getPatient(encounter.patientId);
      const complianceFlags = await storage.getComplianceFlags(req.params.id);
      const unresolvedFlags = complianceFlags.filter((f: any) => !f.isResolved);
      
      // Calculate claim risk assessment
      let riskLevel = "Low";
      if (encounter.claimRiskScore && encounter.claimRiskScore > 50) riskLevel = "Medium";
      if (encounter.claimRiskScore && encounter.claimRiskScore > 75) riskLevel = "High";
      
      res.json({
        encounter,
        patient,
        riskLevel,
        riskScore: encounter.claimRiskScore,
        finalSoapNotes: encounter.soapNotes,
        codingSuggestions: {
          icdCodes: encounter.icdCodes || [],
          cptCodes: encounter.cptCodes || []
        },
        unresolvedFlags
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
