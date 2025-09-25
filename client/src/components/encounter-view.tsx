import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Mic, MicOff, Save, Pause, Check, OctagonMinus, Info, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EncounterWithPatient, TranscriptMessage } from "@/lib/types";
import ComplianceNudges from "@/components/compliance-nudges";

interface EncounterViewProps {
  encounterId: string;
}

export default function EncounterView({ encounterId }: EncounterViewProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const queryClient = useQueryClient();

  const { data: encounter, isLoading } = useQuery<EncounterWithPatient>({
    queryKey: ["/api/encounters", encounterId],
  });

  const addTranscriptMutation = useMutation({
    mutationFn: async (data: { speaker: string; content: string; timestamp: number }) => {
      const response = await apiRequest("POST", `/api/encounters/${encounterId}/transcript`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encounters", encounterId] });
    },
  });

  const updateEncounterMutation = useMutation({
    mutationFn: async (data: Partial<EncounterWithPatient>) => {
      const response = await apiRequest("PATCH", `/api/encounters/${encounterId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/encounters", encounterId] });
    },
  });

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Simulate transcript updates
  useEffect(() => {
    if (isRecording) {
      const simulateTranscript = () => {
        const messages = [
          { speaker: "doctor", content: "Good afternoon, John. How are you feeling today?" },
          { speaker: "patient", content: "Hi Dr. Chen. I'm still having that back pain we discussed last month." },
          { speaker: "doctor", content: "I see. Can you tell me more about the pain? When did it start and how long have you been experiencing it?" },
          { speaker: "patient", content: "It started about 6 weeks ago after I helped my friend move. The pain is mainly in my lower back and it gets worse when I sit for long periods." },
          { speaker: "doctor", content: "And on a scale of 1 to 10, how would you rate the pain currently?" },
          { speaker: "patient", content: "I'd say it's about a 6 right now, but it can get up to an 8 when I've been sitting at my desk all day." },
        ];

        if (transcript.length < messages.length) {
          const nextMessage = messages[transcript.length];
          setTranscript(prev => [...prev, { 
            speaker: nextMessage.speaker as "doctor" | "patient", 
            content: nextMessage.content, 
            timestamp: recordingTime 
          }]);
          
          // Add to database
          addTranscriptMutation.mutate({
            speaker: nextMessage.speaker,
            content: nextMessage.content,
            timestamp: recordingTime
          });
        }
      };

      const timer = setTimeout(simulateTranscript, 3000);
      return () => clearTimeout(timer);
    }
  }, [isRecording, transcript.length, recordingTime, addTranscriptMutation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      updateEncounterMutation.mutate({ status: "in_progress" });
    }
  };

  const completeEncounter = () => {
    setIsRecording(false);
    updateEncounterMutation.mutate({ 
      status: "completed",
      recordingDuration: recordingTime
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border animate-pulse">
          <div className="h-20 bg-muted rounded"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg shadow-sm border border-border animate-pulse">
            <div className="h-96 bg-muted rounded"></div>
          </div>
          <div className="bg-card rounded-lg shadow-sm border border-border animate-pulse">
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!encounter) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Encounter not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encounter Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-primary">
                  {encounter.patient?.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold" data-testid="text-encounter-title">
                  {encounter.patient?.name} - {encounter.encounterType}
                </h2>
                <p className="text-muted-foreground">
                  DOB: {encounter.patient?.dateOfBirth} | MRN: {encounter.patient?.mrn}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm">
                {isRecording && (
                  <>
                    <span className="w-3 h-3 bg-red-500 rounded-full recording-pulse"></span>
                    <span data-testid="text-recording-time">Recording: {formatTime(recordingTime)}</span>
                  </>
                )}
              </div>
              <Button 
                onClick={toggleRecording}
                variant={isRecording ? "destructive" : "default"}
                data-testid="button-toggle-recording"
              >
                {isRecording ? (
                  <>
                    <OctagonMinus className="mr-2" size={16} />
                    OctagonMinus Recording
                  </>
                ) : (
                  <>
                    <Mic className="mr-2" size={16} />
                    Start Recording
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Encounter Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Transcript */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mic className="mr-2 text-accent" size={20} />
              Live Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 overflow-y-auto space-y-3" data-testid="transcript-container">
              {transcript.map((message, index) => (
                <div key={index} className="text-sm">
                  <span className={`font-medium ${
                    message.speaker === "doctor" ? "text-primary" : "text-accent"
                  }`}>
                    {message.speaker === "doctor" ? "Dr. Chen:" : "Patient:"}
                  </span>
                  <span className="ml-2" data-testid={`transcript-message-${index}`}>
                    {message.content}
                  </span>
                </div>
              ))}
              {isRecording && transcript.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium text-primary">Dr. Chen:</span>
                  <span className="ml-2 typing-animation">And on a scale of 1 to 10, how would you rate the pain currently</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI-Generated SOAP Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Save className="mr-2 text-primary" size={20} />
              Live SOAP Notes
              <Badge variant="secondary" className="ml-2">AI Generated</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 overflow-y-auto space-y-4" data-testid="soap-notes-container">
              {encounter.soapNotes ? (
                <>
                  <div>
                    <h4 className="font-semibold text-primary mb-2">Subjective</h4>
                    <div className="text-sm bg-muted p-3 rounded">
                      {(encounter.soapNotes as any)?.subjective || "[No subjective notes yet...]"}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="compliance-flag px-1 py-0.5 rounded ml-2 cursor-help">
                              Pain duration: 6 weeks
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="w-64">
                              <Info className="inline mr-1" size={12} />
                              CMS requires pain duration documentation for chronic pain coding and treatment justification.
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-primary mb-2">Objective</h4>
                    <div className="text-sm bg-muted p-3 rounded">
                      {(encounter.soapNotes as any)?.objective || "[No objective notes yet...]"}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="compliance-flag px-1 py-0.5 rounded ml-2 cursor-help">
                              [Missing physical exam findings]
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="w-64">
                              <AlertTriangle className="inline mr-1" size={12} />
                              Physical examination findings required for complete documentation and billing compliance.
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-primary mb-2">Assessment</h4>
                    <div className="text-sm bg-muted p-3 rounded">
                      {(encounter.soapNotes as any)?.assessment || "[No assessment yet...]"}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="compliance-flag px-1 py-0.5 rounded ml-2 cursor-help">
                              ICD-10: M54.5
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="w-64">
                              <Info className="inline mr-1" size={12} />
                              Suggested ICD-10 code based on documented symptoms. Consider M54.9 for unspecified back pain if location unclear.
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-primary mb-2">Plan</h4>
                    <div className="text-sm bg-muted p-3 rounded">
                      {(encounter.soapNotes as any)?.plan || "[Plan will be updated as encounter continues...]"}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                  SOAP notes will appear here as the encounter progresses...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Alerts */}
      <ComplianceNudges encounterId={encounterId} />

      {/* Quick Actions */}
      <div className="flex justify-between items-center bg-card p-4 rounded-lg shadow-sm border border-border">
        <div className="flex space-x-3">
          <Button variant="outline" data-testid="button-save-draft">
            <Save className="mr-2" size={16} />
            Save Draft
          </Button>
          <Button variant="outline" data-testid="button-pause-recording">
            <Pause className="mr-2" size={16} />
            Pause Recording
          </Button>
          <Button 
            onClick={completeEncounter}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            data-testid="button-complete-encounter"
          >
            <Check className="mr-2" size={16} />
            Complete Encounter
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Compliance Score: <span className="font-semibold text-amber-600" data-testid="text-compliance-score">
            {encounter.claimRiskScore ? Math.max(0, 100 - encounter.claimRiskScore) : 85}%
          </span>
        </div>
      </div>
    </div>
  );
}
