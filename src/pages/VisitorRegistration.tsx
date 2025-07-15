
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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
import { User, IdCard, Phone } from "lucide-react";
import { Select } from "@/components/ui/select";

export function VisitorRegistration() {
  const [language, setLanguage] = useState("en");
  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    phoneNumber: "",
    visitorEmail: "", // Added visitorEmail
    consent: false,
    photo: null as File | null,
  });
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const location = useLocation();

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
    }
  }, [location, toast]);

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
    setIsLoading(true);

    try {
      let photoUrl = null;
      if (formData.photo) {
        const fileExtension = formData.photo.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('visitor-photos') // Assuming a bucket named 'visitor-photos'
          .upload(fileName, formData.photo, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }
        photoUrl = supabase.storage.from('visitor-photos').getPublicUrl(uploadData.path).data.publicUrl;
      }

      const { error } = await supabase.functions.invoke(
        "complete-visitor-registration",
        {
          body: {
            fullName: formData.fullName,
            idNumber: formData.idNumber,
            phoneNumber: formData.phoneNumber,
            visitorEmail: formData.visitorEmail, // Pass the visitor email
            consent: formData.consent,
            photoUrl: photoUrl, // Pass the URL
            invitationToken: invitationToken,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Registration Successful!",
        description: "You will receive your access code shortly.",
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-4">
          <label className="block mb-1 font-medium">{language === "sw" ? "Chagua Lugha" : "Select Language"}</label>
          <Select value={language} onValueChange={setLanguage} className="w-40">
            <option value="en">English</option>
            <option value="sw">Kiswahili</option>
          </Select>
        </div>
        <h1 className="text-3xl font-bold mb-6">{language === "sw" ? "Usajili wa Mgeni" : "Visitor Registration"}</h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please complete your details to receive your gate access code.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <Label htmlFor="fullName">{language === "sw" ? "Jina la Kwanza" : "Full Name"}</Label>
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
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <Label htmlFor="idNumber">{language === "sw" ? "Namba ya Kitambulisho" : "National ID Number"}</Label>
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
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <Label htmlFor="phoneNumber">{language === "sw" ? "Namba ya Simu" : "Phone Number"}</Label>
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
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <Label htmlFor="visitorEmail">{language === "sw" ? "Barua Pepe ya Mgeni" : "Visitor's Email"}</Label>
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
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <Label htmlFor="photo">{language === "sw" ? "Upload Foto (Mwongozi)" : "Upload Photo (Selfie)"}</Label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <Checkbox
                  id="consent"
                  checked={formData.consent}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, consent: !!checked })
                  }
                />
                <Label htmlFor="consent" className="ml-2 block text-sm text-gray-900">
                  {language === "sw" ? "Ninifahamu kuweka data yangu ya kipekee." : "I consent to the processing of my personal data."}
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isLoading || !invitationToken}
              >
                {isLoading ? "Submitting..." : "Complete Registration"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
