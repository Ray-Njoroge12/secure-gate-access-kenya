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
  MapPin,
  Sparkles,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { motion } from "framer-motion";

export default function VisitorPortal() {
  const [invitationToken, setInvitationToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1.1, 1, 1.1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Header with glassmorphism */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 border-b border-white/20 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 shadow-lg"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center gap-3"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg"
              >
                <Shield className="h-6 w-6" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SecureGate Kenya
                </h1>
                <p className="text-gray-600 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Visitor Portal
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 shadow-sm">
                <Lock className="h-3 w-3 mr-1" />
                Secure Access
              </Badge>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section with enhanced animations */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center mb-12"
          >
            <motion.h2
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4"
            >
              Welcome to Our Community
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
            >
              You've been invited to visit our secure community. Please enter your invitation token
              to proceed with registration and receive your access credentials.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Token Entry Form with glassmorphism */}
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-6"
            >
              <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 hover:shadow-3xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <motion.div
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <QrCode className="h-6 w-6 text-blue-600" />
                    </motion.div>
                    Enter Invitation Token
                  </CardTitle>
                  <CardDescription className="text-base">
                    Enter the invitation token you received from your host
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleTokenSubmit} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="token" className="text-sm font-medium text-gray-700">
                        Invitation Token
                      </Label>
                      <div className="relative">
                        <Input
                          id="token"
                          type={showToken ? "text" : "password"}
                          placeholder="Enter your invitation token..."
                          value={invitationToken}
                          onChange={(e) => setInvitationToken(e.target.value)}
                          className="pr-12 text-center text-lg font-mono border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          disabled={isLoading}
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {showToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </motion.button>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        size="lg"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="mr-2"
                          >
                            ⟳
                          </motion.div>
                        ) : (
                          <ArrowRight className="h-5 w-5 mr-2" />
                        )}
                        {isLoading ? "Validating..." : "Continue to Registration"}
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>

              {/* Security Notice with enhanced styling */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Card className="border-orange-200/50 bg-gradient-to-br from-orange-50/80 to-red-50/80 backdrop-blur-xl supports-[backdrop-filter]:bg-orange-50/60 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      </motion.div>
                      <div>
                        <h3 className="font-semibold text-orange-900 mb-1">Security Notice</h3>
                        <p className="text-sm text-orange-800 leading-relaxed">
                          This is a secure community. All visitors must be pre-approved and registered.
                          Please ensure you have a valid invitation token before proceeding.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Information Section with enhanced cards */}
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="space-y-6"
            >
              {/* How it Works with step animations */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 hover:shadow-2xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg">How It Works</CardTitle>
                    <CardDescription>Simple steps to get your access</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { step: 1, title: "Enter Token", desc: "Input the invitation token from your host", icon: QrCode, color: "blue" },
                      { step: 2, title: "Complete Registration", desc: "Provide your details and upload a photo", icon: Users, color: "purple" },
                      { step: 3, title: "Receive Access", desc: "Get your QR code and PIN for entry", icon: CheckCircle, color: "green" }
                    ].map((item, index) => (
                      <motion.div
                        key={item.step}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className={`flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-${item.color}-100 to-${item.color}-200 text-${item.color}-600 font-semibold text-sm shadow-md`}
                        >
                          {item.step}
                        </motion.div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-600">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Features with enhanced icons */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 hover:shadow-2xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg">What You'll Get</CardTitle>
                    <CardDescription>Secure access features included</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { icon: QrCode, title: "QR Code Access", desc: "Quick and secure entry", color: "green" },
                      { icon: Shield, title: "Secure PIN", desc: "Backup access method", color: "blue" },
                      { icon: Clock, title: "Time-Limited Access", desc: "Valid for your visit duration", color: "purple" },
                      { icon: CheckCircle, title: "Instant Activation", desc: "Ready to use immediately", color: "green" }
                    ].map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.1 + index * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 15 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <feature.icon className={`h-5 w-5 text-${feature.color}-600`} />
                        </motion.div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                          <p className="text-sm text-gray-600">{feature.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Contact Information with enhanced styling */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 hover:shadow-2xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg">Need Help?</CardTitle>
                    <CardDescription>Contact information for assistance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { icon: Smartphone, text: "+254 700 000 000", color: "blue" },
                      { icon: Mail, text: "support@securegate.ke", color: "purple" },
                      { icon: MapPin, text: "Gate Security Office", color: "green" }
                    ].map((contact, index) => (
                      <motion.div
                        key={contact.text}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1.4 + index * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <contact.icon className={`h-4 w-4 text-${contact.color}-600`} />
                        </motion.div>
                        <span className="text-sm text-gray-700">{contact.text}</span>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>

          {/* Footer Information with enhanced animations */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-16 text-center"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Security First", desc: "All visitors are verified and monitored for community safety", icon: Shield },
                { title: "Privacy Protected", desc: "Your personal information is encrypted and securely stored", icon: Lock },
                { title: "24/7 Support", desc: "Security personnel available around the clock for assistance", icon: Users }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="p-6 rounded-xl bg-white/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <motion.div
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="flex justify-center mb-3"
                  >
                    <item.icon className="h-8 w-8 text-blue-600" />
                  </motion.div>
                  <h3 className="font-semibold mb-2 text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};


