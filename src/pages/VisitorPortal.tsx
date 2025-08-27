import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/apiClient";
import { 
  Users, 
  Shield, 
  QrCode, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight,
  Smartphone,
  Mail,
  Calendar,
  MapPin
} from "lucide-react";

const VisitorPortal = () => {
  const [invitationToken, setInvitationToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationToken.trim()) {
      toast({
        title: "Error",
        description: "Please enter your invitation token",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Validate the token using the new API
      const response = await apiClient.validateInvitationToken(invitationToken);
      
      if (response.data?.valid) {
        // Redirect to registration with token
        window.location.href = `/visitor-registration?token=${invitationToken}`;
      } else {
        toast({
          title: "Invalid Token",
          description: response.data?.message || "The invitation token is invalid or has expired",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Token validation error:", error);
      toast({
        title: "Error",
        description: "Failed to validate invitation token",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SecureGate Kenya</h1>
                <p className="text-gray-600">Visitor Portal</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Secure Access
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Our Community
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              You've been invited to visit our secure community. Please enter your invitation token 
              to proceed with registration and receive your access credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Token Entry Form */}
            <div className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-blue-600" />
                    Enter Invitation Token
                  </CardTitle>
                  <CardDescription>
                    Enter the invitation token you received from your host
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleTokenSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="token">Invitation Token</Label>
                      <Input
                        id="token"
                        placeholder="Enter your invitation token..."
                        value={invitationToken}
                        onChange={(e) => setInvitationToken(e.target.value)}
                        className="text-center text-lg font-mono"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? "Validating..." : "Continue to Registration"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-orange-900 mb-1">Security Notice</h3>
                      <p className="text-sm text-orange-800">
                        This is a secure community. All visitors must be pre-approved and registered. 
                        Please ensure you have a valid invitation token before proceeding.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Information Section */}
            <div className="space-y-6">
              {/* How it Works */}
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                  <CardDescription>Simple steps to get your access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold">Enter Token</h4>
                      <p className="text-sm text-gray-600">Input the invitation token from your host</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold">Complete Registration</h4>
                      <p className="text-sm text-gray-600">Provide your details and upload a photo</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold">Receive Access</h4>
                      <p className="text-sm text-gray-600">Get your QR code and PIN for entry</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle>What You'll Get</CardTitle>
                  <CardDescription>Secure access features included</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <QrCode className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-semibold">QR Code Access</h4>
                      <p className="text-sm text-gray-600">Quick and secure entry</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-semibold">Secure PIN</h4>
                      <p className="text-sm text-gray-600">Backup access method</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <div>
                      <h4 className="font-semibold">Time-Limited Access</h4>
                      <p className="text-sm text-gray-600">Valid for your visit duration</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-semibold">Instant Activation</h4>
                      <p className="text-sm text-gray-600">Ready to use immediately</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                  <CardDescription>Contact information for assistance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">+254 700 000 000</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">support@securegate.ke</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Gate Security Office</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Information */}
          <div className="mt-16 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold mb-2">Security First</h3>
                <p className="text-sm text-gray-600">
                  All visitors are verified and monitored for community safety
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Privacy Protected</h3>
                <p className="text-sm text-gray-600">
                  Your personal information is encrypted and securely stored
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">24/7 Support</h3>
                <p className="text-sm text-gray-600">
                  Security personnel available around the clock for assistance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorPortal;


