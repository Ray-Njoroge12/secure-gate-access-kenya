import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvitationForm } from "@/components/InvitationForm";
import { InvitationsList } from "@/components/InvitationsList";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Select } from "@/components/ui/select";

const ResidentDashboard = () => {
  const { toast } = useToast();
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [deletionDate, setDeletionDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en");

  // Fetch deletion_requested_at on mount
  useEffect(() => {
    (async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;
      const { data, error } = await supabase
        .from("residents")
        .select("deletion_requested_at")
        .eq("id", session.user.id)
        .single();
      if (data && data.deletion_requested_at) {
        setDeletionRequested(true);
        setDeletionDate(data.deletion_requested_at);
      } else {
        setDeletionRequested(false);
        setDeletionDate(null);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;
      const { data, error } = await supabase
        .from("residents")
        .select("language")
        .eq("id", session.user.id)
        .single();
      if (data?.language) setLanguage(data.language);
    })();
  }, []);

  const handleDeleteRequest = async () => {
    if (!window.confirm("Are you sure you want to request account deletion? Your data will be scheduled for deletion in 7 days. You can cancel this request within that period.")) {
      return;
    }
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        setLoading(false);
        return;
      }
      const res = await fetch("/functions/v1/delete-user-data", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        setDeletionRequested(true);
        setDeletionDate(new Date().toISOString());
        toast({ title: "Deletion Requested", description: "Your account is scheduled for deletion in 7 days. Contact support to cancel." });
      } else {
        toast({ title: "Error", description: data.error || "Failed to request deletion.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = async () => {
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        setLoading(false);
        return;
      }
      const res = await fetch("/functions/v1/delete-user-data", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cancel: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeletionRequested(false);
        setDeletionDate(null);
        toast({ title: "Deletion Canceled", description: "Your account deletion request has been canceled." });
      } else {
        toast({ title: "Error", description: data.error || "Failed to cancel deletion.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (lang: string) => {
    setLanguage(lang);
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) return;
    const { error } = await supabase
      .from("residents")
      .update({ language: lang })
      .eq("id", session.user.id);
    if (!error) toast({ title: lang === "sw" ? "Lugha imebadilishwa" : "Language updated" });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Resident Dashboard</h1>
      {/* Data Deletion Section */}
      <div className="mb-8 p-4 border rounded bg-muted/20">
        <h2 className="text-xl font-semibold mb-2">Account Deletion</h2>
        <p className="mb-2 text-muted-foreground">
          You may request deletion of your account and all associated data. For security and legal reasons, deletion will be scheduled for 7 days after your request. You may contact support to cancel this request within the grace period.
        </p>
        {deletionRequested && deletionDate ? (
          <div className="mb-2 text-warning-foreground">
            <p>Your account is scheduled for deletion on: <b>{new Date(new Date(deletionDate).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleString()}</b></p>
            <button
              className="bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50 mt-2"
              onClick={handleCancelDelete}
              disabled={loading}
            >
              {loading ? "Canceling..." : "Cancel Deletion Request"}
            </button>
          </div>
        ) : (
          <button
            className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={handleDeleteRequest}
            disabled={loading}
          >
            {loading ? "Requesting..." : "Request Account Deletion"}
          </button>
        )}
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">{language === "sw" ? "Chagua Lugha" : "Select Language"}</label>
        <Select value={language} onValueChange={handleLanguageChange} className="w-40">
          <option value="en">English</option>
          <option value="sw">Kiswahili</option>
        </Select>
      </div>
      <Tabs defaultValue="invitations">
        <TabsList>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="pre-approved">Pre-Approved Visitors</TabsTrigger>
        </TabsList>
        <TabsContent value="invitations">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Create Invitation</h2>
              <InvitationForm />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-4">Your Invitations</h2>
              <InvitationsList />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="pre-approved">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Pre-approved visitors feature coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResidentDashboard;
