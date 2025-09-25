import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface SOAPNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface ComplianceCheck {
  flags: Array<{
    type: string;
    severity: "info" | "warning" | "error";
    message: string;
    explanation: string;
  }>;
  suggestions: Array<{
    code: string;
    description: string;
    type: "icd10" | "cpt";
    confidence: number;
  }>;
  riskScore: number;
}

export async function generateSOAPNotes(transcript: string): Promise<SOAPNotes> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a medical documentation AI assistant. Generate comprehensive SOAP notes from the provided encounter transcript. Format the response as JSON with the following structure:
          {
            "subjective": "Patient's reported symptoms and history",
            "objective": "Physical examination findings and vital signs",
            "assessment": "Clinical assessment and diagnoses", 
            "plan": "Treatment plan and follow-up"
          }
          
          Ensure all sections are detailed and clinically appropriate. If information is missing for any section, note what should be added. Return ONLY valid JSON.`
        },
        {
          role: "user",
          content: `Generate SOAP notes from this encounter transcript:\n\n${transcript}`
        }
      ],
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      subjective: result.subjective || "",
      objective: result.objective || "",
      assessment: result.assessment || "",
      plan: result.plan || ""
    };
  } catch (error) {
    console.error("Error generating SOAP notes:", error);
    throw new Error("Failed to generate SOAP notes");
  }
}

export async function checkCompliance(soapNotes: SOAPNotes, transcript: string): Promise<ComplianceCheck> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a medical compliance expert AI. Analyze the provided SOAP notes and transcript for compliance issues, missing documentation, and billing/coding opportunities. Respond with JSON in this format:
          {
            "flags": [
              {
                "type": "missing_physical_exam",
                "severity": "warning",
                "message": "Missing physical examination findings",
                "explanation": "Physical examination documentation is required for proper billing and medical necessity"
              }
            ],
            "suggestions": [
              {
                "code": "M54.5",
                "description": "Low back pain",
                "type": "icd10",
                "confidence": 95
              }
            ],
            "riskScore": 72
          }
          
          Focus on CMS requirements, ICD-10/CPT coding accuracy, and documentation completeness. Risk score should be 0-100 where 0 is highest risk. Return ONLY valid JSON.`
        },
        {
          role: "user",
          content: `Check compliance for these SOAP notes and transcript:
          
          SOAP Notes:
          Subjective: ${soapNotes.subjective}
          Objective: ${soapNotes.objective}
          Assessment: ${soapNotes.assessment}
          Plan: ${soapNotes.plan}
          
          Original Transcript:
          ${transcript}`
        }
      ],
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      flags: result.flags || [],
      suggestions: result.suggestions || [],
      riskScore: Math.max(0, Math.min(100, result.riskScore || 50))
    };
  } catch (error) {
    console.error("Error checking compliance:", error);
    throw new Error("Failed to check compliance");
  }
}

export async function enhanceDocumentation(currentText: string, context: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a medical documentation assistant. Enhance the provided text with medically appropriate language while maintaining accuracy. Only add clinically relevant details that support proper documentation and billing compliance."
        },
        {
          role: "user",
          content: `Enhance this medical documentation text while keeping it accurate and appropriate:

          Current text: ${currentText}
          
          Context: ${context}
          
          Return only the enhanced text without additional formatting.`
        }
      ],
    });

    return response.choices[0].message.content || currentText;
  } catch (error) {
    console.error("Error enhancing documentation:", error);
    return currentText;
  }
}
