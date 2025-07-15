import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { QrCode, Search, CheckCircle, AlertTriangle, Shield, Loader2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeScanner } from "@/components/QRCodeScanner";

const SecurityGuardInterface = () => {
  const [qrInput, setQrInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [incident, setIncident] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();

  const handleVerifyQR = async () => {
    if (!qrInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a QR code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-access-code", {
        body: { qrToken: qrInput },
      });

      if (error) throw error;

      toast({
        title: "Verification Result",
        description: data.valid ? "Access granted" : "Invalid code",
        variant: data.valid ? "default" : "destructive",
      });

      setQrInput("");
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Error",
        description: "Failed to verify QR code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportIncident = async () => {
    if (!incident.trim()) {
      toast({
        title: "Error",
        description: "Please describe the incident",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // For now, just log to audit_logs table
      const { error } = await supabase
        .from("audit_logs")
        .insert({
          event_type: "incident_reported",
          details: { description: incident },
          user_id: null, // Guard user would be here
        });

      if (error) throw error;

      toast({
        title: "Incident Reported",
        description: "Incident has been logged successfully",
      });

      setIncident("");
    } catch (error) {
      console.error("Incident reporting error:", error);
      toast({
        title: "Error",
        description: "Failed to report incident",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground shadow flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-7 w-7" />
          <span className="font-bold text-lg">SecureGate Guard</span>
        </div>
        <Button variant="ghost" size="icon" onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} aria-label="Logout">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>
      <main className="flex-1 container mx-auto px-2 py-4 flex flex-col gap-6">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                <CardTitle>QR Code Verification</CardTitle>
              </div>
              <CardDescription>
                Scan or enter QR code to verify visitor access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qr-input">QR Code</Label>
                <Input
                  id="qr-input"
                  placeholder="Enter QR code here..."
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  disabled={scanning}
                  className="text-lg py-3"
                />
                <Button
                  variant={scanning ? "secondary" : "outline"}
                  className="mt-2 w-full text-lg py-3"
                  onClick={() => setScanning((s) => !s)}
                >
                  {scanning ? "Stop Scanning" : "Scan with Camera"}
                </Button>
                {scanning && (
                  <QRCodeScanner
                    onResult={(result) => {
                      setQrInput(result);
                      setScanning(false);
                      setTimeout(() => handleVerifyQR(), 300); // auto-verify after scan
                    }}
                    onError={(err) => {
                      toast({ title: "Scan Error", description: err.message, variant: "destructive" });
                    }}
                    className="mt-4"
                  />
                )}
              </div>
              <Button 
                onClick={handleVerifyQR}
                disabled={isLoading || scanning}
                className="w-full text-lg py-3"
              >
                {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2 inline" /> : null}
                {isLoading ? "Verifying..." : "Verify Access"}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                <CardTitle>Visitor Search</CardTitle>
              </div>
              <CardDescription>
                Search for visitor information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Enter visitor name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-lg py-3"
                />
              </div>
              <Button variant="outline" className="w-full text-lg py-3">
                Search Visitors
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <CardTitle>Report Incident</CardTitle>
              </div>
              <CardDescription>
                Log security incidents or unusual activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="incident">Incident Description</Label>
                <Textarea
                  id="incident"
                  placeholder="Describe the incident..."
                  value={incident}
                  onChange={(e) => setIncident(e.target.value)}
                  className="text-lg py-3"
                />
              </div>
              <Button onClick={handleReportIncident} disabled={isLoading} className="w-full text-lg py-3">
                {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2 inline" /> : null}
                {isLoading ? "Reporting..." : "Report Incident"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SecurityGuardInterface;