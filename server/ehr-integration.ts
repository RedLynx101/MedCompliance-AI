import { SelectPatient, SelectEncounter } from '@shared/schema.js';

// HL7 FHIR R4 standards for EHR interoperability
export interface FHIRPatient {
  resourceType: 'Patient';
  id?: string;
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  name?: Array<{
    family: string;
    given: string[];
  }>;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  address?: Array<{
    line: string[];
    city: string;
    state: string;
    postalCode: string;
  }>;
  telecom?: Array<{
    system: 'phone' | 'email';
    value: string;
  }>;
}

export interface FHIREncounter {
  resourceType: 'Encounter';
  id?: string;
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled';
  class: {
    system: string;
    code: string;
    display: string;
  };
  subject: {
    reference: string;
  };
  period?: {
    start: string;
    end?: string;
  };
  reasonCode?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  location?: Array<{
    location: {
      reference: string;
    };
  }>;
}

export interface EHRSystemConfig {
  name: 'Epic' | 'Cerner' | 'Allscripts' | 'eClinicalWorks' | 'NextGen';
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string[];
  authUrl: string;
  tokenUrl: string;
  fhirVersion: 'R4' | 'STU3';
}

export interface EHRConnection {
  id: string;
  providerId: string;
  systemConfig: EHRSystemConfig;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  isActive: boolean;
  lastSync?: Date;
}

// Epic FHIR OAuth 2.0 implementation
export class EpicEHRService {
  private config: EHRSystemConfig;

  constructor(config: EHRSystemConfig) {
    this.config = config;
  }

  // Generate OAuth authorization URL for Epic
  generateAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      scope: this.config.scope.join(' '),
      state,
      aud: this.config.baseUrl
    });

    return `${this.config.authUrl}?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
  }> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      }).toString()
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Fetch patient data from Epic FHIR API
  async getPatient(patientId: string, accessToken: string): Promise<FHIRPatient> {
    const response = await fetch(`${this.config.baseUrl}/Patient/${patientId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/fhir+json',
        'Epic-Client-ID': this.config.clientId
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch patient: ${response.statusText}`);
    }

    return response.json();
  }

  // Create encounter in Epic
  async createEncounter(encounter: FHIREncounter, accessToken: string): Promise<FHIREncounter> {
    const response = await fetch(`${this.config.baseUrl}/Encounter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json',
        'Epic-Client-ID': this.config.clientId
      },
      body: JSON.stringify(encounter)
    });

    if (!response.ok) {
      throw new Error(`Failed to create encounter: ${response.statusText}`);
    }

    return response.json();
  }

  // Search encounters for a patient
  async searchEncounters(patientId: string, accessToken: string, params?: {
    status?: string;
    date?: string;
    class?: string;
  }): Promise<{ entry: Array<{ resource: FHIREncounter }> }> {
    const searchParams = new URLSearchParams({
      patient: patientId,
      ...params
    });

    const response = await fetch(`${this.config.baseUrl}/Encounter?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/fhir+json',
        'Epic-Client-ID': this.config.clientId
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to search encounters: ${response.statusText}`);
    }

    return response.json();
  }
}

// Cerner SMART on FHIR implementation
export class CernerEHRService {
  private config: EHRSystemConfig;

  constructor(config: EHRSystemConfig) {
    this.config = config;
  }

  // Generate OAuth authorization URL for Cerner
  generateAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      scope: this.config.scope.join(' '),
      state,
      launch: 'random-state' // Cerner requires launch parameter
    });

    return `${this.config.authUrl}?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    patient?: string;
  }> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      }).toString()
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Fetch patient data from Cerner FHIR API
  async getPatient(patientId: string, accessToken: string): Promise<FHIRPatient> {
    const response = await fetch(`${this.config.baseUrl}/Patient/${patientId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/fhir+json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch patient: ${response.statusText}`);
    }

    return response.json();
  }

  // Create encounter in Cerner
  async createEncounter(encounter: FHIREncounter, accessToken: string): Promise<FHIREncounter> {
    const response = await fetch(`${this.config.baseUrl}/Encounter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json'
      },
      body: JSON.stringify(encounter)
    });

    if (!response.ok) {
      throw new Error(`Failed to create encounter: ${response.statusText}`);
    }

    return response.json();
  }
}

// Universal EHR integration manager
export class EHRIntegrationManager {
  private connections: Map<string, EHRConnection> = new Map();

  // Register a new EHR connection
  registerConnection(connection: EHRConnection): void {
    this.connections.set(connection.id, connection);
  }

