import { getStorage } from './storage.js';
import { SelectEncounter, SelectPatient, SelectComplianceFlag } from '@shared/schema.js';

// Advanced analytics engine for predictive claim denial risk modeling
export class AdvancedAnalyticsEngine {
  
  // Calculate claim denial risk based on multiple factors
  async calculateClaimDenialRisk(encounterId: string): Promise<RiskAssessment> {
    const storage = await getStorage();
    const encounter = await storage.getEncounter(encounterId);
    
    if (!encounter) {
      throw new Error('Encounter not found');
    }

    const patient = await storage.getPatient(encounter.patientId);
    const complianceFlags = await storage.getComplianceFlags(encounterId);
    
    // Multi-factor risk assessment
    const documentationRisk = this.assessDocumentationQuality(encounter, complianceFlags);
    const codingRisk = this.assessCodingAccuracy(encounter);
    const complianceRisk = this.assessComplianceScore(complianceFlags);
    const historicalRisk = await this.assessHistoricalPatterns(patient, encounter);
    
    // Weighted risk calculation
    const overallRisk = this.calculateWeightedRisk({
      documentation: documentationRisk,
      coding: codingRisk,
      compliance: complianceRisk,
      historical: historicalRisk
    });

    const riskLevel = this.categorizeRisk(overallRisk);
    const recommendations = this.generateRecommendations(overallRisk, {
      documentationRisk,
      codingRisk,
      complianceRisk,
      historicalRisk
    });

    return {
      encounterId,
      overallRiskScore: overallRisk,
      riskLevel,
      riskFactors: {
        documentation: documentationRisk,
        coding: codingRisk,
        compliance: complianceRisk,
        historical: historicalRisk
      },
      recommendations,
      lastUpdated: new Date()
    };
  }

  // Assess documentation quality based on completeness and accuracy
  private assessDocumentationQuality(encounter: SelectEncounter, flags: any[]): RiskFactor {
    let score = 0;
    const issues: string[] = [];

    // SOAP notes completeness
    if (!encounter.soapNotes || encounter.soapNotes.length < 100) {
      score += 25;
      issues.push('Insufficient SOAP notes documentation');
    }

    // Check for critical compliance flags
    const criticalFlags = flags.filter(f => f.severity === 'high' && !f.isResolved);
    score += criticalFlags.length * 15;
    
    if (criticalFlags.length > 0) {
      issues.push(`${criticalFlags.length} unresolved critical compliance issues`);
    }

    // Missing key elements
    if (!encounter.chiefComplaint) {
      score += 20;
      issues.push('Missing chief complaint');
    }

    // Documentation timing
    const encounterDate = new Date(encounter.appointmentTime);
    const now = new Date();
    const daysSinceEncounter = (now.getTime() - encounterDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceEncounter > 30 && encounter.status !== 'completed') {
      score += 30;
      issues.push('Documentation delayed beyond 30 days');
    }

    return {
      score: Math.min(score, 100),
      severity: score > 70 ? 'high' : score > 40 ? 'medium' : 'low',
      issues,
      category: 'Documentation Quality'
    };
  }

  // Assess coding accuracy and medical necessity
  private assessCodingAccuracy(encounter: SelectEncounter): RiskFactor {
    let score = 0;
    const issues: string[] = [];

    // ICD-10 code presence and validity
    const icdCodes = encounter.icdCodes || [];
    if (icdCodes.length === 0) {
      score += 40;
      issues.push('No ICD-10 codes assigned');
    } else {
      // Check for common problematic patterns
      const hasUnspecifiedCodes = icdCodes.some(code => 
        code.includes('.9') || code.includes('unspecified')
      );
      
      if (hasUnspecifiedCodes) {
        score += 20;
        issues.push('Contains unspecified diagnosis codes');
      }
    }

    // CPT code presence and E/M level validation
    const cptCodes = encounter.cptCodes || [];
    if (cptCodes.length === 0) {
      score += 35;
      issues.push('No CPT codes assigned');
    } else {
      // Check for high-level E/M codes without supporting documentation
      const highLevelEM = cptCodes.some(code => 
        ['99214', '99215', '99204', '99205'].includes(code)
      );
      
      if (highLevelEM && (!encounter.soapNotes || encounter.soapNotes.length < 200)) {
        score += 30;
        issues.push('High-level E/M code may lack supporting documentation');
      }
    }

    // Medical necessity alignment
    if (icdCodes.length > 0 && cptCodes.length > 0) {
      // In production, implement proper medical necessity validation
      // For now, flag potential mismatches
      const hasPreventiveVisit = cptCodes.some(code => 
        ['99381', '99382', '99383', '99384', '99385', '99386', '99387'].includes(code)
      );
      
      const hasProblemDiagnosis = icdCodes.some(code => !code.startsWith('Z'));
      
      if (hasPreventiveVisit && hasProblemDiagnosis) {
        score += 25;
        issues.push('Preventive visit with problem diagnosis may require modifier');
      }
    }

    return {
      score: Math.min(score, 100),
      severity: score > 70 ? 'high' : score > 40 ? 'medium' : 'low',
      issues,
      category: 'Coding Accuracy'
    };
  }

