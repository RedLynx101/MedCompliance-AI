import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateSOAPNotes, checkCompliance } from "./openai";
import { insertEncounterSchema, insertComplianceFlagSchema, insertTranscriptSegmentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all patients
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  });

  // Get all encounters with patient data
  app.get("/api/encounters", async (req, res) => {
    try {
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
      const updated = await storage.updateEncounter(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update encounter" });
    }
  });

  // Add transcript segment and generate SOAP notes
  app.post("/api/encounters/:id/transcript", async (req, res) => {
    try {
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
        .map(s => `${s.speaker}: ${s.content}`)
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
      const analytics = await storage.getAnalytics();
      
      // Calculate aggregate metrics
      const totalPatients = analytics.reduce((sum, a) => sum + a.patientsCount, 0);
      const avgComplianceScore = analytics.reduce((sum, a) => sum + a.complianceScore, 0) / analytics.length;
      const totalTimeSaved = analytics.reduce((sum, a) => sum + a.timeSaved, 0);
      const avgDenialRate = analytics.reduce((sum, a) => sum + a.denialRate, 0) / analytics.length;
      
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
      const encounter = await storage.getEncounter(req.params.id);
      if (!encounter) {
        return res.status(404).json({ error: "Encounter not found" });
      }

      const patient = await storage.getPatient(encounter.patientId);
      const complianceFlags = await storage.getComplianceFlags(req.params.id);
      const unresolvedFlags = complianceFlags.filter(f => !f.isResolved);
      
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
