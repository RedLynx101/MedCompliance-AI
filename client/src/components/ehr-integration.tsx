import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Activity, Database, Link, CheckCircle, AlertCircle, Settings } from 'lucide-react';

interface EHRSystem {
  name: string;
  displayName: string;
  isSupported: boolean;
  description: string;
}

interface EHRConnection {
  connectionId: string;
  systemName: string;
  expiresAt: string;
  isActive: boolean;
  message: string;
}

export function EHRIntegration() {
  const [selectedSystem, setSelectedSystem] = useState<string>('');
  const [connectionConfig, setConnectionConfig] = useState({
    baseUrl: '',
    clientId: '',
    clientSecret: '',
    redirectUri: ''
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Fetch available EHR systems
  const { data: ehrSystems = [], isLoading: loadingSystems } = useQuery<EHRSystem[]>({
    queryKey: ['/api/ehr/systems'],
    refetchOnWindowFocus: false
  });

  // Connect to EHR system mutation
  const connectEHRMutation = useMutation({
    mutationFn: async (config: any) => {
      return apiRequest('/api/ehr/connect', {
        method: 'POST',
        body: JSON.stringify(config)
      });
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        // Open OAuth flow in new window
        const popup = window.open(
          data.authUrl,
          'ehr_oauth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Listen for OAuth completion (in production, implement proper callback handling)
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            setIsConnecting(false);
            toast({
              title: "EHR Connection",
              description: "OAuth window closed. Please complete the connection process.",
            });
          }
        }, 1000);
      }
    },
    onError: (error: any) => {
      setIsConnecting(false);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to EHR system",
        variant: "destructive"
      });
    }
  });

  // Import patient mutation
  const importPatientMutation = useMutation({
    mutationFn: async (params: { ehrPatientId: string; connectionId: string }) => {
      return apiRequest('/api/ehr/import-patient', {
        method: 'POST',
        body: JSON.stringify(params)
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({
        title: "Patient Imported",
        description: `Successfully imported ${data.patient.firstName} ${data.patient.lastName}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import patient",
        variant: "destructive"
      });
    }
  });

  const handleConnect = () => {
    if (!selectedSystem || !connectionConfig.baseUrl || !connectionConfig.clientId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    const config = {
      systemName: selectedSystem,
      ...connectionConfig,
      redirectUri: connectionConfig.redirectUri || `${window.location.origin}/ehr/callback`
    };

    connectEHRMutation.mutate(config);
  };

  const getSystemConfig = (systemName: string) => {
    switch (systemName) {
      case 'Epic':
        return {
          baseUrlPlaceholder: 'https://fhir.epic.com/interconnect-fhir-oauth',
          clientIdLabel: 'Epic Client ID',
          description: 'Epic MyChart FHIR R4 integration. Requires Epic App Orchard registration.'
        };
      case 'Cerner':
        return {
          baseUrlPlaceholder: 'https://fhir-open.cerner.com/r4/ec2458f2-1e24-41c8-b71b-0e701af7583d',
          clientIdLabel: 'Cerner Client ID',
          description: 'Cerner PowerChart SMART on FHIR integration. Requires Cerner developer account.'
        };
      default:
        return {
          baseUrlPlaceholder: 'https://your-ehr-fhir-base-url',
          clientIdLabel: 'Client ID',
          description: 'Standard FHIR R4 integration with OAuth 2.0'
        };
    }
  };

  const systemConfig = selectedSystem ? getSystemConfig(selectedSystem) : null;

  return (
    <div className="space-y-6" data-testid="ehr-integration-panel">
      <div className="flex items-center space-x-2">
        <Database className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">EHR System Integration</h2>
      </div>

      {/* Connection Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5" />
            <span>Connect EHR System</span>
          </CardTitle>
          <CardDescription>
            Integrate with major EHR systems using FHIR R4 standards for seamless data exchange.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingSystems ? (
            <div className="text-center">Loading EHR systems...</div>
          ) : (
            <>
              <div>
                <Label htmlFor="ehr-system">EHR System</Label>
                <Select 
                  value={selectedSystem} 
                  onValueChange={setSelectedSystem}
                  data-testid="select-ehr-system"
                >
                  <SelectTrigger id="ehr-system">
                    <SelectValue placeholder="Select an EHR system" />
                  </SelectTrigger>
                  <SelectContent>
                    {ehrSystems.map((system) => (
                      <SelectItem key={system.name} value={system.name}>
                        {system.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSystem && systemConfig && (
                <>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {systemConfig.description}
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="base-url">FHIR Base URL</Label>
                      <Input
                        id="base-url"
                        placeholder={systemConfig.baseUrlPlaceholder}
                        value={connectionConfig.baseUrl}
                        onChange={(e) => setConnectionConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                        data-testid="input-base-url"
                      />
                    </div>
                    <div>
                      <Label htmlFor="client-id">{systemConfig.clientIdLabel}</Label>
                      <Input
                        id="client-id"
                        placeholder="Your application client ID"
                        value={connectionConfig.clientId}
                        onChange={(e) => setConnectionConfig(prev => ({ ...prev, clientId: e.target.value }))}
                        data-testid="input-client-id"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="client-secret">Client Secret</Label>
                    <Input
                      id="client-secret"
                      type="password"
                      placeholder="Your application client secret"
                      value={connectionConfig.clientSecret}
                      onChange={(e) => setConnectionConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                      data-testid="input-client-secret"
                    />
                  </div>

                  <div>
                    <Label htmlFor="redirect-uri">Redirect URI (Optional)</Label>
                    <Input
                      id="redirect-uri"
                      placeholder={`${window.location.origin}/ehr/callback`}
                      value={connectionConfig.redirectUri}
                      onChange={(e) => setConnectionConfig(prev => ({ ...prev, redirectUri: e.target.value }))}
                      data-testid="input-redirect-uri"
                    />
                  </div>

                  <Button 
                    onClick={handleConnect}
                    disabled={isConnecting || connectEHRMutation.isPending}
                    className="w-full"
                    data-testid="button-connect-ehr"
                  >
                    {isConnecting || connectEHRMutation.isPending ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Link className="h-4 w-4 mr-2" />
                        Connect to {selectedSystem}
                      </>
                    )}
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Integration Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Integration Features</span>
          </CardTitle>
          <CardDescription>
            Available features once connected to your EHR system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium">Patient Data Import</h4>
                <p className="text-sm text-gray-600">Import patient demographics and medical history</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium">Encounter Sync</h4>
                <p className="text-sm text-gray-600">Synchronize encounter data and SOAP notes</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium">Real-time Updates</h4>
                <p className="text-sm text-gray-600">Push AI-generated documentation back to EHR</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium">FHIR Compliance</h4>
                <p className="text-sm text-gray-600">Full HL7 FHIR R4 standard compliance</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Test integration features (requires active EHR connection)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="EHR Patient ID"
              className="flex-1"
              data-testid="input-import-patient-id"
            />
            <Button 
              variant="outline"
              disabled={importPatientMutation.isPending}
              data-testid="button-import-patient"
            >
              {importPatientMutation.isPending ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import Patient'
              )}
            </Button>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Note:</strong> All EHR integrations use secure OAuth 2.0 authentication 
              and encrypted data transmission. Patient data is handled in compliance with HIPAA regulations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}