  // Assess overall compliance score
  private assessComplianceScore(flags: any[]): RiskFactor {
    const totalFlags = flags.length;
    const unresolvedFlags = flags.filter(f => !f.isResolved).length;
    const highSeverityFlags = flags.filter(f => f.severity === 'high').length;
    
    let score = 0;
    const issues: string[] = [];

    if (totalFlags === 0) {
      return {
        score: 0,
        severity: 'low',
        issues: [],
        category: 'Compliance'
      };
    }

    // Base score on unresolved flags
    score += (unresolvedFlags / totalFlags) * 50;
    
    // Additional penalty for high severity
    score += highSeverityFlags * 10;

    if (unresolvedFlags > 0) {
      issues.push(`${unresolvedFlags} unresolved compliance flags`);
    }

    if (highSeverityFlags > 0) {
      issues.push(`${highSeverityFlags} high-severity compliance issues`);
    }

    // Pattern analysis
    const flagTypes = flags.map(f => f.flagType);
    const uniqueTypes = new Set(flagTypes);
    
    if (uniqueTypes.size < flagTypes.length / 2) {
      score += 15;
      issues.push('Recurring compliance issues detected');
    }

    return {
      score: Math.min(score, 100),
      severity: score > 70 ? 'high' : score > 40 ? 'medium' : 'low',
      issues,
      category: 'Compliance'
    };
  }

  // Assess historical patterns for patient and provider
  private async assessHistoricalPatterns(patient: SelectPatient | null, encounter: SelectEncounter): Promise<RiskFactor> {
    if (!patient) {
      return {
        score: 10,
        severity: 'low',
        issues: ['Patient data unavailable for historical analysis'],
        category: 'Historical Patterns'
      };
    }

    const storage = await getStorage();
    
    try {
      // Get patient's encounter history
      const allEncounters = await storage.getEncounters();
      const patientEncounters = allEncounters.filter(e => 
        e.patientId === patient.id && e.id !== encounter.id
      );

      let score = 0;
      const issues: string[] = [];

      // Historical claim denial patterns
      const highRiskEncounters = patientEncounters.filter(e => 
        (e.claimRiskScore || 0) > 70
      );

      if (highRiskEncounters.length > 0) {
        const riskRate = highRiskEncounters.length / patientEncounters.length;
        score += riskRate * 40;
        issues.push(`${Math.round(riskRate * 100)}% of historical encounters had high claim risk`);
      }

      // Frequency of encounters (potential over-utilization)
      const recentEncounters = patientEncounters.filter(e => {
        const encounterDate = new Date(e.appointmentTime);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return encounterDate > sixMonthsAgo;
      });

      if (recentEncounters.length > 10) {
        score += 20;
        issues.push('High frequency of recent encounters may indicate over-utilization');
      }

      // Complex medical history indicators
      const allDiagnoses = patientEncounters
        .flatMap(e => e.icdCodes || [])
        .filter(code => code);

      const uniqueDiagnoses = new Set(allDiagnoses);
      
      if (uniqueDiagnoses.size > 15) {
        score += 15;
        issues.push('Complex medical history with multiple diagnoses');
      }

      // Chronic conditions that may affect documentation requirements
      const chronicConditions = ['E11', 'I10', 'M79', 'F32', 'G93'];
      const hasChronicConditions = Array.from(uniqueDiagnoses).some(code =>
        chronicConditions.some(chronic => code.startsWith(chronic))
      );

      if (hasChronicConditions) {
        // Chronic conditions require more documentation but aren't necessarily high risk
        score += 5;
        issues.push('Patient has chronic conditions requiring enhanced documentation');
      }

      return {
        score: Math.min(score, 100),
        severity: score > 70 ? 'high' : score > 40 ? 'medium' : 'low',
        issues,
        category: 'Historical Patterns'
      };

    } catch (error) {
      console.error('Error in historical pattern analysis:', error);
      return {
        score: 20,
        severity: 'medium',
        issues: ['Unable to complete historical analysis'],
        category: 'Historical Patterns'
      };
    }
  }

