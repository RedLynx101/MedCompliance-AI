import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Printer, X, AlertTriangle } from "lucide-react";
import { PostVisitReport as PostVisitReportType } from "@/lib/types";

interface PostVisitReportProps {
  encounterId: string;
  open: boolean;
  onClose: () => void;
}

export default function PostVisitReport({ encounterId, open, onClose }: PostVisitReportProps) {
  const { data: report, isLoading } = useQuery<PostVisitReportType>({
    queryKey: ["/api/encounters", encounterId, "report"],
    enabled: open && !!encounterId,
  });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
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

  const getRiskBgColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case "high":
        return "bg-red-100";
      case "medium":
        return "bg-amber-100";
      case "low":
        return "bg-green-100";
      default:
        return "bg-green-100";
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!report) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Report not available</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto" data-testid="post-visit-report-modal">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle data-testid="report-title">
              Post-Visit Report - {report.patient.name}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-report">
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Claim Risk Score */}
          <Card className={`${getRiskBgColor(report.riskLevel)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Claim Risk Assessment</h3>
                <div className="flex items-center space-x-2">
                  <span className={`text-2xl font-bold ${getRiskColor(report.riskLevel)}`} data-testid="text-risk-level">
                    {report.riskLevel} Risk
                  </span>
                  <div className={`w-16 h-16 ${getRiskBgColor(report.riskLevel)} rounded-full flex items-center justify-center border-2`}>
                    <span className={`font-bold ${getRiskColor(report.riskLevel)}`} data-testid="text-risk-score">
                      {report.riskScore}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Final SOAP Note */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Final SOAP Note</h3>

            {report.finalSoapNotes && (
              <>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-primary mb-2">Subjective</h4>
                    <p className="text-sm" data-testid="soap-subjective">
                      {report.finalSoapNotes.subjective}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-primary mb-2">Objective</h4>
                    <p className="text-sm" data-testid="soap-objective">
                      {report.finalSoapNotes.objective}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-primary mb-2">Assessment</h4>
                    <p className="text-sm" data-testid="soap-assessment">
                      {report.finalSoapNotes.assessment}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-primary mb-2">Plan</h4>
                    <p className="text-sm" data-testid="soap-plan">
                      {report.finalSoapNotes.plan}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* ICD-10/CPT Suggestions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Coding Suggestions</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-primary mb-3">ICD-10 Codes</h4>
                  <div className="space-y-2" data-testid="icd-codes-container">
                    {report.codingSuggestions.icdCodes.map((code, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{code} - Low back pain</span>
                        <Badge className="bg-accent text-accent-foreground">
                          {index === 0 ? "Primary" : "Secondary"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-primary mb-3">CPT Codes</h4>
                  <div className="space-y-2" data-testid="cpt-codes-container">
                    {report.codingSuggestions.cptCodes.map((code, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">
                          {code} - {code === "99213" ? "Office visit, established patient" : "Therapeutic exercise"}
                        </span>
                        <Badge variant="secondary">
                          {index === 0 ? "Recommended" : "If applicable"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Remaining Compliance Issues */}
          {report.unresolvedFlags.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Remaining Compliance Issues</h3>

              {report.unresolvedFlags.map((flag) => (
                <div key={flag.id} className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                  <div className="flex">
                    <AlertTriangle className="text-amber-400 mt-0.5 mr-3" size={20} />
                    <div>
                      <h4 className="text-sm font-medium text-amber-800">{flag.message}</h4>
                      <p className="text-sm text-amber-700 mt-1">{flag.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-border">
            <div className="flex space-x-3">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-save-to-ehr">
                <Save className="mr-2" size={16} />
                Save to EHR
              </Button>
              <Button variant="outline" data-testid="button-print-report">
                <Printer className="mr-2" size={16} />
                Print Report
              </Button>
            </div>
            <Button variant="outline" onClick={onClose} data-testid="button-close">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
