import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ComplianceFlag } from "@shared/schema";

interface ComplianceNudgesProps {
  encounterId: string;
}

export default function ComplianceNudges({ encounterId }: ComplianceNudgesProps) {
  const queryClient = useQueryClient();

  const { data: encounter } = useQuery({
    queryKey: ["/api/encounters", encounterId],
  });

  const updateFlagMutation = useMutation({
    mutationFn: async ({ flagId, action }: { flagId: string; action: string }) => {
      const response = await apiRequest("PATCH", `/api/compliance-flags/${flagId}`, {
        userAction: action
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encounters", encounterId] });
    },
  });

  const activeFlags = (encounter as any)?.complianceFlags?.filter((flag: ComplianceFlag) => !flag.isResolved) || [];

  const getIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertTriangle className="text-red-500" size={20} />;
      case "warning":
        return <AlertTriangle className="text-amber-500" size={20} />;
      case "info":
        return <Info className="text-blue-500" size={20} />;
      default:
        return <Info className="text-blue-500" size={20} />;
    }
  };

  const getBorderColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "border-red-400";
      case "warning":
        return "border-amber-400";
      case "info":
        return "border-blue-400";
      default:
        return "border-blue-400";
    }
  };

  const getBgColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-red-50";
      case "warning":
        return "bg-amber-50";
      case "info":
        return "bg-blue-50";
      default:
        return "bg-blue-50";
    }
  };

  const getTextColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "text-red-800";
      case "warning":
        return "text-amber-800";
      case "info":
        return "text-blue-800";
      default:
        return "text-blue-800";
    }
  };

  const getDescColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "text-red-700";
      case "warning":
        return "text-amber-700";
      case "info":
        return "text-blue-700";
      default:
        return "text-blue-700";
    }
  };

  const handleFlagAction = (flagId: string, action: "accept" | "dismiss") => {
    updateFlagMutation.mutate({ flagId, action });
  };

  if (activeFlags.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 text-accent" size={20} />
            Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-accent py-8">
            <Shield className="mx-auto mb-2" size={48} />
            <p className="text-lg font-medium">All compliance checks passed!</p>
            <p className="text-sm text-muted-foreground">No active compliance issues detected.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 text-amber-500" size={20} />
          Active Compliance Nudges
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3" data-testid="compliance-nudges-container">
          {activeFlags.map((flag: ComplianceFlag) => (
            <div 
              key={flag.id} 
              className={`${getBgColor(flag.severity)} border-l-4 ${getBorderColor(flag.severity)} p-4 rounded`}
              data-testid={`compliance-flag-${flag.id}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex">
                  {getIcon(flag.severity)}
                  <div className="ml-3">
                    <h4 className={`text-sm font-medium ${getTextColor(flag.severity)}`}>
                      {flag.message}
                    </h4>
                    <p className={`text-sm mt-1 ${getDescColor(flag.severity)}`}>
                      {flag.explanation}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button 
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => handleFlagAction(flag.id, "accept")}
                    disabled={updateFlagMutation.isPending}
                    data-testid={`button-accept-${flag.id}`}
                  >
                    Accept
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => handleFlagAction(flag.id, "dismiss")}
                    disabled={updateFlagMutation.isPending}
                    data-testid={`button-dismiss-${flag.id}`}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