  // Calculate weighted overall risk score
  private calculateWeightedRisk(factors: {
    documentation: RiskFactor;
    coding: RiskFactor;
    compliance: RiskFactor;
    historical: RiskFactor;
  }): number {
    // Risk factor weights based on claim denial impact
    const weights = {
      documentation: 0.35,  // Most important for claim approval
      coding: 0.30,         // Critical for proper reimbursement
      compliance: 0.25,     // Important for avoiding denials
      historical: 0.10      // Provides context but less direct impact
    };

    return Math.round(
      factors.documentation.score * weights.documentation +
      factors.coding.score * weights.coding +
      factors.compliance.score * weights.compliance +
      factors.historical.score * weights.historical
    );
  }

  // Categorize risk level
  private categorizeRisk(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  // Generate actionable recommendations
  private generateRecommendations(overallRisk: number, factors: {
    documentationRisk: RiskFactor;
    codingRisk: RiskFactor;
    complianceRisk: RiskFactor;
    historicalRisk: RiskFactor;
  }): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Documentation recommendations
    if (factors.documentationRisk.score > 40) {
      recommendations.push({
        category: 'Documentation',
        priority: factors.documentationRisk.severity,
        title: 'Enhance Clinical Documentation',
        description: 'Improve SOAP notes completeness and resolve compliance flags',
        actions: [
          'Complete detailed SOAP notes with all required elements',
          'Address all unresolved compliance flags',
          'Ensure chief complaint is properly documented',
          'Complete documentation within 24 hours of encounter'
        ],
        estimatedImpact: 'Reduces claim denial risk by 20-35%'
      });
    }

    // Coding recommendations
    if (factors.codingRisk.score > 40) {
      recommendations.push({
        category: 'Medical Coding',
        priority: factors.codingRisk.severity,
        title: 'Improve Coding Accuracy',
        description: 'Ensure proper ICD-10 and CPT code assignment with medical necessity',
        actions: [
          'Assign specific ICD-10 codes instead of unspecified codes',
          'Ensure CPT codes match the level of service documented',
          'Verify medical necessity between diagnoses and procedures',
          'Add appropriate modifiers for preventive visits with problems'
        ],
        estimatedImpact: 'Reduces claim denial risk by 15-30%'
      });
    }

    // Compliance recommendations
    if (factors.complianceRisk.score > 30) {
      recommendations.push({
        category: 'Compliance',
        priority: factors.complianceRisk.severity,
        title: 'Address Compliance Issues',
        description: 'Resolve outstanding compliance flags to meet regulatory requirements',
        actions: [
          'Review and address all high-severity compliance flags',
          'Implement systematic compliance checking processes',
          'Provide additional training on recurring compliance issues',
          'Establish regular compliance audits'
        ],
        estimatedImpact: 'Reduces claim denial risk by 10-25%'
      });
    }

    // Overall risk mitigation
    if (overallRisk > 70) {
      recommendations.push({
        category: 'Risk Mitigation',
        priority: 'high',
        title: 'Immediate Risk Reduction Required',
        description: 'This encounter has critical claim denial risk requiring immediate attention',
        actions: [
          'Conduct thorough review before claim submission',
          'Consider peer review or supervisor consultation',
          'Implement all high-priority recommendations immediately',
          'Monitor encounter closely through claims process'
        ],
        estimatedImpact: 'Comprehensive risk reduction approach'
      });
    }

    return recommendations;
  }

  // Generate analytics dashboard data
  async generateAnalyticsDashboard(): Promise<AnalyticsDashboard> {
    const storage = await getStorage();
    const encounters = await storage.getEncounters();
    const patients = await storage.getPatients();

    // Calculate aggregate metrics
    const totalEncounters = encounters.length;
    const completedEncounters = encounters.filter(e => e.status === 'completed');
    const highRiskEncounters = encounters.filter(e => (e.claimRiskScore || 0) > 70);
    
    const avgRiskScore = encounters.reduce((sum, e) => sum + (e.claimRiskScore || 0), 0) / totalEncounters;
    
    // Risk distribution
    const riskDistribution = {
      low: encounters.filter(e => (e.claimRiskScore || 0) < 30).length,
      medium: encounters.filter(e => (e.claimRiskScore || 0) >= 30 && (e.claimRiskScore || 0) < 60).length,
      high: encounters.filter(e => (e.claimRiskScore || 0) >= 60 && (e.claimRiskScore || 0) < 80).length,
      critical: encounters.filter(e => (e.claimRiskScore || 0) >= 80).length
    };

    // Trend analysis (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEncounters = encounters.filter(e => 
      new Date(e.appointmentTime) > thirtyDaysAgo
    );

