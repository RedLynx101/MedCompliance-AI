import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Request } from 'express';
import { getStorage } from './storage.js';

// HIPAA compliance framework for medical data security
export interface HIPAASecurityControls {
  encryption: EncryptionService;
  audit: AuditService;
  access: AccessControlService;
  session: SessionSecurityService;
}

// Data encryption service for PHI protection
export class EncryptionService {
  private encryptionKey: string;
  private algorithm = 'aes-256-gcm';

  constructor() {
    // In production, use secure key management (HSM, Key Vault, etc.)
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateKey();
  }

  private generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Encrypt sensitive PHI data at rest
  encryptPHI(data: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
    cipher.setAAD(Buffer.from('PHI-DATA'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // Decrypt PHI data
  decryptPHI(encryptedData: { encrypted: string; iv: string; authTag: string }): string {
    const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
    decipher.setAAD(Buffer.from('PHI-DATA'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Hash passwords securely
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12; // NIST recommended minimum
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password against hash
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate secure session tokens
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Audit logging service for HIPAA compliance
export class AuditService {
  private logQueue: AuditLogEntry[] = [];

  async logAccess(entry: AuditLogEntry): Promise<void> {
    // Add timestamp and ensure all required fields
    const auditEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date(),
      id: crypto.randomUUID()
    };

    this.logQueue.push(auditEntry);
    
    // In production, write to secure, immutable audit storage
    console.log('[AUDIT]', JSON.stringify(auditEntry));
    
    // Process queue if it gets large
    if (this.logQueue.length > 100) {
      await this.flushAuditLogs();
    }
  }

  private async flushAuditLogs(): Promise<void> {
    // In production, write to secure database/log system
    const storage = await getStorage();
    
    for (const entry of this.logQueue) {
      // Store audit logs in secure, append-only format
      await this.writeAuditEntry(entry);
    }
    
    this.logQueue = [];
  }

  private async writeAuditEntry(entry: AuditLogEntry): Promise<void> {
    // In production, implement secure audit log storage
    // This should be append-only, tamper-proof, and regularly backed up
    console.log('[AUDIT-SECURE]', JSON.stringify(entry));
  }

  // Required HIPAA audit events
  async logPHIAccess(userId: string, patientId: string, action: string, details?: any): Promise<void> {
    await this.logAccess({
      id: crypto.randomUUID(),
      userId,
      patientId,
      action,
      eventType: 'PHI_ACCESS',
      ipAddress: details?.ipAddress,
      userAgent: details?.userAgent,
      details: details?.additional,
      timestamp: new Date()
    });
  }

  async logAuthEvent(userId: string, event: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN', details?: any): Promise<void> {
    await this.logAccess({
      id: crypto.randomUUID(),
      userId,
      action: event,
      eventType: 'AUTHENTICATION',
      ipAddress: details?.ipAddress,
      userAgent: details?.userAgent,
      details,
      timestamp: new Date()
    });
  }

  async logDataModification(userId: string, resourceType: string, resourceId: string, action: string, details?: any): Promise<void> {
    await this.logAccess({
      id: crypto.randomUUID(),
      userId,
      action,
      eventType: 'DATA_MODIFICATION',
      resourceType,
      resourceId,
      ipAddress: details?.ipAddress,
      userAgent: details?.userAgent,
      details,
      timestamp: new Date()
    });
  }
}

// Access control service for role-based security
export class AccessControlService {
  private userRoles: Map<string, UserRole[]> = new Map();

  // Define HIPAA-compliant user roles
  private rolePermissions: Record<UserRole, Permission[]> = {
    'PHYSICIAN': ['READ_PHI', 'WRITE_PHI', 'CREATE_ENCOUNTER', 'VIEW_ALL_PATIENTS'],
    'NURSE': ['READ_PHI', 'WRITE_PHI', 'CREATE_ENCOUNTER', 'VIEW_ASSIGNED_PATIENTS'],
    'ADMIN': ['READ_PHI', 'WRITE_PHI', 'USER_MANAGEMENT', 'SYSTEM_CONFIG', 'AUDIT_ACCESS'],
    'AUDITOR': ['AUDIT_ACCESS', 'READ_LOGS'],
    'VIEWER': ['READ_LIMITED_PHI']
  };

  setUserRoles(userId: string, roles: UserRole[]): void {
    this.userRoles.set(userId, roles);
  }

  getUserRoles(userId: string): UserRole[] {
    return this.userRoles.get(userId) || [];
  }

  // Check if user has specific permission
  hasPermission(userId: string, permission: Permission): boolean {
    const userRoles = this.getUserRoles(userId);
    
    return userRoles.some(role => 
      this.rolePermissions[role]?.includes(permission)
    );
  }

  // Check if user can access specific patient data
  canAccessPatient(userId: string, patientId: string): boolean {
    const userRoles = this.getUserRoles(userId);
    
    // Physicians and admins can access all patients
    if (userRoles.includes('PHYSICIAN') || userRoles.includes('ADMIN')) {
      return true;
    }
    
    // Nurses can access assigned patients (implement assignment logic)
    if (userRoles.includes('NURSE')) {
      return this.isPatientAssigned(userId, patientId);
    }
    
    return false;
  }

  private isPatientAssigned(userId: string, patientId: string): boolean {
    // In production, implement actual patient assignment logic
    // This could check care teams, assigned cases, etc.
    return true; // Placeholder
  }

  // Minimum necessary rule enforcement
  getAuthorizedFields(userId: string, resourceType: string): string[] {
    const userRoles = this.getUserRoles(userId);
    
    if (resourceType === 'patient') {
      if (userRoles.includes('PHYSICIAN') || userRoles.includes('ADMIN')) {
        return ['*']; // All fields
      } else if (userRoles.includes('NURSE')) {
        return ['firstName', 'lastName', 'medicalRecordNumber', 'dateOfBirth', 'phone'];
      } else if (userRoles.includes('VIEWER')) {
        return ['firstName', 'lastName', 'medicalRecordNumber'];
      }
    }
    
    return [];
  }
}

// Session security service
export class SessionSecurityService {
  private sessionStore: Map<string, SessionData> = new Map();
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private maxConcurrentSessions = 3;

  createSession(userId: string, ipAddress: string, userAgent: string): string {
    const sessionId = crypto.randomBytes(32).toString('hex');
    
    // Enforce session limits
    this.cleanupExpiredSessions();
    this.enforceSessionLimits(userId);
    
    const sessionData: SessionData = {
      userId,
      sessionId,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress,
      userAgent,
      isActive: true
    };
    
    this.sessionStore.set(sessionId, sessionData);
    
    return sessionId;
  }

  validateSession(sessionId: string): SessionData | null {
    const session = this.sessionStore.get(sessionId);
    
    if (!session || !session.isActive) {
      return null;
    }
    
    // Check for timeout
    const now = Date.now();
    const lastActivity = session.lastActivity.getTime();
    
    if (now - lastActivity > this.sessionTimeout) {
      this.destroySession(sessionId);
      return null;
    }
    
    // Update last activity
    session.lastActivity = new Date();
    this.sessionStore.set(sessionId, session);
    
    return session;
  }

  destroySession(sessionId: string): void {
    const session = this.sessionStore.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessionStore.delete(sessionId);
    }
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    
    for (const [sessionId, session] of this.sessionStore.entries()) {
      const lastActivity = session.lastActivity.getTime();
      
      if (now - lastActivity > this.sessionTimeout) {
        this.destroySession(sessionId);
      }
    }
  }

  private enforceSessionLimits(userId: string): void {
    const userSessions = Array.from(this.sessionStore.values())
      .filter(session => session.userId === userId && session.isActive)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    
    // Keep only the most recent sessions
    if (userSessions.length >= this.maxConcurrentSessions) {
      const sessionsToRemove = userSessions.slice(this.maxConcurrentSessions - 1);
      sessionsToRemove.forEach(session => {
        this.destroySession(session.sessionId);
      });
    }
  }
}

// Type definitions for HIPAA compliance
export interface AuditLogEntry {
  id: string;
  userId: string;
  patientId?: string;
  action: string;
  eventType: 'PHI_ACCESS' | 'AUTHENTICATION' | 'DATA_MODIFICATION' | 'SYSTEM_ACCESS';
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  timestamp: Date;
}

export interface SessionData {
  userId: string;
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export type UserRole = 'PHYSICIAN' | 'NURSE' | 'ADMIN' | 'AUDITOR' | 'VIEWER';

export type Permission = 
  | 'READ_PHI' 
  | 'WRITE_PHI' 
  | 'CREATE_ENCOUNTER' 
  | 'VIEW_ALL_PATIENTS' 
  | 'VIEW_ASSIGNED_PATIENTS'
  | 'USER_MANAGEMENT' 
  | 'SYSTEM_CONFIG' 
  | 'AUDIT_ACCESS' 
  | 'READ_LOGS'
  | 'READ_LIMITED_PHI';

// Middleware for request authentication and authorization
export function createHIPAAMiddleware(securityControls: HIPAASecurityControls) {
  return {
    // Authentication middleware
    authenticate: async (req: Request & { user?: any; session?: SessionData }, res: any, next: any) => {
      try {
        const sessionId = req.headers.authorization?.replace('Bearer ', '') || 
                         req.cookies?.sessionId;
        
        if (!sessionId) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const session = securityControls.session.validateSession(sessionId);
        
        if (!session) {
          await securityControls.audit.logAuthEvent('unknown', 'FAILED_LOGIN', {
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            reason: 'Invalid session'
          });
          
          return res.status(401).json({ error: 'Invalid or expired session' });
        }

        // Attach user and session to request
        req.user = { id: session.userId };
        req.session = session;
        
        next();
      } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
      }
    },

    // Authorization middleware
    authorize: (requiredPermission: Permission) => {
      return async (req: Request & { user?: any; session?: SessionData }, res: any, next: any) => {
        try {
          if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
          }

          const hasPermission = securityControls.access.hasPermission(
            req.user.id, 
            requiredPermission
          );

          if (!hasPermission) {
            await securityControls.audit.logAccess({
              id: crypto.randomUUID(),
              userId: req.user.id,
              action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
              eventType: 'SYSTEM_ACCESS',
              details: { requiredPermission, endpoint: req.path },
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
              timestamp: new Date()
            });

            return res.status(403).json({ error: 'Insufficient permissions' });
          }

          next();
        } catch (error) {
          console.error('Authorization error:', error);
          res.status(500).json({ error: 'Authorization failed' });
        }
      };
    },

    // PHI access logging middleware
    logPHIAccess: (resourceType: string) => {
      return async (req: Request & { user?: any; session?: SessionData }, res: any, next: any) => {
        try {
          if (req.user) {
            await securityControls.audit.logPHIAccess(
              req.user.id,
              req.params.patientId || req.params.id || 'unknown',
              `${req.method} ${req.path}`,
              {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                additional: { resourceType, params: req.params }
              }
            );
          }
          next();
        } catch (error) {
          console.error('PHI access logging error:', error);
          next(); // Don't block request for logging errors
        }
      };
    }
  };
}

// Initialize HIPAA compliance services
export function initializeHIPAACompliance(): HIPAASecurityControls {
  const encryption = new EncryptionService();
  const audit = new AuditService();
  const access = new AccessControlService();
  const session = new SessionSecurityService();

  // Set up default admin user (in production, use proper user management)
  access.setUserRoles('default-user', ['PHYSICIAN']);

  return {
    encryption,
    audit,
    access,
    session
  };
}