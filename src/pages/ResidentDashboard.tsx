import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvitationForm from "@/components/InvitationForm";
import InvitationsList from "@/components/InvitationsList";
import PreApprovedVisitors from "@/components/PreApprovedVisitors";

const ResidentDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Resident Dashboard</h1>
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
          <PreApprovedVisitors />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResidentDashboard;