  // Get EHR service instance based on system type
  getEHRService(systemName: string, config: EHRSystemConfig): EpicEHRService | CernerEHRService {
    switch (systemName) {
      case 'Epic':
        return new EpicEHRService(config);
      case 'Cerner':
        return new CernerEHRService(config);
      default:
        throw new Error(`Unsupported EHR system: ${systemName}`);
    }
  }

  // Convert internal patient data to FHIR format
  convertPatientToFHIR(patient: SelectPatient): FHIRPatient {
    return {
      resourceType: 'Patient',
      id: patient.id,
      identifier: [{
        system: 'http://medcompliance.ai/patient-id',
        value: patient.id
      }, {
        system: 'http://hl7.org/fhir/sid/us-ssn',
        value: patient.medicalRecordNumber
      }],
      name: [{
        family: patient.lastName,
        given: [patient.firstName]
      }],
      birthDate: patient.dateOfBirth,
      gender: patient.gender?.toLowerCase() as 'male' | 'female' | undefined,
      telecom: patient.phone ? [{
        system: 'phone',
        value: patient.phone
      }] : undefined
    };
  }

  // Convert internal encounter data to FHIR format
  convertEncounterToFHIR(encounter: SelectEncounter, patientId: string): FHIREncounter {
    return {
      resourceType: 'Encounter',
      id: encounter.id,
      status: this.mapEncounterStatus(encounter.status),
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: encounter.encounterType || 'AMB',
        display: encounter.encounterType === 'inpatient' ? 'Inpatient' : 'Ambulatory'
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      period: {
        start: encounter.appointmentTime.toISOString(),
        end: encounter.endTime?.toISOString()
      },
      reasonCode: encounter.chiefComplaint ? [{
        coding: [{
          system: 'http://snomed.info/sct',
          code: '404684003',
          display: encounter.chiefComplaint
        }]
      }] : undefined
    };
  }

  // Map internal encounter status to FHIR status
  private mapEncounterStatus(status: string): FHIREncounter['status'] {
    switch (status) {
      case 'scheduled': return 'planned';
      case 'checked-in': return 'arrived';
      case 'in-progress': return 'in-progress';
      case 'completed': return 'finished';
      case 'cancelled': return 'cancelled';
      default: return 'planned';
    }
  }

  // Sync encounter data with connected EHR systems
  async syncEncounterWithEHR(
    encounterId: string, 
    encounter: SelectEncounter, 
    patient: SelectPatient,
    connectionId: string
  ): Promise<{ success: boolean; ehrEncounterId?: string; error?: string }> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection || !connection.isActive || !connection.accessToken) {
        throw new Error('EHR connection not available or inactive');
      }

      const ehrService = this.getEHRService(connection.systemConfig.name, connection.systemConfig);
      const fhirEncounter = this.convertEncounterToFHIR(encounter, patient.id);

      const result = await ehrService.createEncounter(fhirEncounter, connection.accessToken);
      
      return {
        success: true,
        ehrEncounterId: result.id
      };
    } catch (error) {
      console.error('Failed to sync encounter with EHR:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Import patient data from EHR
  async importPatientFromEHR(
    ehrPatientId: string, 
    connectionId: string
  ): Promise<{ success: boolean; patient?: FHIRPatient; error?: string }> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection || !connection.isActive || !connection.accessToken) {
        throw new Error('EHR connection not available or inactive');
      }

      const ehrService = this.getEHRService(connection.systemConfig.name, connection.systemConfig);
      const patient = await ehrService.getPatient(ehrPatientId, connection.accessToken);

      return {
        success: true,
        patient
      };
    } catch (error) {
      console.error('Failed to import patient from EHR:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Default EHR configurations for common systems
export const EHR_CONFIGS: Record<string, Partial<EHRSystemConfig>> = {
  Epic: {
    name: 'Epic',
    authUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
    tokenUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
    fhirVersion: 'R4',
    scope: ['patient/*.read', 'user/*.read', 'fhirUser', 'openid', 'profile']
  },
  Cerner: {
    name: 'Cerner',
    authUrl: 'https://authorization.cerner.com/tenants/{tenant-id}/protocols/oauth2/profiles/smart-v1/personas/provider/authorize',
    tokenUrl: 'https://authorization.cerner.com/tenants/{tenant-id}/protocols/oauth2/profiles/smart-v1/token',
    fhirVersion: 'R4',
    scope: ['patient/*.read', 'user/*.read', 'openid', 'profile', 'fhirUser']
  }
};