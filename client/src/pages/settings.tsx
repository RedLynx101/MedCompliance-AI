import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Save, User, Bell, Shield, Database, Mic, Brain, BarChart3, Palette, Globe, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    // Profile Settings
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah.chen@hospital.com",
    specialty: "Cardiology",
    licenseNumber: "CA-MD-12345",
    npiNumber: "1234567890",
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    complianceAlerts: true,
    riskAlerts: true,
    weeklyReports: true,
    
    // AI & Transcription Settings
    autoTranscription: true,
    transcriptionLanguage: "en-US",
    aiConfidenceThreshold: 0.8,
    autoSoapGeneration: true,
    voiceActivation: false,
    backgroundNoiseSuppression: true,
    
    // Security & Privacy
    sessionTimeout: 30,
    twoFactorAuth: true,
    dataRetention: 7,
    auditLogAccess: false,
    anonymousAnalytics: true,
    
    // Display & Interface
    theme: "light",
    fontSize: "medium",
    compactView: false,
    showTimestamps: true,
    autoRefresh: true,
    refreshInterval: 30,
    
    // Clinical Settings
    defaultEncounterType: "office-visit",
    documentationTemplate: "detailed",
    complianceLevel: "standard",
    codingSuggestions: true,
    
    // Analytics & Reporting
    analyticsSharing: true,
    performanceTracking: true,
    benchmarkComparisons: true,
    customDashboard: false
  });

  const handleSave = (section: string) => {
    toast({
      title: "Settings Saved",
      description: `${section} settings have been updated successfully.`,
    });
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Settings & Preferences</h1>
        <p className="text-muted-foreground">Customize your MedCompliance AI experience and system configuration</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6" data-testid="settings-tabs">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-8">
          <TabsTrigger value="profile" className="flex items-center gap-1" data-testid="tab-profile">
            <User size={16} />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1" data-testid="tab-notifications">
            <Bell size={16} />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1" data-testid="tab-ai">
            <Brain size={16} />
            <span className="hidden sm:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1" data-testid="tab-security">
            <Shield size={16} />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="interface" className="flex items-center gap-1" data-testid="tab-interface">
            <Palette size={16} />
            <span className="hidden sm:inline">Display</span>
          </TabsTrigger>
          <TabsTrigger value="clinical" className="flex items-center gap-1" data-testid="tab-clinical">
            <Database size={16} />
            <span className="hidden sm:inline">Clinical</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1 hidden lg:flex" data-testid="tab-analytics">
            <BarChart3 size={16} />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-1 hidden lg:flex" data-testid="tab-advanced">
            <Globe size={16} />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                Professional Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={settings.firstName}
                    onChange={(e) => handleSettingChange("firstName", e.target.value)}
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={settings.lastName}
                    onChange={(e) => handleSettingChange("lastName", e.target.value)}
                    data-testid="input-last-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleSettingChange("email", e.target.value)}
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Medical Specialty</Label>
                  <Input
                    id="specialty"
                    value={settings.specialty}
                    onChange={(e) => handleSettingChange("specialty", e.target.value)}
                    data-testid="input-specialty"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">Medical License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={settings.licenseNumber}
                    onChange={(e) => handleSettingChange("licenseNumber", e.target.value)}
                    data-testid="input-license"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="npiNumber">NPI Number</Label>
                  <Input
                    id="npiNumber"
                    value={settings.npiNumber}
                    onChange={(e) => handleSettingChange("npiNumber", e.target.value)}
                    data-testid="input-npi"
                  />
                </div>
              </div>
              <Button onClick={() => handleSave("Profile")} data-testid="button-save-profile">
                <Save size={16} className="mr-2" />
                Save Profile Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell size={20} />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive system updates and alerts via email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                    data-testid="switch-email-notifications"
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Critical alerts sent to your mobile device</p>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => handleSettingChange("smsNotifications", checked)}
                    data-testid="switch-sms-notifications"
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      Compliance Alerts <Badge variant="secondary">Recommended</Badge>
                    </Label>
                    <p className="text-sm text-muted-foreground">Real-time alerts for compliance issues</p>
                  </div>
                  <Switch
                    checked={settings.complianceAlerts}
                    onCheckedChange={(checked) => handleSettingChange("complianceAlerts", checked)}
                    data-testid="switch-compliance-alerts"
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Risk Alerts</Label>
                    <p className="text-sm text-muted-foreground">Notifications for high-risk patient encounters</p>
                  </div>
                  <Switch
                    checked={settings.riskAlerts}
                    onCheckedChange={(checked) => handleSettingChange("riskAlerts", checked)}
                    data-testid="switch-risk-alerts"
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">Summary of your documentation and compliance metrics</p>
                  </div>
                  <Switch
                    checked={settings.weeklyReports}
                    onCheckedChange={(checked) => handleSettingChange("weeklyReports", checked)}
                    data-testid="switch-weekly-reports"
                  />
                </div>
              </div>
              
              <Button onClick={() => handleSave("Notification")} data-testid="button-save-notifications">
                <Save size={16} className="mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI & Transcription Settings */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain size={20} />
                AI & Transcription Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Automatic Transcription</Label>
                    <p className="text-sm text-muted-foreground">Enable real-time speech-to-text during encounters</p>
                  </div>
                  <Switch
                    checked={settings.autoTranscription}
                    onCheckedChange={(checked) => handleSettingChange("autoTranscription", checked)}
                    data-testid="switch-auto-transcription"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Transcription Language</Label>
                  <Select value={settings.transcriptionLanguage} onValueChange={(value) => handleSettingChange("transcriptionLanguage", value)}>
                    <SelectTrigger data-testid="select-transcription-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="en-UK">English (UK)</SelectItem>
                      <SelectItem value="es-US">Spanish (US)</SelectItem>
                      <SelectItem value="fr-FR">French</SelectItem>
                      <SelectItem value="de-DE">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>AI Confidence Threshold: {(settings.aiConfidenceThreshold * 100).toFixed(0)}%</Label>
                  <input
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.05"
                    value={settings.aiConfidenceThreshold}
                    onChange={(e) => handleSettingChange("aiConfidenceThreshold", parseFloat(e.target.value))}
                    className="w-full"
                    data-testid="slider-ai-confidence"
                  />
                  <p className="text-sm text-muted-foreground">Minimum confidence level for AI suggestions</p>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto SOAP Generation</Label>
                    <p className="text-sm text-muted-foreground">Automatically generate SOAP notes from transcripts</p>
                  </div>
                  <Switch
                    checked={settings.autoSoapGeneration}
                    onCheckedChange={(checked) => handleSettingChange("autoSoapGeneration", checked)}
                    data-testid="switch-auto-soap"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Voice Activation</Label>
                    <p className="text-sm text-muted-foreground">Start recording with voice command</p>
                  </div>
                  <Switch
                    checked={settings.voiceActivation}
                    onCheckedChange={(checked) => handleSettingChange("voiceActivation", checked)}
                    data-testid="switch-voice-activation"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Background Noise Suppression</Label>
                    <p className="text-sm text-muted-foreground">Filter out ambient noise during recording</p>
                  </div>
                  <Switch
                    checked={settings.backgroundNoiseSuppression}
                    onCheckedChange={(checked) => handleSettingChange("backgroundNoiseSuppression", checked)}
                    data-testid="switch-noise-suppression"
                  />
                </div>
              </div>
              
              <Button onClick={() => handleSave("AI & Transcription")} data-testid="button-save-ai">
                <Save size={16} className="mr-2" />
                Save AI Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield size={20} />
                Security & Privacy Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 dark:bg-amber-950 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200">HIPAA Compliance Notice</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      All security settings are configured to maintain HIPAA compliance. Changes to these settings may affect data protection levels.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Select value={settings.sessionTimeout.toString()} onValueChange={(value) => handleSettingChange("sessionTimeout", parseInt(value))}>
                    <SelectTrigger data-testid="select-session-timeout">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      Two-Factor Authentication <Badge variant="secondary">Required</Badge>
                    </Label>
                    <p className="text-sm text-muted-foreground">Additional security layer for account access</p>
                  </div>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => handleSettingChange("twoFactorAuth", checked)}
                    data-testid="switch-2fa"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Data Retention Period (years)</Label>
                  <Select value={settings.dataRetention.toString()} onValueChange={(value) => handleSettingChange("dataRetention", parseInt(value))}>
                    <SelectTrigger data-testid="select-data-retention">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 years</SelectItem>
                      <SelectItem value="7">7 years (Recommended)</SelectItem>
                      <SelectItem value="10">10 years</SelectItem>
                      <SelectItem value="0">Indefinite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Audit Log Access</Label>
                    <p className="text-sm text-muted-foreground">View detailed system access logs</p>
                  </div>
                  <Switch
                    checked={settings.auditLogAccess}
                    onCheckedChange={(checked) => handleSettingChange("auditLogAccess", checked)}
                    data-testid="switch-audit-logs"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Anonymous Analytics</Label>
                    <p className="text-sm text-muted-foreground">Share anonymized usage data to improve the platform</p>
                  </div>
                  <Switch
                    checked={settings.anonymousAnalytics}
                    onCheckedChange={(checked) => handleSettingChange("anonymousAnalytics", checked)}
                    data-testid="switch-anonymous-analytics"
                  />
                </div>
              </div>
              
              <Button onClick={() => handleSave("Security")} data-testid="button-save-security">
                <Save size={16} className="mr-2" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interface Settings */}
        <TabsContent value="interface" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette size={20} />
                Display & Interface Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={settings.theme} onValueChange={(value) => handleSettingChange("theme", value)}>
                    <SelectTrigger data-testid="select-theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light Mode</SelectItem>
                      <SelectItem value="dark">Dark Mode</SelectItem>
                      <SelectItem value="system">System Default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <Select value={settings.fontSize} onValueChange={(value) => handleSettingChange("fontSize", value)}>
                    <SelectTrigger data-testid="select-font-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="xl">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Compact View</Label>
                    <p className="text-sm text-muted-foreground">Reduce spacing for more content on screen</p>
                  </div>
                  <Switch
                    checked={settings.compactView}
                    onCheckedChange={(checked) => handleSettingChange("compactView", checked)}
                    data-testid="switch-compact-view"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Show Timestamps</Label>
                    <p className="text-sm text-muted-foreground">Display creation and modification times</p>
                  </div>
                  <Switch
                    checked={settings.showTimestamps}
                    onCheckedChange={(checked) => handleSettingChange("showTimestamps", checked)}
                    data-testid="switch-timestamps"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto Refresh</Label>
                    <p className="text-sm text-muted-foreground">Automatically update data in real-time</p>
                  </div>
                  <Switch
                    checked={settings.autoRefresh}
                    onCheckedChange={(checked) => handleSettingChange("autoRefresh", checked)}
                    data-testid="switch-auto-refresh"
                  />
                </div>
                
                {settings.autoRefresh && (
                  <div className="space-y-2">
                    <Label>Refresh Interval (seconds)</Label>
                    <Select value={settings.refreshInterval.toString()} onValueChange={(value) => handleSettingChange("refreshInterval", parseInt(value))}>
                      <SelectTrigger data-testid="select-refresh-interval">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <Button onClick={() => handleSave("Interface")} data-testid="button-save-interface">
                <Save size={16} className="mr-2" />
                Save Interface Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clinical Settings */}
        <TabsContent value="clinical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database size={20} />
                Clinical Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Encounter Type</Label>
                  <Select value={settings.defaultEncounterType} onValueChange={(value) => handleSettingChange("defaultEncounterType", value)}>
                    <SelectTrigger data-testid="select-encounter-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office-visit">Office Visit</SelectItem>
                      <SelectItem value="telehealth">Telehealth</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="procedure">Procedure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Documentation Template</Label>
                  <Select value={settings.documentationTemplate} onValueChange={(value) => handleSettingChange("documentationTemplate", value)}>
                    <SelectTrigger data-testid="select-doc-template">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="specialty">Specialty-Specific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Compliance Level</Label>
                  <Select value={settings.complianceLevel} onValueChange={(value) => handleSettingChange("complianceLevel", value)}>
                    <SelectTrigger data-testid="select-compliance-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="enhanced">Enhanced</SelectItem>
                      <SelectItem value="maximum">Maximum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Coding Suggestions</Label>
                    <p className="text-sm text-muted-foreground">Auto-suggest ICD-10 and CPT codes</p>
                  </div>
                  <Switch
                    checked={settings.codingSuggestions}
                    onCheckedChange={(checked) => handleSettingChange("codingSuggestions", checked)}
                    data-testid="switch-coding-suggestions"
                  />
                </div>
              </div>
              
              <Button onClick={() => handleSave("Clinical")} data-testid="button-save-clinical">
                <Save size={16} className="mr-2" />
                Save Clinical Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Settings */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={20} />
                Analytics & Reporting Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Analytics Data Sharing</Label>
                    <p className="text-sm text-muted-foreground">Share anonymized data for platform improvements</p>
                  </div>
                  <Switch
                    checked={settings.analyticsSharing}
                    onCheckedChange={(checked) => handleSettingChange("analyticsSharing", checked)}
                    data-testid="switch-analytics-sharing"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Performance Tracking</Label>
                    <p className="text-sm text-muted-foreground">Track documentation efficiency and accuracy metrics</p>
                  </div>
                  <Switch
                    checked={settings.performanceTracking}
                    onCheckedChange={(checked) => handleSettingChange("performanceTracking", checked)}
                    data-testid="switch-performance-tracking"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Benchmark Comparisons</Label>
                    <p className="text-sm text-muted-foreground">Compare your metrics with specialty averages</p>
                  </div>
                  <Switch
                    checked={settings.benchmarkComparisons}
                    onCheckedChange={(checked) => handleSettingChange("benchmarkComparisons", checked)}
                    data-testid="switch-benchmark-comparisons"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Custom Dashboard</Label>
                    <p className="text-sm text-muted-foreground">Create personalized analytics views</p>
                  </div>
                  <Switch
                    checked={settings.customDashboard}
                    onCheckedChange={(checked) => handleSettingChange("customDashboard", checked)}
                    data-testid="switch-custom-dashboard"
                  />
                </div>
              </div>
              
              <Button onClick={() => handleSave("Analytics")} data-testid="button-save-analytics">
                <Save size={16} className="mr-2" />
                Save Analytics Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe size={20} />
                Advanced System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-950 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Advanced Settings Warning</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      These settings are for advanced users only. Incorrect configuration may affect system performance and compliance.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiEndpoint">Custom API Endpoint</Label>
                  <Input
                    id="apiEndpoint"
                    placeholder="https://api.example.com"
                    data-testid="input-api-endpoint"
                  />
                  <p className="text-sm text-muted-foreground">Override default API endpoint for custom integrations</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    placeholder="https://your-system.com/webhook"
                    data-testid="input-webhook-url"
                  />
                  <p className="text-sm text-muted-foreground">Receive real-time updates at your endpoint</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customFields">Custom Fields (JSON)</Label>
                  <Textarea
                    id="customFields"
                    placeholder='{"field1": "value1", "field2": "value2"}'
                    rows={4}
                    data-testid="textarea-custom-fields"
                  />
                  <p className="text-sm text-muted-foreground">Add custom metadata fields to encounters</p>
                </div>
              </div>
              
              <Button onClick={() => handleSave("Advanced")} variant="outline" data-testid="button-save-advanced">
                <Save size={16} className="mr-2" />
                Save Advanced Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}