    const trends = {
      encounterVolume: recentEncounters.length,
      avgRiskTrend: recentEncounters.length > 0 
        ? recentEncounters.reduce((sum, e) => sum + (e.claimRiskScore || 0), 0) / recentEncounters.length
        : 0,
      complianceRate: recentEncounters.length > 0
        ? (recentEncounters.filter(e => (e.claimRiskScore || 0) < 30).length / recentEncounters.length) * 100
        : 100
    };

    // Top risk factors analysis
    const allFlags = await Promise.all(
      encounters.map(async e => {
        try {
          return await storage.getComplianceFlags(e.id);
        } catch {
          return [];
        }
      })
    );

    const flagTypes = allFlags.flat().map(f => f.flagType);
    const flagCounts = flagTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topRiskFactors = Object.entries(flagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    return {
      summary: {
        totalEncounters,
        completedEncounters: completedEncounters.length,
        highRiskEncounters: highRiskEncounters.length,
        avgRiskScore: Math.round(avgRiskScore),
        totalPatients: patients.length
      },
      riskDistribution,
      trends,
      topRiskFactors,
      recommendations: this.generateSystemWideRecommendations({
        avgRiskScore,
        highRiskRate: (highRiskEncounters.length / totalEncounters) * 100,
        topRiskFactors
      }),
      lastUpdated: new Date()
    };
  }

  // Generate system-wide recommendations
  private generateSystemWideRecommendations(metrics: {
    avgRiskScore: number;
    highRiskRate: number;
    topRiskFactors: Array<{ type: string; count: number }>;
  }): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (metrics.avgRiskScore > 50) {
      recommendations.push({
        category: 'System Performance',
        priority: 'high',
        title: 'Improve Overall Documentation Quality',
        description: `Average risk score of ${Math.round(metrics.avgRiskScore)} indicates system-wide documentation improvements needed`,
        actions: [
          'Implement mandatory documentation training',
          'Establish documentation quality metrics',
          'Increase use of AI-powered compliance checking',
          'Regular peer review of high-risk encounters'
        ],
        estimatedImpact: 'Could reduce average risk score by 15-25%'
      });
    }

    if (metrics.highRiskRate > 25) {
      recommendations.push({
        category: 'Risk Management',
        priority: 'high',
        title: 'Address High-Risk Encounter Rate',
        description: `${Math.round(metrics.highRiskRate)}% of encounters are high-risk, above acceptable threshold`,
        actions: [
          'Implement pre-submission review for high-risk encounters',
          'Enhance real-time compliance monitoring',
          'Provide targeted training on common risk factors',
          'Consider automated risk scoring alerts'
        ],
        estimatedImpact: 'Target to reduce high-risk rate below 15%'
      });
    }

    if (metrics.topRiskFactors.length > 0) {
      const topFactor = metrics.topRiskFactors[0];
      recommendations.push({
        category: 'Compliance Focus',
        priority: 'medium',
        title: `Address Common Risk Factor: ${topFactor.type}`,
        description: `${topFactor.type} appears in ${topFactor.count} encounters, indicating systematic issue`,
        actions: [
          `Develop specific training module for ${topFactor.type}`,
          'Create automated checks for this common issue',
          'Review and update documentation templates',
          'Implement targeted quality assurance measures'
        ],
        estimatedImpact: `Could prevent ${topFactor.count} future compliance issues`
      });
    }

    return recommendations;
  }
}

// Type definitions for analytics
export interface RiskAssessment {
  encounterId: string;
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: {
    documentation: RiskFactor;
    coding: RiskFactor;
    compliance: RiskFactor;
    historical: RiskFactor;
  };
  recommendations: Recommendation[];
  lastUpdated: Date;
}

export interface RiskFactor {
  score: number;
  severity: 'low' | 'medium' | 'high';
  issues: string[];
  category: string;
}

export interface Recommendation {
  category: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actions: string[];
  estimatedImpact: string;
}

export interface AnalyticsDashboard {
  summary: {
    totalEncounters: number;
    completedEncounters: number;
    highRiskEncounters: number;
    avgRiskScore: number;
    totalPatients: number;
  };
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  trends: {
    encounterVolume: number;
    avgRiskTrend: number;
    complianceRate: number;
  };
  topRiskFactors: Array<{
    type: string;
    count: number;
  }>;
  recommendations: Recommendation[];
  lastUpdated: Date;
}

// Export singleton instance
export const analyticsEngine = new AdvancedAnalyticsEngine();