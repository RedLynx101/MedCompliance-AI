import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Shield, AlertTriangle, Clock } from "lucide-react";
import { Link } from "wouter";
import { EncounterWithPatient } from "@/lib/types";

export default function PatientList() {
  const { data: encounters = [], isLoading } = useQuery<EncounterWithPatient[]>({
    queryKey: ["/api/encounters"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRiskIndicator = (risk: string) => {
    switch (risk) {
      case "high":
        return <span className="status-indicator status-high"></span>;
      case "medium":
        return <span className="status-indicator status-medium"></span>;
      case "low":
        return <span className="status-indicator status-low"></span>;
      default:
        return <span className="status-indicator status-low"></span>;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-amber-600";
      case "low":
        return "text-accent";
      default:
        return "text-accent";
    }
  };

  const getProgressColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-destructive";
      case "medium":
        return "bg-amber-500";
      case "low":
        return "bg-accent";
      default:
        return "bg-accent";
    }
  };

  // Calculate stats
  const todayPatients = encounters.length;
  const highRiskCount = encounters.filter(e => e.complianceRisk === "high").length;
  const avgComplianceScore = encounters.length > 0 
    ? Math.round(encounters.reduce((sum, e) => sum + e.confidenceScore, 0) / encounters.length)
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card p-6 rounded-lg shadow-sm border border-border animate-pulse">
              <div className="h-16 bg-muted rounded"></div>
            </div>
          ))}
        </div>
        <div className="bg-card rounded-lg shadow-sm border border-border animate-pulse">
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Users className="text-accent" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Today's Patients</p>
                <p className="text-2xl font-bold" data-testid="text-today-patients">{todayPatients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="text-primary" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                <p className="text-2xl font-bold text-accent" data-testid="text-compliance-score">{avgComplianceScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="text-destructive" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-destructive" data-testid="text-high-risk">{highRiskCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Clock className="text-accent" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Time Saved</p>
                <p className="text-2xl font-bold" data-testid="text-time-saved">4.2hrs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      <Card>
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Patient List</h2>
            <div className="flex items-center space-x-2">
              <Input 
                type="text" 
                placeholder="Search patients..." 
                className="w-64" 
                data-testid="input-search-patients"
              />
              <Button size="sm" data-testid="button-search">
                <Search size={16} />
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Appointment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Compliance Risk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {encounters.map((encounter) => (
                <tr key={encounter.id} className="hover:bg-muted/50" data-testid={`row-patient-${encounter.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {encounter.patient?.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium" data-testid={`text-patient-name-${encounter.id}`}>
                          {encounter.patient?.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          DOB: {encounter.patient?.dateOfBirth}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    <div>{new Date(encounter.appointmentTime).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })} - {encounter.encounterType}</div>
                    <div className="text-muted-foreground">Chief Complaint: {encounter.chiefComplaint}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center">
                      {getRiskIndicator(encounter.complianceRisk)}
                      <span className={`text-sm font-medium ${getRiskColor(encounter.complianceRisk)}`}>
                        {encounter.complianceRisk.charAt(0).toUpperCase() + encounter.complianceRisk.slice(1)}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 progress-bar mr-2">
                        <div 
                          className={`progress-fill ${getProgressColor(encounter.complianceRisk)}`} 
                          style={{ width: `${encounter.confidenceScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm" data-testid={`text-confidence-${encounter.id}`}>
                        {encounter.confidenceScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(encounter.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <Button variant="ghost" size="sm" data-testid={`button-view-${encounter.id}`}>
                      View
                    </Button>
                    {encounter.status !== "completed" ? (
                      <Link href={`/encounter/${encounter.id}`}>
                        <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80" data-testid={`button-start-encounter-${encounter.id}`}>
                          Start Encounter
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Encounter Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
