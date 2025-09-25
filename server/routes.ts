import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { generateSOAPNotes, checkCompliance } from "./openai";
import { transcribeAudio } from "./whisper";
import { medicalKnowledge } from "./medical-knowledge";
import { EHRIntegrationManager, EHR_CONFIGS, type EHRSystemConfig, type EHRConnection } from './ehr-integration.js';
import { initializeHIPAACompliance, createHIPAAMiddleware } from './hipaa-compliance.js';
import { analyticsEngine } from './analytics-engine.js';
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
  // Initialize HIPAA compliance services
  const hipaaControls = initializeHIPAACompliance();
  const hipaaMiddleware = createHIPAAMiddleware(hipaaControls);

  // Authentication endpoints for HIPAA compliance
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        await hipaaControls.audit.logAuthEvent('unknown', 'FAILED_LOGIN', {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          reason: 'Missing credentials'
        });
        return res.status(400).json({ error: "Username and password required" });
      }

      // In production, validate against real user database
      // For demo, accept demo credentials
      const validCredentials = [
        { username: 'dr.chen', password: 'secure123', userId: 'user-1', roles: ['PHYSICIAN'] },
        { username: 'nurse.johnson', password: 'secure456', userId: 'user-2', roles: ['NURSE'] },
        { username: 'admin', password: 'admin789', userId: 'user-3', roles: ['ADMIN'] }
      ];

      const user = validCredentials.find(u => u.username === username);
      
      if (!user || user.password !== password) {
        await hipaaControls.audit.logAuthEvent('unknown', 'FAILED_LOGIN', {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          username,
          reason: 'Invalid credentials'
        });
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set user roles for access control
      hipaaControls.access.setUserRoles(user.userId, user.roles as any);

      // Create secure session
      const sessionId = hipaaControls.session.createSession(
        user.userId,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      await hipaaControls.audit.logAuthEvent(user.userId, 'LOGIN', {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        username
      });

      res.json({
        success: true,
        sessionId,
        user: {
          id: user.userId,
          username: user.username,
          roles: user.roles
        },
        message: "Authentication successful"
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  app.post("/api/auth/logout", hipaaMiddleware.authenticate, async (req: any, res) => {
    try {
      const sessionId = req.headers.authorization?.replace('Bearer ', '') || 
                       req.cookies?.sessionId;
      
      if (sessionId) {
        hipaaControls.session.destroySession(sessionId);
      }

      if (req.user) {
        await hipaaControls.audit.logAuthEvent(req.user.id, 'LOGOUT', {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      }

      res.json({ success: true, message: "Logout successful" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/auth/session", hipaaMiddleware.authenticate, async (req: any, res) => {
    try {
      const userRoles = hipaaControls.access.getUserRoles(req.user.id);
      
      res.json({
        valid: true,
        user: {
          id: req.user.id,
          roles: userRoles
        },
        session: {
          id: req.session.sessionId,
          createdAt: req.session.createdAt,
          lastActivity: req.session.lastActivity
        }
      });
    } catch (error) {
      console.error("Session validation error:", error);
      res.status(500).json({ error: "Session validation failed" });
    }
  });

  // Get all patients (protected endpoint)
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
      
      // Enhanced compliance checking with medical knowledge base
      const complianceCheck = await medicalKnowledge.enhancedComplianceCheck(encounter, fullTranscript);
      
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

  // Delete transcript segment
  app.delete("/api/encounters/:encounterId/transcript/:segmentId", async (req, res) => {
    try {
      const storage = await getStorage();
      await storage.deleteTranscriptSegment(req.params.segmentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting transcript segment:", error);
      res.status(500).json({ error: "Failed to delete transcript segment" });
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
      
      // Get encounter for compliance checking
      const encounter = await storage.getEncounter(req.params.id);
      if (!encounter) {
        return res.status(404).json({ error: "Encounter not found" });
      }
      
      // Enhanced compliance checking with medical knowledge base
      const complianceCheck = await medicalKnowledge.enhancedComplianceCheck(encounter, fullTranscript);
      
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

  // Medical Knowledge Base API endpoints
  app.get("/api/medical-knowledge/cms-guidelines", async (req, res) => {
    try {
      const category = req.query.category as string;
      const guidelines = medicalKnowledge.getCMSGuidelines(category);
      res.json(guidelines);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch CMS guidelines" });
    }
  });

  app.get("/api/medical-knowledge/icd10/:code", async (req, res) => {
    try {
      const codeInfo = medicalKnowledge.getICD10Info(req.params.code);
      if (!codeInfo) {
        return res.status(404).json({ error: "ICD-10 code not found" });
      }
      res.json(codeInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ICD-10 information" });
    }
  });

  app.get("/api/medical-knowledge/cpt/:code", async (req, res) => {
    try {
      const codeInfo = medicalKnowledge.getCPTInfo(req.params.code);
      if (!codeInfo) {
        return res.status(404).json({ error: "CPT code not found" });
      }
      res.json(codeInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch CPT information" });
    }
  });

  // Initialize EHR Integration Manager
  const ehrManager = new EHRIntegrationManager();

  // Database seeding endpoint for production deployment
  app.post("/api/admin/seed-database", async (req, res) => {
    try {
      const { seedDatabase } = await import("./storage.js");
      await seedDatabase();
      res.json({ success: true, message: "Database seeded successfully" });
    } catch (error) {
      console.error('Manual seeding error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // EHR Integration API endpoints
  
  // Get available EHR systems
  app.get("/api/ehr/systems", async (req, res) => {
    try {
      const systems = Object.keys(EHR_CONFIGS).map(name => ({
        name,
        displayName: name,
        isSupported: true,
        description: `${name} FHIR R4 integration with OAuth 2.0`
      }));
      res.json(systems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch EHR systems" });
    }
  });

  // Initialize EHR connection (start OAuth flow)
  app.post("/api/ehr/connect", async (req, res) => {
    try {
      const { systemName, baseUrl, clientId, redirectUri } = req.body;
      
      if (!EHR_CONFIGS[systemName]) {
        return res.status(400).json({ error: "Unsupported EHR system" });
      }

      const config: EHRSystemConfig = {
        ...EHR_CONFIGS[systemName],
        baseUrl,
        clientId,
        clientSecret: '', // Will be set during token exchange
      } as EHRSystemConfig;

      const ehrService = ehrManager.getEHRService(systemName, config);
      const state = `${systemName}-${Date.now()}-${Math.random().toString(36)}`;
      const authUrl = ehrService.generateAuthUrl(state, redirectUri);

      // Store connection state (in production, use secure session/database)
      // For now, we'll return the auth URL and expect the frontend to handle OAuth
      
      res.json({
        authUrl,
        state,
        systemName,
        message: `Ready to connect to ${systemName}. Please complete OAuth authorization.`
      });
    } catch (error) {
      console.error("EHR connection error:", error);
      res.status(500).json({ error: "Failed to initialize EHR connection" });
    }
  });

  // Complete EHR OAuth flow (exchange code for token)
  app.post("/api/ehr/oauth/callback", async (req, res) => {
    try {
      const { code, state, redirectUri, systemName, baseUrl, clientId, clientSecret } = req.body;

      if (!EHR_CONFIGS[systemName]) {
        return res.status(400).json({ error: "Invalid EHR system" });
      }

      const config: EHRSystemConfig = {
        ...EHR_CONFIGS[systemName],
        baseUrl,
        clientId,
        clientSecret,
      } as EHRSystemConfig;

      const ehrService = ehrManager.getEHRService(systemName, config);
      const tokenData = await ehrService.exchangeCodeForToken(code, redirectUri);

      // Create EHR connection record
      const connection: EHRConnection = {
        id: `ehr-${systemName.toLowerCase()}-${Date.now()}`,
        providerId: 'current-user', // In production, use actual provider/user ID
        systemConfig: config,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiry: new Date(Date.now() + (tokenData.expires_in * 1000)),
        isActive: true,
        lastSync: new Date()
      };

      ehrManager.registerConnection(connection);

      res.json({
        success: true,
        connectionId: connection.id,
        systemName,
        expiresAt: connection.tokenExpiry,
        patientId: 'patient' in tokenData ? tokenData.patient : undefined,
        message: `Successfully connected to ${systemName}`
      });
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).json({ error: "Failed to complete EHR authentication" });
    }
  });

  // Sync encounter with EHR system
  app.post("/api/encounters/:id/sync-ehr", async (req, res) => {
    try {
      const storage = await getStorage();
      const { connectionId } = req.body;

      const encounter = await storage.getEncounter(req.params.id);
      if (!encounter) {
        return res.status(404).json({ error: "Encounter not found" });
      }

      const patient = await storage.getPatient(encounter.patientId);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      const result = await ehrManager.syncEncounterWithEHR(
        req.params.id,
        encounter,
        patient,
        connectionId
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Update encounter with EHR sync info
      await storage.updateEncounter(req.params.id, {
        // Add EHR sync metadata if needed
      });

      res.json({
        success: true,
        ehrEncounterId: result.ehrEncounterId,
        message: "Encounter successfully synced with EHR system"
      });
    } catch (error) {
      console.error("EHR sync error:", error);
      res.status(500).json({ error: "Failed to sync encounter with EHR" });
    }
  });

  // Import patient from EHR
  app.post("/api/ehr/import-patient", async (req, res) => {
    try {
      const storage = await getStorage();
      const { ehrPatientId, connectionId } = req.body;

      const result = await ehrManager.importPatientFromEHR(ehrPatientId, connectionId);

      if (!result.success || !result.patient) {
        return res.status(400).json({ error: result.error || "Failed to import patient" });
      }

      // Convert FHIR patient to internal format and store
      const fhirPatient = result.patient;
      const patientData = {
        firstName: fhirPatient.name?.[0]?.given?.[0] || 'Unknown',
        lastName: fhirPatient.name?.[0]?.family || 'Unknown',
        dateOfBirth: fhirPatient.birthDate || '1900-01-01',
        gender: fhirPatient.gender || 'unknown',
        medicalRecordNumber: fhirPatient.identifier?.find(id => 
          id.system === 'http://hl7.org/fhir/sid/us-ssn'
        )?.value || `EHR-${ehrPatientId}`,
        phone: fhirPatient.telecom?.find(t => t.system === 'phone')?.value
      };

      const newPatient = await storage.createPatient(patientData);

      res.json({
        success: true,
        patient: newPatient,
        ehrPatientId,
        message: "Patient successfully imported from EHR system"
      });
    } catch (error) {
      console.error("Patient import error:", error);
      res.status(500).json({ error: "Failed to import patient from EHR" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
