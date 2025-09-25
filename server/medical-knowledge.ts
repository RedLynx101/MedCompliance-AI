import { generateSOAPNotes, checkCompliance } from "./openai";

// Medical Knowledge Base Interface
export interface MedicalKnowledgeBase {
  // ICD-10 Code Information
  icd10Codes: Map<string, ICD10CodeInfo>;
  // CPT Code Information  
  cptCodes: Map<string, CPTCodeInfo>;
  // CMS Guidelines
  cmsGuidelines: CMSGuideline[];
  // Common Compliance Rules
  complianceRules: ComplianceRule[];
}

export interface ICD10CodeInfo {
  code: string;
  description: string;
  category: string;
  requiredDocumentation: string[];
  excludedCodes: string[];
  commonCombinations: string[];
  billabilityRequirements: string[];
}

export interface CPTCodeInfo {
  code: string;
  description: string;
  category: string;
  requiredElements: string[];
  timeRequirements?: string;
  documentationRequirements: string[];
  modifiers: string[];
  typicalICD10Combinations: string[];
}

export interface CMSGuideline {
  id: string;
  title: string;
  category: string;
  description: string;
  requirements: string[];
  auditRisks: string[];
  effectiveDate: string;
  lastUpdated: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  checkFunction: (encounter: any, transcript: string) => boolean;
  message: string;
  explanation: string;
  remediation: string[];
}

// Initialize Medical Knowledge Base
export class MedicalKnowledgeService {
  private knowledgeBase: MedicalKnowledgeBase;

