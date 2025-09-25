import { useParams } from "wouter";
import EncounterView from "@/components/encounter-view";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Encounter() {
  const params = useParams();
  const encounterId = params.id || "encounter-1"; // Default to first encounter for demo

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex items-center space-x-4">
        <Link href="/">
          <Button variant="ghost" size="sm" data-testid="button-back-to-dashboard">
            <ArrowLeft className="mr-2" size={16} />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Encounter</h1>
          <p className="text-muted-foreground">Real-time documentation and compliance checking</p>
        </div>
      </div>
      <EncounterView encounterId={encounterId} />
    </div>
  );
}
