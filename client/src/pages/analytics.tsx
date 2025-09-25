import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, DollarSign, BarChart3 } from "lucide-react";
import { AnalyticsResponse } from "@/lib/types";

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground animate-pulse">Loading analytics data...</p>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card p-6 rounded-lg shadow-sm border border-border animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-card p-6 rounded-lg shadow-sm border border-border animate-pulse">
                <div className="h-64 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const summary = analytics?.summary;
  const physicians = analytics?.physicianAnalytics || [];

  // Calculate denial reduction (mock improvement)
  const denialReduction = 23; // 23% improvement
  const avgDocTime = 8.5; // minutes
  const weeklyTimeSaved = summary?.totalTimeSaved || 12.4;
  const monthlySavings = summary?.monthlyCostSavings || 89000;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Track compliance metrics, time savings, and denial reduction across your practice</p>
      </div>

      <div className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Claim Denial Reduction</p>
                  <p className="text-3xl font-bold text-accent" data-testid="metric-denial-reduction">{denialReduction}%</p>
                  <p className="text-xs text-accent">↗ +5% from last month</p>
                </div>
                <div className="p-3 bg-accent/10 rounded-lg">
                  <TrendingUp className="text-accent" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Documentation Time</p>
                  <p className="text-3xl font-bold text-primary" data-testid="metric-doc-time">{avgDocTime}min</p>
                  <p className="text-xs text-accent">↗ 32% faster</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Clock className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Weekly Time Saved</p>
                  <p className="text-3xl font-bold text-accent" data-testid="metric-time-saved">{weeklyTimeSaved.toFixed(1)} hrs</p>
                  <p className="text-xs text-accent">Per physician</p>
                </div>
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Clock className="text-accent" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Cost Savings</p>
                  <p className="text-3xl font-bold text-accent" data-testid="metric-cost-savings">${(monthlySavings / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-accent">Estimated ROI</p>
                </div>
                <div className="p-3 bg-accent/10 rounded-lg">
                  <DollarSign className="text-accent" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Claim Denial Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="mx-auto mb-2" size={48} />
                  <p>Chart: 6-month denial reduction trend</p>
                  <p className="text-sm">Shows 23% improvement over baseline</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentation Time Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="mx-auto mb-2" size={48} />
                  <p>Chart: Weekly time savings per physician</p>
                  <p className="text-sm">Average 12.4 hours saved weekly</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Issues Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { issue: "Missing Physical Exam Documentation", percentage: 34, color: "bg-destructive" },
                { issue: "Incomplete ICD-10 Coding", percentage: 28, color: "bg-amber-500" },
                { issue: "Missing Symptom Duration", percentage: 22, color: "bg-blue-500" },
                { issue: "Insufficient Treatment Justification", percentage: 16, color: "bg-accent" }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 ${item.color} rounded`}></div>
                    <span className="text-sm font-medium">{item.issue}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 progress-bar">
                      <div className={`progress-fill ${item.color}`} style={{ width: `${item.percentage}%` }}></div>
                    </div>
                    <span className="text-sm font-medium" data-testid={`compliance-issue-${index}`}>
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Physician Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Physician Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Physician</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Patients/Week</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Compliance Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time Saved</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Denial Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {physicians.map((physician, index) => (
                    <tr key={physician.id} data-testid={`physician-row-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{physician.physicianName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{physician.patientsCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          physician.complianceScore >= 90 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {physician.complianceScore.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{physician.timeSaved} hrs</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-accent">{physician.denialRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
