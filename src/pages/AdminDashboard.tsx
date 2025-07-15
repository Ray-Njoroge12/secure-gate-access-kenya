import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { differenceInDays, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { t } from "@/utils/i18n";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDeletions, setPendingDeletions] = useState<any[]>([]);
  const [loadingCancel, setLoadingCancel] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logAction, setLogAction] = useState("");
  const [logStart, setLogStart] = useState("");
  const [logEnd, setLogEnd] = useState("");
  const [overdueDeletions, setOverdueDeletions] = useState<any[]>([]);
  const [complianceStats, setComplianceStats] = useState({
    requested: 0,
    completed: 0,
    canceled: 0,
    overdue: 0,
  });
  const [uiLanguage, setUiLanguage] = useState("en");

  // Fetch pending deletions
  useEffect(() => {
    (async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;
      const res = await fetch("/functions/v1/list-pending-deletions", {
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (res.ok) {
        // Merge residents and visitors, tag with type
        const merged = [
          ...(data.residents || []).map((r: any) => ({ ...r, type: "resident" })),
          ...(data.visitors || []).map((v: any) => ({ ...v, type: "visitor" })),
        ];
        setPendingDeletions(merged);
      } else {
        toast({ title: "Error", description: data.error || "Failed to fetch pending deletions.", variant: "destructive" });
      }
    })();
  }, []);

  // Check for overdue deletions
  useEffect(() => {
    const now = new Date();
    const overdue = pendingDeletions.filter(u => {
      if (!u.deletion_requested_at) return false;
      const days = differenceInDays(now, parseISO(u.deletion_requested_at));
      return days > 7;
    });
    setOverdueDeletions(overdue);
  }, [pendingDeletions]);

  // Fetch audit logs
  useEffect(() => {
    (async () => {
      let query = supabase
        .from("audit_logs")
        .select("id, event_type, payload, created_at")
        .eq("event_type", "user_deletion")
        .order("created_at", { ascending: false })
        .limit(100);
      if (logAction) query = query.contains("payload", { action: logAction });
      if (logStart) query = query.gte("created_at", logStart);
      if (logEnd) query = query.lte("created_at", logEnd);
      const { data } = await query;
      setAuditLogs(data || []);
    })();
  }, [logAction, logStart, logEnd]);

  useEffect(() => {
    // Calculate compliance stats for current month
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    let requested = 0, completed = 0, canceled = 0, overdue = 0;
    auditLogs.forEach(l => {
      const ts = parseISO(l.payload.timestamp);
      if (!isWithinInterval(ts, { start: monthStart, end: monthEnd })) return;
      if (l.payload.action === "request_deletion") requested++;
      if (l.payload.action === "cancel_deletion") canceled++;
    });
    overdue = overdueDeletions.length;
    // For completed, count users whose deletion_requested_at is null but had a request in this month
    // (This is a proxy; for full accuracy, track hard deletes in audit logs)
    setComplianceStats({ requested, completed, canceled, overdue });
  }, [auditLogs, overdueDeletions]);

  // Export to CSV
  const exportLogs = () => {
    const rows = [
      ["Actor ID", "Actor Role", "Action", "Target User", "Timestamp", "IP"],
      ...auditLogs.map(l => [
        l.payload.actor_id,
        l.payload.actor_role,
        l.payload.action,
        l.payload.target_user_id,
        l.payload.timestamp,
        l.payload.ip,
      ]),
    ];
    const csv = rows.map(r => r.map(x => `"${x ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportLogsPDF = () => {
    const doc = new jsPDF();
    doc.text("Audit Logs", 10, 10);
    let y = 20;
    doc.text(["Actor ID", "Role", "Action", "Target", "Timestamp", "IP"].join(" | "), 10, y);
    y += 10;
    auditLogs.forEach(l => {
      doc.text([
        l.payload.actor_id,
        l.payload.actor_role,
        l.payload.action,
        l.payload.target_user_id,
        l.payload.timestamp,
        l.payload.ip,
      ].join(" | "), 10, y);
      y += 8;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save(`audit_logs_${Date.now()}.pdf`);
  };

  const exportLogsXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(auditLogs.map(l => ({
      "Actor ID": l.payload.actor_id,
      "Role": l.payload.actor_role,
      "Action": l.payload.action,
      "Target User": l.payload.target_user_id,
      "Timestamp": l.payload.timestamp,
      "IP": l.payload.ip,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AuditLogs");
    XLSX.writeFile(wb, `audit_logs_${Date.now()}.xlsx`);
  };

  const handleCancelDeletion = async (userId: string) => {
    setLoadingCancel(userId);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
        setLoadingCancel(null);
        return;
      }
      const res = await fetch("/functions/v1/delete-user-data", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cancel: true, userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setPendingDeletions((prev) => prev.filter((u) => u.id !== userId));
        toast({ title: "Deletion Canceled", description: "User's account deletion request has been canceled." });
      } else {
        toast({ title: "Error", description: data.error || "Failed to cancel deletion.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoadingCancel(null);
    }
  };

  const handleTestDatabase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("visit_invitations")
        .select("*")
        .limit(5);

      if (error) throw error;

      toast({
        title: "Database Connection",
        description: `Successfully connected! Found ${data?.length || 0} invitations.`,
      });
    } catch (error) {
      console.error("Database test error:", error);
      toast({
        title: "Database Error",
        description: "Failed to connect to database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke("reset-user-password", {
        body: { userId },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset email sent successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      console.error("Error resetting password:", error);
    }
  };

  const handleCleanOldInvitations = async () => {
    try {
      const { error } = await supabase.functions.invoke("clean-old-invitations");

      if (error) throw error;

      toast({
        title: "Success",
        description: "Old invitations cleaned successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      console.error("Error cleaning old invitations:", error);
    }
  };

  const filteredDeletions = pendingDeletions
    .filter((u) =>
      (!roleFilter || u.role === roleFilter) &&
      (!search || u.email.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (!a.deletion_requested_at || !b.deletion_requested_at) return 0;
      const aDate = new Date(a.deletion_requested_at).getTime();
      const bDate = new Date(b.deletion_requested_at).getTime();
      return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
    });

  const downloadComplianceReportPDF = () => {
    const doc = new jsPDF();
    let y = 10;
    doc.text("Compliance Report", 10, y);
    y += 10;
    doc.text(`Requested: ${complianceStats.requested}  Completed: ${complianceStats.completed}  Canceled: ${complianceStats.canceled}  Overdue: ${complianceStats.overdue}`, 10, y);
    y += 10;
    if (overdueDeletions.length > 0) {
      doc.text("Overdue Deletions:", 10, y);
      y += 8;
      overdueDeletions.forEach(u => {
        doc.text(`${u.email} (requested: ${u.deletion_requested_at})`, 12, y);
        y += 8;
        if (y > 270) { doc.addPage(); y = 20; }
      });
      y += 8;
    }
    doc.text("Audit Logs:", 10, y);
    y += 8;
    doc.text(["Actor ID", "Role", "Action", "Target", "Timestamp", "IP"].join(" | "), 10, y);
    y += 8;
    auditLogs.forEach(l => {
      doc.text([
        l.payload.actor_id,
        l.payload.actor_role,
        l.payload.action,
        l.payload.target_user_id,
        l.payload.timestamp,
        l.payload.ip,
      ].join(" | "), 10, y);
      y += 8;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save(`compliance_report_${Date.now()}.pdf`);
  };

  const downloadComplianceReportXLSX = () => {
    const wsData = [
      ["Compliance Summary"],
      ["Requested", complianceStats.requested],
      ["Completed", complianceStats.completed],
      ["Canceled", complianceStats.canceled],
      ["Overdue", complianceStats.overdue],
      [],
      ["Overdue Deletions"],
      ["Email", "Requested At"],
      ...overdueDeletions.map(u => [u.email, u.deletion_requested_at]),
      [],
      ["Audit Logs"],
      ["Actor ID", "Role", "Action", "Target User", "Timestamp", "IP"],
      ...auditLogs.map(l => [
        l.payload.actor_id,
        l.payload.actor_role,
        l.payload.action,
        l.payload.target_user_id,
        l.payload.timestamp,
        l.payload.ip,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ComplianceReport");
    XLSX.writeFile(wb, `compliance_report_${Date.now()}.xlsx`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("admin_dashboard", uiLanguage)}</h1>
      <div className="mb-4">
        <label className="block mb-1 font-medium">{t("select_language", uiLanguage)}</label>
        <Select value={uiLanguage} onValueChange={setUiLanguage} className="w-40">
          <option value="en">English</option>
          <option value="sw">Kiswahili</option>
        </Select>
      </div>
      {overdueDeletions.length > 0 && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <b>{t("warning", uiLanguage)}</b> {overdueDeletions.length} {t("overdue_deletions_warning", uiLanguage)} <a href="#overdue-section" className="underline">{t("view", uiLanguage)}</a>
        </div>
      )}
      {/* Pending Deletions Section */}
      <div className="mb-8 p-4 border rounded bg-muted/20">
        <h2 className="text-xl font-semibold mb-2">{t("pending_deletions", uiLanguage)}</h2>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search by email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter} className="w-40">
            <option value="">{t("all_roles", uiLanguage)}</option>
            <option value="resident">{t("resident", uiLanguage)}</option>
            <option value="visitor">{t("visitor", uiLanguage)}</option>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder} className="w-40">
            <option value="asc">{t("sort_soonest_first", uiLanguage)}</option>
            <option value="desc">{t("sort_latest_first", uiLanguage)}</option>
          </Select>
        </div>
        {filteredDeletions.length === 0 ? (
          <p className="text-muted-foreground">{t("no_pending_deletion_requests", uiLanguage)}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">{t("type", uiLanguage)}</th>
                <th className="text-left">{t("user_id", uiLanguage)}</th>
                <th className="text-left">{t("email", uiLanguage)}</th>
                <th className="text-left">{t("scheduled_deletion", uiLanguage)}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredDeletions.map((u) => (
                <tr key={u.id}>
                  <td>{u.type}</td>
                  <td>{u.id}</td>
                  <td>{u.email || u.email_encrypted || "-"}</td>
                  <td>{u.deletion_requested_at ? new Date(new Date(u.deletion_requested_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleString() : "-"}</td>
                  <td>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelDeletion(u.id)}
                      disabled={loadingCancel === u.id}
                    >
                      {loadingCancel === u.id ? "Canceling..." : t("cancel_deletion", uiLanguage)}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="mb-8 p-4 border rounded bg-muted/20">
        <h2 className="text-xl font-semibold mb-2">{t("audit_log_compliance", uiLanguage)}</h2>
        <div className="flex gap-6 mb-4">
          <div className="p-3 bg-muted rounded border">
            <b>{t("requested", uiLanguage)}:</b> {complianceStats.requested}
          </div>
          <div className="p-3 bg-muted rounded border">
            <b>{t("completed", uiLanguage)}:</b> {complianceStats.completed}
          </div>
          <div className="p-3 bg-muted rounded border">
            <b>{t("canceled", uiLanguage)}:</b> {complianceStats.canceled}
          </div>
          <div className="p-3 bg-red-100 rounded border border-red-400 text-red-700">
            <b>{t("overdue", uiLanguage)}:</b> {complianceStats.overdue}
          </div>
        </div>
        <div className="flex gap-2 mb-2">
          <Select value={logAction} onValueChange={setLogAction} className="w-40">
            <option value="">{t("all_actions", uiLanguage)}</option>
            <option value="request_deletion">{t("request_deletion", uiLanguage)}</option>
            <option value="cancel_deletion">{t("cancel_deletion", uiLanguage)}</option>
          </Select>
          <Input type="date" value={logStart} onChange={e => setLogStart(e.target.value)} className="w-40" />
          <Input type="date" value={logEnd} onChange={e => setLogEnd(e.target.value)} className="w-40" />
          <Button onClick={exportLogs} variant="outline">{t("export_csv", uiLanguage)}</Button>
          <Button onClick={exportLogsPDF} variant="outline">{t("export_pdf", uiLanguage)}</Button>
          <Button onClick={exportLogsXLSX} variant="outline">{t("export_excel", uiLanguage)}</Button>
          <Button onClick={downloadComplianceReportPDF} variant="default">{t("download_compliance_report_pdf", uiLanguage)}</Button>
          <Button onClick={downloadComplianceReportXLSX} variant="default">{t("download_compliance_report_excel", uiLanguage)}</Button>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th>{t("actor", uiLanguage)}</th>
              <th>{t("role", uiLanguage)}</th>
              <th>{t("action", uiLanguage)}</th>
              <th>{t("target", uiLanguage)}</th>
              <th>{t("timestamp", uiLanguage)}</th>
              <th>{t("ip", uiLanguage)}</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map(l => (
              <tr key={l.id}>
                <td>{l.payload.actor_id}</td>
                <td>{l.payload.actor_role}</td>
                <td>{l.payload.action}</td>
                <td>{l.payload.target_user_id}</td>
                <td>{l.payload.timestamp}</td>
                <td>{l.payload.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("system_status", uiLanguage)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {t("basic_admin_dashboard_description", uiLanguage)}
            </p>
            <Button 
              onClick={handleTestDatabase} 
              disabled={isLoading}
            >
              {isLoading ? "Testing..." : t("test_database_connection", uiLanguage)}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("quick_actions", uiLanguage)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                {t("view_all_invitations", uiLanguage)}
              </Button>
              <Button variant="outline" className="w-full">
                {t("system_reports", uiLanguage)}
              </Button>
              <Button variant="outline" className="w-full">
                {t("backup_data", uiLanguage)}
              </Button>
              <Button variant="destructive" className="w-full" onClick={handleCleanOldInvitations}>
                {t("clean_old_invitations", uiLanguage)}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <div id="overdue-section">
        {overdueDeletions.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold">{t("overdue_deletions", uiLanguage)}</h3>
            <ul className="list-disc ml-6">
              {overdueDeletions.map(u => (
                <li key={u.id}>{u.email} (requested: {u.deletion_requested_at})</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;