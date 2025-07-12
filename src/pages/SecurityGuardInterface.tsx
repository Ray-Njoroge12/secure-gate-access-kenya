import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { QrCode, Search, CheckCircle, AlertTriangle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SecurityGuardInterface = () => {
  const [qrInput, setQrInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [incident, setIncident] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Security Guard Interface</h1>
            <p className="text-muted-foreground">Verify visitors and manage security</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                />
              </div>
              <Button 
                onClick={handleVerifyQR}
                disabled={isLoading}
                className="w-full"
              >
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
                />
              </div>
              <Button variant="outline" className="w-full">
                Search Visitors
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                />
              </div>
              <Button 
                onClick={handleReportIncident}
                disabled={isLoading}
                variant="destructive"
                className="w-full"
              >
                {isLoading ? "Reporting..." : "Report Incident"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <CardTitle>System Status</CardTitle>
              </div>
              <CardDescription>
                Current system status and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Status</span>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">QR Scanner</span>
                <Badge className="bg-green-100 text-green-800">Ready</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network</span>
                <Badge className="bg-green-100 text-green-800">Stable</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SecurityGuardInterface;