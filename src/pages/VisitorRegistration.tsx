
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { completeVisitorRegistrationDirect } from "@/lib/visitor-flow-direct";
import { User, IdCard, Phone, CheckCircle, Copy, QrCode } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";

export function VisitorRegistration() {
  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    phoneNumber: "",
    visitorEmail: "",
    consent: false,
    photo: null as File | null,
  });
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    visitorId: string;
    accessCodeId: string;
    pin: string;
    qrToken: string;
  } | null>(null);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = new URLSearchParams(location.search).get("token");
    if (token) {
      setInvitationToken(token);
    } else {
      toast({
        title: "Error",
        description: "Invalid invitation link. No token provided.",
        variant: "destructive",
      });
      // Redirect to home after 3 seconds
      setTimeout(() => navigate("/"), 3000);
    }
  }, [location, toast, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent) {
      toast({
        title: "Consent Required",
        description: "You must agree to the terms to proceed.",
        variant: "destructive",
      });
      return;
    }

    if (!invitationToken) {
      toast({
        title: "Error",
        description: "Invalid invitation token.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let photoUrl = null;
      if (formData.photo) {
        const fileExtension = formData.photo.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('visitor-photos')
          .upload(fileName, formData.photo, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }
        photoUrl = supabase.storage.from('visitor-photos').getPublicUrl(uploadData.path).data.publicUrl;
      }

      // Use direct database approach
      const result = await completeVisitorRegistrationDirect({
        fullName: formData.fullName,
        idNumber: formData.idNumber,
        phoneNumber: formData.phoneNumber,
        visitorEmail: formData.visitorEmail,
        consent: formData.consent,
        photoUrl: photoUrl || undefined,
        invitationToken: invitationToken,
      });

      if (!result.success) {
        throw new Error(result.error || "Registration failed");
      }

      setRegistrationSuccess({
        visitorId: result.visitorId!,
        accessCodeId: result.accessCodeId!,
        pin: result.pin!,
        qrToken: result.qrToken!,
      });

      toast({
        title: "Registration Successful!",
        description: "Your access code has been generated successfully.",
      });
    } catch (error) {
      console.error("Registration failed:", error);
      toast({
        title: "Error",
        description:
          (error as Error).message || "Registration failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`,
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard. Please copy manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Visitor Registration
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Complete your details to receive your secure gate access code.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <Card className="shadow-xl border-0">
          <CardContent className="p-8">
            {registrationSuccess ? (
              <div className="space-y-6">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Registration completed successfully! Your access code is ready.
                  </AlertDescription>
                </Alert>

                <div className="text-center space-y-4">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Access Code</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border">
                        <Label className="text-sm font-medium text-gray-600">PIN Code</Label>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-2xl font-mono font-bold text-indigo-600">
                            {registrationSuccess.pin}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(registrationSuccess.pin, "PIN")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border">
                        <Label className="text-sm font-medium text-gray-600">QR Code</Label>
                        <div className="mt-2 flex justify-center">
                          <QRCodeGenerator
                            value={registrationSuccess.qrToken}
                            size={120}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-mono text-gray-500">
                            {registrationSuccess.qrToken.substring(0, 20)}...
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(registrationSuccess.qrToken, "QR Token")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
                    <ul className="text-left space-y-1">
                      <li>• Use either the PIN or QR code at the gate</li>
                      <li>• This access code expires in 24 hours</li>
                      <li>• Keep this information secure</li>
                      <li>• Contact your host if you encounter any issues</li>
                    </ul>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p><strong>Visitor ID:</strong> {registrationSuccess.visitorId}</p>
                    <p><strong>Access Code ID:</strong> {registrationSuccess.accessCodeId}</p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                      Full Name
                    </Label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        required
                        className="pl-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <Label htmlFor="idNumber" className="text-sm font-medium text-gray-700">
                      National ID Number
                    </Label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IdCard className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        id="idNumber"
                        value={formData.idNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, idNumber: e.target.value })
                        }
                        required
                        className="pl-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Enter your ID number"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </Label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, phoneNumber: e.target.value })
                        }
                        required
                        className="pl-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="+254712345678"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <Label htmlFor="visitorEmail" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        id="visitorEmail"
                        type="email"
                        value={formData.visitorEmail}
                        onChange={(e) =>
                          setFormData({ ...formData, visitorEmail: e.target.value })
                        }
                        required
                        className="pl-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <Label htmlFor="photo" className="text-sm font-medium text-gray-700">
                      Upload Photo (Selfie)
                    </Label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
                        required
                        className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Please upload a clear photo of yourself for security verification.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Checkbox
                    id="consent"
                    checked={formData.consent}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, consent: !!checked })
                    }
                    className="mt-1"
                  />
                  <Label htmlFor="consent" className="ml-3 block text-sm text-gray-700">
                    I consent to the processing of my personal data for security and access control purposes. 
                    My data will be encrypted and handled according to GDPR regulations.
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !invitationToken}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Registration...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>

                {!invitationToken && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                      Invalid invitation link. Please ensure you're using the correct registration URL.
                    </AlertDescription>
                  </Alert>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
