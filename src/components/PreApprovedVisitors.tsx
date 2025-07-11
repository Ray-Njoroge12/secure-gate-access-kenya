import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function PreApprovedVisitors() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [relationship, setRelationship] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreApprovedVisitors();
  }, []);

  const fetchPreApprovedVisitors = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not logged in.");
      }
      const { data, error } = await supabase
        .from("pre_approved_visitors")
        .select("*")
        .eq("resident_id", user.id);

      if (error) throw error;
      setVisitors(data || []);
    } catch (error) {
      console.error("Error fetching pre-approved visitors:", error);
      toast({
        title: "Error",
        description: "Failed to load pre-approved visitors.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not logged in.");
      }

      const { error } = await supabase.from("pre_approved_visitors").insert({
        resident_id: user.id,
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        relationship,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Visitor added to pre-approved list." });
      setFullName("");
      setEmail("");
      setPhoneNumber("");
      setRelationship("");
      fetchPreApprovedVisitors();
    } catch (error) {
      console.error("Error adding visitor:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to add visitor.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVisitor = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("pre_approved_visitors")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Success", description: "Visitor removed from pre-approved list." });
      fetchPreApprovedVisitors();
    } catch (error) {
      console.error("Error deleting visitor:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to delete visitor.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Manage Pre-Approved Visitors</CardTitle>
            <CardDescription>
              Add and manage visitors who frequently visit your premises.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddVisitor} className="space-y-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="visitor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+2547XXXXXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship (e.g., Family, Friend, Staff)</Label>
              <Input
                id="relationship"
                type="text"
                placeholder="Family Member"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Visitor"}
          </Button>
        </form>

        <h3 className="text-lg font-semibold mb-4">Your Pre-Approved Visitors</h3>
        {visitors.length === 0 ? (
          <p className="text-muted-foreground">No pre-approved visitors added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitors.map((visitor) => (
                  <TableRow key={visitor.id}>
                    <TableCell>{visitor.full_name}</TableCell>
                    <TableCell>{visitor.email}</TableCell>
                    <TableCell>{visitor.phone_number}</TableCell>
                    <TableCell>{visitor.relationship}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteVisitor(visitor.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}