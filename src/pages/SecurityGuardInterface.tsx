import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Scan, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function SecurityGuardInterface() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const { toast } = useToast();

  const handleVerify = async () => {
    setIsLoading(true);
    setValidationResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("verify-access-code", {
        body: { code },
      });

      if (error) {
        throw error;
      }

      setValidationResult(data.access_code);
      toast({ title: "Access Granted", description: "The visitor has been verified." });
    } catch (error) {
      console.error("Error verifying access code:", error);
      setValidationResult({ error: (error as Error).message });
      toast({
        title: "Access Denied",
        description: (error as Error).message,
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
          <CardDescription>Verify visitor access codes.</CardDescription>
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
          </div>

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
