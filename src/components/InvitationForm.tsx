import { useState } from "react";
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
import apiClient from "@/lib/apiClient";
import { createInvitationDirect } from "@/lib/visitor-flow-direct";
import { Send, UserPlus, CheckCircle, Copy, QrCode, Calendar, Clock, Users, Sparkles, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export function InvitationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [visitorFullName, setVisitorFullName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhoneNumber, setVisitorPhoneNumber] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitPurpose, setVisitPurpose] = useState("Social Visit");
  const [visitDuration, setVisitDuration] = useState(2);
  const [isMultiUse, setIsMultiUse] = useState(false);
  const [usesRemaining, setUsesRemaining] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [invitationSuccess, setInvitationSuccess] = useState<{
    invitationId: string;
    token: string;
    registrationUrl: string;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [invitationPreview, setInvitationPreview] = useState<any>(null);
  const { toast } = useToast();

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!visitorFullName.trim()) {
          errors.visitorFullName = "Visitor's full name is required";
        }
        if (!visitorEmail.trim()) {
          errors.visitorEmail = "Email address is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail)) {
          errors.visitorEmail = "Please enter a valid email address";
        }
        break;
      case 2:
        if (!visitorPhoneNumber.trim()) {
          errors.visitorPhoneNumber = "Phone number is required";
        } else if (!/^(\+254|0)[17]\d{8}$/.test(visitorPhoneNumber)) {
          errors.visitorPhoneNumber = "Please enter a valid Kenyan phone number";
        }
        if (!visitDate) {
          errors.visitDate = "Visit date is required";
        }
        break;
      case 3:
        if (!visitPurpose.trim()) {
          errors.visitPurpose = "Visit purpose is required";
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      updatePreview();
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setValidationErrors({});
  };

  const updatePreview = () => {
    setInvitationPreview({
      visitorName: visitorFullName,
      visitorEmail,
      visitorPhone: visitorPhoneNumber,
      visitDate,
      visitPurpose,
      visitDuration,
      isMultiUse,
      usesRemaining: isMultiUse ? usesRemaining : 1,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all steps before submission
    for (let step = 1; step <= 3; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }

    setIsLoading(true);
    setInvitationSuccess(null);

    try {
      const user = await apiClient.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to send invitations.");
      }

      // Use direct database approach
      const result = await createInvitationDirect({
        resident_id: user.id,
        visitor_full_name: visitorFullName,
        visitor_email: visitorEmail,
        visitor_phone_number: visitorPhoneNumber,
        visit_date: visitDate,
        visit_purpose: visitPurpose,
        visit_duration_hours: visitDuration,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create invitation");
      }

      // Generate registration URL
      const baseUrl = window.location.origin;
      const registrationUrl = `${baseUrl}/visitor-registration?token=${result.token}`;

      setInvitationSuccess({
        invitationId: result.invitationId!,
        token: result.token!,
        registrationUrl,
      });

      toast({
        title: "Invitation Created Successfully!",
        description: `Invitation created for ${visitorFullName}. Share the registration link with them.`,
      });

      // Reset form
      setVisitorFullName("");
      setVisitorEmail("");
      setVisitorPhoneNumber("");
      setVisitDate("");
      setVisitPurpose("Social Visit");
      setVisitDuration(2);
      setCurrentStep(1);
      setInvitationPreview(null);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description:
          (error as Error).message ||
          "Failed to send invitation. Please try again.",
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

  const handleNewInvitation = () => {
    setInvitationSuccess(null);
    setCurrentStep(1);
    setValidationErrors({});
    setInvitationPreview(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <CardHeader className="pb-6">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <UserPlus className="h-8 w-8 text-primary" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl">Create Visitor Invitation</CardTitle>
              <CardDescription className="text-base">
                Send a secure registration link to your visitor
              </CardDescription>
            </div>
          </motion.div>
        </CardHeader>

        <CardContent className="p-8">
          {invitationSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800 text-lg">
                  Invitation created successfully! Share this registration link with your visitor.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Registration Link */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3"
                >
                  <Label className="text-sm font-semibold text-gray-700">Registration Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={invitationSuccess.registrationUrl}
                      readOnly
                      className="flex-1 text-sm font-mono bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(invitationSuccess.registrationUrl, "Registration Link")}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>

                {/* QR Code */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-3"
                >
                  <Label className="text-sm font-semibold text-gray-700">QR Code</Label>
                  <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 flex justify-center">
                    <QRCodeGenerator
                      value={invitationSuccess.registrationUrl}
                      size={120}
                    />
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg"
              >
                <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
                <ul className="space-y-1">
                  <li>• Share the registration link or QR code with your visitor</li>
                  <li>• They will be guided through a secure registration process</li>
                  <li>• The invitation expires in 24 hours for security</li>
                  <li>• Monitor their registration status in your dashboard</li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center pt-4"
              >
                <Button
                  onClick={handleNewInvitation}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Another Invitation
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Progress Indicator */}
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-medium text-gray-600">
                  <span className={currentStep >= 1 ? "text-indigo-600" : ""}>Visitor Details</span>
                  <span className={currentStep >= 2 ? "text-indigo-600" : ""}>Visit Information</span>
                  <span className={currentStep >= 3 ? "text-indigo-600" : ""}>Purpose & Review</span>
                </div>
                <Progress value={(currentStep / 3) * 100} className="h-3" />
                <div className="flex justify-between">
                  {[1, 2, 3].map((step) => (
                    <motion.div
                      key={step}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        step < currentStep
                          ? "bg-green-500 text-white"
                          : step === currentStep
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
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
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Visitor Information</h3>
                        <p className="text-sm text-gray-600">Enter your visitor's basic contact details</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="visitorFullName" className="text-sm font-medium text-gray-700">
                            Full Name
                          </Label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Users className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                              id="visitorFullName"
                              type="text"
                              placeholder="John Doe"
                              value={visitorFullName}
                              onChange={(e) => setVisitorFullName(e.target.value)}
                              className={`pl-10 ${validationErrors.visitorFullName ? "border-red-500" : "border-gray-300 focus:border-indigo-500"}`}
                            />
                            {validationErrors.visitorFullName && (
                              <p className="mt-1 text-sm text-red-600">{validationErrors.visitorFullName}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="visitorEmail" className="text-sm font-medium text-gray-700">
                            Email Address
                          </Label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <UserPlus className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                              id="visitorEmail"
                              type="email"
                              placeholder="visitor@example.com"
                              value={visitorEmail}
                              onChange={(e) => setVisitorEmail(e.target.value)}
                              className={`pl-10 ${validationErrors.visitorEmail ? "border-red-500" : "border-gray-300 focus:border-indigo-500"}`}
                            />
                            {validationErrors.visitorEmail && (
                              <p className="mt-1 text-sm text-red-600">{validationErrors.visitorEmail}</p>
                            )}
                          </div>
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
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Visit Details</h3>
                        <p className="text-sm text-gray-600">Specify when and how long the visit will be</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="visitorPhoneNumber" className="text-sm font-medium text-gray-700">
                            Phone Number
                          </Label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <UserPlus className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                              id="visitorPhoneNumber"
                              type="tel"
                              placeholder="+254712345678"
                              value={visitorPhoneNumber}
                              onChange={(e) => setVisitorPhoneNumber(e.target.value)}
                              className={`pl-10 ${validationErrors.visitorPhoneNumber ? "border-red-500" : "border-gray-300 focus:border-indigo-500"}`}
                            />
                            {validationErrors.visitorPhoneNumber && (
                              <p className="mt-1 text-sm text-red-600">{validationErrors.visitorPhoneNumber}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="visitDate" className="text-sm font-medium text-gray-700">
                            Expected Visit Date
                          </Label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Calendar className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                              id="visitDate"
                              type="date"
                              value={visitDate}
                              onChange={(e) => setVisitDate(e.target.value)}
                              className={`pl-10 ${validationErrors.visitDate ? "border-red-500" : "border-gray-300 focus:border-indigo-500"}`}
                            />
                            {validationErrors.visitDate && (
                              <p className="mt-1 text-sm text-red-600">{validationErrors.visitDate}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="visitDuration" className="text-sm font-medium text-gray-700">
                            Visit Duration (hours)
                          </Label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Clock className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                              id="visitDuration"
                              type="number"
                              min="1"
                              max="24"
                              value={visitDuration}
                              onChange={(e) => setVisitDuration(parseInt(e.target.value) || 2)}
                              className="pl-10 border-gray-300 focus:border-indigo-500"
                            />
                          </div>
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
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Visit Purpose & Review</h3>
                        <p className="text-sm text-gray-600">Review the invitation details and confirm</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="visitPurpose" className="text-sm font-medium text-gray-700">
                            Visit Purpose
                          </Label>
                          <Input
                            id="visitPurpose"
                            type="text"
                            placeholder="Social Visit, Business Meeting, etc."
                            value={visitPurpose}
                            onChange={(e) => setVisitPurpose(e.target.value)}
                            className={`${validationErrors.visitPurpose ? "border-red-500" : "border-gray-300 focus:border-indigo-500"}`}
                          />
                          {validationErrors.visitPurpose && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.visitPurpose}</p>
                          )}
                        </div>

                        {/* Preview Card */}
                        {invitationPreview && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-50 p-4 rounded-lg border"
                          >
                            <h4 className="font-semibold text-gray-900 mb-3">Invitation Preview</h4>
                            <div className="space-y-2 text-sm">
                              <p><strong>Visitor:</strong> {invitationPreview.visitorName}</p>
                              <p><strong>Email:</strong> {invitationPreview.visitorEmail}</p>
                              <p><strong>Phone:</strong> {invitationPreview.visitorPhone}</p>
                              <p><strong>Date:</strong> {invitationPreview.visitDate}</p>
                              <p><strong>Purpose:</strong> {invitationPreview.visitPurpose}</p>
                              <p><strong>Duration:</strong> {invitationPreview.visitDuration} hours</p>
                            </div>
                          </motion.div>
                        )}
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
                      <EyeOff className="h-4 w-4" />
                      <span>Previous</span>
                    </Button>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          <span>Creating...</span>
                        </>
                      ) : currentStep === 3 ? (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Create Invitation</span>
                        </>
                      ) : (
                        <>
                          <span>Next</span>
                          <Eye className="h-4 w-4" />
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
    </motion.div>
  );
}