
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
import { apiClient } from "@/lib/apiClient";
import { User, IdCard, Phone, CheckCircle, Copy, QrCode, Camera, Upload, Check, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export function VisitorRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    phoneNumber: "",
    visitorEmail: "",
    consent: false,
    photo: null as File | null,
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
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
      // Validate the invitation token
      validateInvitationToken(token);
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

  const validateInvitationToken = async (token: string) => {
    try {
      const result = await apiClient.validateInvitationToken(token);
      if (result.data?.valid && result.data.invitation) {
        setInvitationToken(token);
        // Pre-fill form with invitation data
        const invitation = result.data.invitation;
        setFormData(prev => ({
          ...prev,
          fullName: invitation.visitor_full_name,
          visitorEmail: invitation.visitor_email,
          phoneNumber: invitation.visitor_phone_number,
        }));
        toast({
          title: "Invitation Valid",
          description: `Welcome ${invitation.visitor_full_name}! Please complete your registration.`,
        });
      } else {
        toast({
          title: "Invalid Token",
          description: result.data?.error || "The invitation token is invalid or expired.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/"), 3000);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate invitation token.",
        variant: "destructive",
      });
      setTimeout(() => navigate("/"), 3000);
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.fullName.trim()) {
          errors.fullName = "Full name is required";
        }
        if (!formData.idNumber.trim()) {
          errors.idNumber = "ID number is required";
        }
        break;
      case 2:
        if (!formData.phoneNumber.trim()) {
          errors.phoneNumber = "Phone number is required";
        } else if (!/^(\+254|0)[17]\d{8}$/.test(formData.phoneNumber)) {
          errors.phoneNumber = "Please enter a valid Kenyan phone number";
        }
        if (!formData.visitorEmail.trim()) {
          errors.visitorEmail = "Email address is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.visitorEmail)) {
          errors.visitorEmail = "Please enter a valid email address";
        }
        break;
      case 3:
        if (!formData.photo) {
          errors.photo = "Photo is required for security verification";
        }
        if (!formData.consent) {
          errors.consent = "You must agree to the terms to proceed";
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setValidationErrors({});
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
        // TODO: Replace with actual FastAPI file upload endpoint
        // For now, simulate photo upload
        console.log('Uploading photo:', formData.photo.name);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate upload delay
        photoUrl = `https://example.com/photos/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`; // Placeholder URL
      }

      // Use the new FastAPI endpoint for invitation-based registration
      const result = await apiClient.registerVisitorWithInvitation({
        invitation_token: invitationToken!,
        full_name: formData.fullName,
        id_number: formData.idNumber,
        phone_number: formData.phoneNumber,
        visitor_email: formData.visitorEmail,
        consent: formData.consent,
        photo_url: photoUrl || undefined,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setRegistrationSuccess({
        visitorId: result.data!.visitor.id,
        accessCodeId: result.data!.access_code.id,
        pin: result.data!.access_code.pin,
        qrToken: result.data!.access_code.qr_token,
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 20 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Progress Indicator */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-medium text-gray-600">
                    <span className={currentStep >= 1 ? "text-indigo-600" : ""}>Personal Info</span>
                    <span className={currentStep >= 2 ? "text-indigo-600" : ""}>Contact Details</span>
                    <span className={currentStep >= 3 ? "text-indigo-600" : ""}>Photo & Consent</span>
                  </div>
                  <Progress value={(currentStep / 3) * 100} className="h-2" />
                  <div className="flex justify-between">
                    {[1, 2, 3].map((step) => (
                      <motion.div
                        key={step}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          step < currentStep
                            ? "bg-green-500 text-white"
                            : step === currentStep
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {step < currentStep ? <Check className="w-4 h-4" /> : step}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                  <motion.form
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={currentStep === 3 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}
                    className="space-y-6"
                  >
                    {currentStep === 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4"
                      >
                        <div>
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
                              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                              className={`pl-10 ${validationErrors.fullName ? "border-red-500" : "border-gray-300 focus:border-indigo-500"}`}
                              placeholder="Enter your full name"
                            />
                            {validationErrors.fullName && (
                              <p className="mt-1 text-sm text-red-600">{validationErrors.fullName}</p>
                            )}
                          </div>
                        </div>

                        <div>
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
                              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                              className={`pl-10 ${validationErrors.idNumber ? "border-red-500" : "border-gray-300 focus:border-indigo-500"}`}
                              placeholder="Enter your ID number"
                            />
                            {validationErrors.idNumber && (
                              <p className="mt-1 text-sm text-red-600">{validationErrors.idNumber}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4"
                      >
                        <div>
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
                              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                              className={`pl-10 ${validationErrors.phoneNumber ? "border-red-500" : "border-gray-300 focus:border-indigo-500"}`}
                              placeholder="+254712345678"
                            />
                            {validationErrors.phoneNumber && (
                              <p className="mt-1 text-sm text-red-600">{validationErrors.phoneNumber}</p>
                            )}
                          </div>
                        </div>

                        <div>
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
                              onChange={(e) => setFormData({ ...formData, visitorEmail: e.target.value })}
                              className={`pl-10 ${validationErrors.visitorEmail ? "border-red-500" : "border-gray-300 focus:border-indigo-500"}`}
                              placeholder="your.email@example.com"
                            />
                            {validationErrors.visitorEmail && (
                              <p className="mt-1 text-sm text-red-600">{validationErrors.visitorEmail}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 3 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4"
                      >
                        <div>
                          <Label htmlFor="photo" className="text-sm font-medium text-gray-700">
                            Upload Photo (Selfie)
                          </Label>
                          <div className="mt-1">
                            <motion.div
                              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                photoPreview ? "border-green-300 bg-green-50" : "border-gray-300 hover:border-gray-400"
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {photoPreview ? (
                                <div className="space-y-4">
                                  <img
                                    src={photoPreview}
                                    alt="Preview"
                                    className="mx-auto h-32 w-32 object-cover rounded-lg border"
                                  />
                                  <div className="flex items-center justify-center space-x-2">
                                    <Check className="h-5 w-5 text-green-500" />
                                    <span className="text-sm text-green-700">Photo uploaded successfully</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      Click to upload or drag and drop your photo
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      PNG, JPG up to 10MB
                                    </p>
                                  </div>
                                </div>
                              )}
                              <Input
                                id="photo"
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </motion.div>
                            {validationErrors.photo && (
                              <p className="mt-1 text-sm text-red-600">{validationErrors.photo}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="consent"
                            checked={formData.consent}
                            onCheckedChange={(checked) => setFormData({ ...formData, consent: !!checked })}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <Label htmlFor="consent" className="text-sm text-gray-700">
                              I consent to the processing of my personal data for security and access control purposes.
                              My data will be encrypted and handled according to GDPR regulations.
                            </Label>
                            {validationErrors.consent && (
                              <p className="mt-1 text-sm text-red-600">{validationErrors.consent}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="flex items-center space-x-2"
                      >
                        <X className="h-4 w-4" />
                        <span>Previous</span>
                      </Button>

                      <Button
                        type="submit"
                        disabled={isLoading || !invitationToken}
                        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            <span>Processing...</span>
                          </>
                        ) : currentStep === 3 ? (
                          <>
                            <span>Complete Registration</span>
                            <Check className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            <span>Next</span>
                            <Upload className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.form>
                </AnimatePresence>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