  constructor() {
    this.knowledgeBase = this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase(): MedicalKnowledgeBase {
    return {
      icd10Codes: this.loadICD10Codes(),
      cptCodes: this.loadCPTCodes(),
      cmsGuidelines: this.loadCMSGuidelines(),
      complianceRules: this.loadComplianceRules(),
    };
  }

  private loadICD10Codes(): Map<string, ICD10CodeInfo> {
    const codes = new Map<string, ICD10CodeInfo>();

    // Common pain-related ICD-10 codes
    codes.set("M54.5", {
      code: "M54.5",
      description: "Low back pain",
      category: "Musculoskeletal",
      requiredDocumentation: [
        "Pain location (specific region of back)",
        "Pain duration (acute vs chronic)",
        "Pain characteristics (sharp, dull, radiating)",
        "Aggravating and alleviating factors",
        "Pain scale rating (0-10)",
        "Impact on daily activities"
      ],
      excludedCodes: ["M54.9"],
      commonCombinations: ["M79.3", "M25.511"],
      billabilityRequirements: [
        "Physical examination findings required",
        "Documentation of treatment plan",
        "Assessment of pain severity"
      ]
    });

    codes.set("M54.9", {
      code: "M54.9",
      description: "Dorsalgia, unspecified",
      category: "Musculoskeletal", 
      requiredDocumentation: [
        "General back pain documentation",
        "Duration of symptoms",
        "Physical examination findings"
      ],
      excludedCodes: ["M54.5"],
      commonCombinations: ["M79.3"],
      billabilityRequirements: [
        "Physical examination required",
        "Documentation of symptoms"
      ]
    });

    codes.set("Z00.00", {
      code: "Z00.00",
      description: "Encounter for general adult medical examination without abnormal findings",
      category: "Preventive Care",
      requiredDocumentation: [
        "Comprehensive history",
        "Complete physical examination",
        "Review of systems", 
        "Assessment of health status",
        "Preventive counseling",
        "Age-appropriate screening recommendations"
      ],
      excludedCodes: [],
      commonCombinations: ["Z87.891", "Z23"],
      billabilityRequirements: [
        "Complete physical examination documented",
        "Review of systems documented",
        "Age-appropriate counseling provided"
      ]
    });

    return codes;
  }

  private loadCPTCodes(): Map<string, CPTCodeInfo> {
    const codes = new Map<string, CPTCodeInfo>();

    codes.set("99213", {
      code: "99213",
      description: "Office/outpatient visit, established patient, level 3",
      category: "Evaluation and Management",
      requiredElements: [
        "Detailed history",
        "Detailed examination", 
        "Medical decision making of low complexity"
      ],
      timeRequirements: "Typically 15 minutes",
      documentationRequirements: [
        "Chief complaint",
        "History of present illness (4+ elements)",
        "Review of systems (2-9 systems)",
        "Examination of affected body area and other symptomatic systems",
        "Assessment and plan with multiple treatment options"
      ],
      modifiers: ["25", "57"],
      typicalICD10Combinations: ["M54.5", "M54.9", "I10"]
    });

    codes.set("99395", {
      code: "99395",
      description: "Periodic comprehensive preventive medicine, established patient, 18-39 years",
      category: "Preventive Medicine",
      requiredElements: [
        "Comprehensive history",
        "Comprehensive examination",
        "Counseling/anticipatory guidance",
        "Risk factor reduction interventions"
      ],
      documentationRequirements: [
        "Complete medical history",
        "Family and social history",
        "Complete physical examination",
        "Age and gender appropriate screening",
        "Health counseling and education"
      ],
      modifiers: [],
      typicalICD10Combinations: ["Z00.00", "Z01.419"]
    });

    return codes;
  }

  private loadCMSGuidelines(): CMSGuideline[] {
    return [
      {
        id: "cms-eval-mgmt-2023",
        title: "Evaluation and Management Documentation Guidelines",
        category: "Documentation",
        description: "CMS requirements for E/M service documentation and billing",
        requirements: [
          "Medical necessity must be clearly documented",
          "Level of service must match documentation",
          "Chief complaint must be documented",
          "History of present illness required for levels 2-5",
          "Physical examination must match service level"
        ],
        auditRisks: [
          "Upcoding - billing higher level than documented",
          "Missing medical necessity justification",
          "Insufficient documentation for billed level"
        ],
        effectiveDate: "2023-01-01",
        lastUpdated: "2024-12-01"
      },
      {
        id: "cms-pain-mgmt-2024",
        title: "Chronic Pain Management Documentation",
        category: "Clinical",
        description: "CMS guidelines for chronic pain documentation and opioid prescribing",
        requirements: [
          "Pain assessment using standardized scale",
          "Functional assessment and impact documentation",
          "Prior treatment attempts documented",
          "Non-pharmacological interventions considered",
          "Risk assessment for controlled substances"
        ],
        auditRisks: [
          "Inadequate pain assessment documentation",
          "Missing functional impact assessment",
          "Insufficient justification for treatment plan"
        ],
        effectiveDate: "2024-01-01",
        lastUpdated: "2024-12-01"
      }
    ];
  }

  private loadComplianceRules(): ComplianceRule[] {
    return [
      {
        id: "missing-physical-exam",
        name: "Missing Physical Examination",
        category: "Documentation",
        severity: "critical",
        description: "Physical examination findings are required for most E/M services",
        checkFunction: (encounter: any, transcript: string) => {
          const hasPhysicalExam = transcript.toLowerCase().includes('examination') ||
                                 transcript.toLowerCase().includes('physical exam') ||
                                 transcript.toLowerCase().includes('vital signs') ||
                                 encounter.soapNotes?.objective?.toLowerCase().includes('exam');
          return !hasPhysicalExam;
        },
        message: "Missing physical examination findings",
        explanation: "Physical examination documentation is required for proper billing and medical necessity",
        remediation: [
          "Document relevant physical examination findings",
          "Include vital signs if appropriate",
          "Note normal and abnormal findings"
        ]
      },
      {
        id: "missing-pain-scale",
        name: "Missing Pain Scale Assessment",
        category: "Clinical",
        severity: "high",
        description: "Pain scale assessment required for pain-related encounters",
        checkFunction: (encounter: any, transcript: string) => {
          const painKeywords = transcript.toLowerCase();
          const hasPainComplaint = painKeywords.includes('pain') || painKeywords.includes('hurt');
          const hasPainScale = painKeywords.includes('scale') || 
                              painKeywords.includes('/10') ||
                              painKeywords.includes('out of 10') ||
                              /\b([0-9]|10)\s*(\/|out\s+of)\s*10\b/.test(painKeywords);
          return hasPainComplaint && !hasPainScale;
        },
        message: "Pain scale assessment not documented",
        explanation: "Standardized pain scale (0-10) required for pain management and billing compliance",
        remediation: [
          "Document pain scale rating (0-10)",
          "Note pain characteristics and location",
          "Assess functional impact of pain"
        ]
      },
      {
        id: "insufficient-history",
        name: "Insufficient History of Present Illness",
        category: "Documentation",
        severity: "medium",
        description: "History of present illness lacks required elements",
        checkFunction: (encounter: any, transcript: string) => {
          const hpiElements = [
            /duration|how long|started|began/i,
            /location|where|area/i,
            /quality|type|kind|character/i,
            /severity|scale|intensity/i,
            /timing|when|frequency/i,
            /context|caused|triggered/i,
            /modifying|better|worse|aggravat/i,
            /associated|symptoms|accompan/i
          ];
          
          const foundElements = hpiElements.filter(pattern => pattern.test(transcript));
          return foundElements.length < 4; // Need at least 4 HPI elements for detailed history
        },
        message: "History of present illness needs more detail",
        explanation: "Detailed history requires 4+ elements: location, quality, severity, duration, timing, context, modifying factors, associated symptoms",
        remediation: [
          "Document pain/symptom location and character",
          "Note onset, duration, and timing",
          "Assess aggravating and alleviating factors",
          "Document associated symptoms"
        ]
      }
    ];
  }

  // Enhanced compliance checking using medical knowledge
  public async enhancedComplianceCheck(encounter: any, transcript: string): Promise<{
    flags: Array<{
      type: string;
      severity: string;
      message: string;
      explanation: string;
      remediation?: string[];
    }>;
    suggestions: Array<{
      code: string;
      description: string;
      type: string;
      confidence: number;
      documentation_requirements?: string[];
    }>;
    riskScore: number;
  }> {
    const flags: any[] = [];
    const suggestions: any[] = [];

    // Run standard compliance rules
    for (const rule of this.knowledgeBase.complianceRules) {
      if (rule.checkFunction(encounter, transcript)) {
        flags.push({
          type: rule.id,
          severity: rule.severity,
          message: rule.message,
          explanation: rule.explanation,
          remediation: rule.remediation
        });
      }
    }

    // Suggest appropriate ICD-10 codes based on symptoms
    const suggestedICD10 = this.suggestICD10Codes(transcript);
    suggestions.push(...suggestedICD10);

    // Suggest appropriate CPT codes based on encounter type
    const suggestedCPT = this.suggestCPTCodes(encounter, transcript);
    suggestions.push(...suggestedCPT);

    // Calculate risk score based on flags and missing elements
    const riskScore = this.calculateRiskScore(flags, encounter, transcript);

    return {
      flags,
      suggestions,
      riskScore
    };
  }

  private suggestICD10Codes(transcript: string): any[] {
    const suggestions: any[] = [];
    const lowerTranscript = transcript.toLowerCase();

    // Pain-related codes
    if (lowerTranscript.includes('back pain') || lowerTranscript.includes('lower back')) {
      const icd10Info = this.knowledgeBase.icd10Codes.get("M54.5");
      if (icd10Info) {
        suggestions.push({
          code: "M54.5",
          description: icd10Info.description,
          type: "icd10",
          confidence: 85,
          documentation_requirements: icd10Info.requiredDocumentation
        });
      }
    }

    // Annual physical/preventive care
    if (lowerTranscript.includes('annual') || lowerTranscript.includes('physical') || 
        lowerTranscript.includes('checkup') || lowerTranscript.includes('preventive')) {
      const icd10Info = this.knowledgeBase.icd10Codes.get("Z00.00");
      if (icd10Info) {
        suggestions.push({
          code: "Z00.00", 
          description: icd10Info.description,
          type: "icd10",
          confidence: 90,
          documentation_requirements: icd10Info.requiredDocumentation
        });
      }
    }

    return suggestions;
  }

  private suggestCPTCodes(encounter: any, transcript: string): any[] {
    const suggestions: any[] = [];

    // E/M codes based on encounter type and complexity
    if (encounter.encounterType === "Follow-up" || encounter.encounterType === "Office Visit") {
      const cptInfo = this.knowledgeBase.cptCodes.get("99213");
      if (cptInfo) {
        suggestions.push({
          code: "99213",
          description: cptInfo.description,
          type: "cpt",
          confidence: 80,
          documentation_requirements: cptInfo.documentationRequirements
        });
      }
    }

    if (encounter.encounterType === "Annual Physical" || encounter.encounterType === "Preventive") {
      const cptInfo = this.knowledgeBase.cptCodes.get("99395");
      if (cptInfo) {
        suggestions.push({
          code: "99395",
          description: cptInfo.description,
          type: "cpt", 
          confidence: 95,
          documentation_requirements: cptInfo.documentationRequirements
        });
      }
    }

    return suggestions;
  }

  private calculateRiskScore(flags: any[], encounter: any, transcript: string): number {
    let riskScore = 90; // Start with low risk

    // Subtract points for each flag based on severity
    for (const flag of flags) {
      switch (flag.severity) {
        case 'critical':
          riskScore -= 25;
          break;
        case 'high':
          riskScore -= 15;
          break;
        case 'medium':
          riskScore -= 10;
          break;
        case 'low':
          riskScore -= 5;
          break;
      }
    }

    // Additional risk factors
    if (!encounter.soapNotes || !encounter.soapNotes.assessment) {
      riskScore -= 20; // Missing assessment
    }

    if (!encounter.soapNotes || !encounter.soapNotes.plan) {
      riskScore -= 15; // Missing plan
    }

    if (transcript.length < 100) {
      riskScore -= 20; // Insufficient documentation
    }

    return Math.max(0, Math.min(100, riskScore));
  }

  // Get CMS guidelines for specific category
  public getCMSGuidelines(category?: string): CMSGuideline[] {
    if (category) {
      return this.knowledgeBase.cmsGuidelines.filter(g => g.category === category);
    }
    return this.knowledgeBase.cmsGuidelines;
  }

  // Get detailed information about an ICD-10 code
  public getICD10Info(code: string): ICD10CodeInfo | undefined {
    return this.knowledgeBase.icd10Codes.get(code);
  }

  // Get detailed information about a CPT code
  public getCPTInfo(code: string): CPTCodeInfo | undefined {
    return this.knowledgeBase.cptCodes.get(code);
  }
}

// Singleton instance
export const medicalKnowledge = new MedicalKnowledgeService();