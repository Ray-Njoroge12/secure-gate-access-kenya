import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Scan, CheckCircle, XCircle, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SecurityGuardInterface() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [incidentType, setIncidentType] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentLocation, setIncidentLocation] = useState("");
  const [isReportingIncident, setIsReportingIncident] = useState(false);
  const { toast } = useToast();

  const handleReportIncident = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Guard not logged in.");
      }

      const { error } = await supabase.from("incidents").insert({
        guard_id: user.id,
        incident_type: incidentType,
        description: incidentDescription,
        location: incidentLocation,
      });

      if (error) throw error;

      toast({ title: "Incident Reported", description: "The incident has been successfully logged." });
      setIncidentType("");
      setIncidentDescription("");
      setIncidentLocation("");
      setIsReportingIncident(false);
    } catch (error) {
      console.error("Error reporting incident:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to report incident.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Security Guard Interface
          </CardTitle>
          <CardDescription>Verify visitor access codes and report incidents.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">QR Code or PIN</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Scan QR code or enter PIN"
              />
            </div>
            <Button onClick={handleVerify} className="w-full" disabled={isLoading}>
              {isLoading ? (
                "Verifying..."
              ) : (
                <>
                  <Scan className="mr-2 h-4 w-4" />
                  Verify Access
                </>
              )}
            </Button>

            <Button
              onClick={() => setIsReportingIncident(!isReportingIncident)}
              variant="outline"
              className="w-full"
            >
              <Flag className="mr-2 h-4 w-4" />
              {isReportingIncident ? "Cancel Report" : "Report Incident"}
            </Button>
          </div>

          {isReportingIncident && (
            <div className="mt-6 space-y-4 p-4 border rounded-md bg-muted">
              <h3 className="text-lg font-semibold">Report New Incident</h3>
              <div className="space-y-2">
                <Label htmlFor="incidentType">Incident Type</Label>
                <Select onValueChange={setIncidentType} value={incidentType}>
                  <SelectTrigger id="incidentType">
                    <SelectValue placeholder="Select incident type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unauthorized_entry">Unauthorized Entry</SelectItem>
                    <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                    <SelectItem value="visitor_issue">Visitor Issue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="incidentLocation">Location</Label>
                <Input
                  id="incidentLocation"
                  type="text"
                  placeholder="e.g., Main Gate, Block C"
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="incidentDescription">Description</Label>
                <Textarea
                  id="incidentDescription"
                  placeholder="Provide details about the incident..."
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                />
              </div>
              <Button onClick={handleReportIncident} className="w-full" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit Incident Report"}
              </Button>
            </div>
          )}

          {validationResult && (
            <div className="mt-4">
              {validationResult.error ? (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{validationResult.error}</AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>Access Granted</AlertDescription>
                  <div className="mt-2">
                    <p><strong>Visitor:</strong> {validationResult.visitors.full_name}</p>
                    <p><strong>ID Number:</strong> {validationResult.visitors.id_number}</p>
                    <p><strong>Phone Number:</strong> {validationResult.visitors.phone_number}</p>
                    <p><strong>Resident:</strong> {validationResult.residents.email}</p>
                    <p><strong>Community:</strong> {validationResult.residents.communities.name}</p>
                  </div>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SecurityGuardInterface;
