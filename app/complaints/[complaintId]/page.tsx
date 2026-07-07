import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/app/components/layout/Navbar";
import {
  Activity,
  Check,
} from "lucide-react"; // Import direct on server to avoid any hook bundle inclusion

async function getComplaint(complaintId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/complaints/${complaintId}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.complaint;
}

const STATUS_STEPS = ["submitted", "acknowledged", "in_progress", "resolved"];
const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  acknowledged: "Acknowledged",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const SEVERITY_COLORS: Record<string, { badgeClass: string; color: string }> = {
  low:      { badgeClass: "ui-badge-success", color: "var(--success)" },
  medium:   { badgeClass: "ui-badge-warning", color: "var(--warning)" },
  high:     { badgeClass: "ui-badge-warning", color: "var(--warning)" },
  critical: { badgeClass: "ui-badge-danger",  color: "var(--danger)" },
};

export default async function ComplaintStatusPage({
  params,
}: {
  params: Promise<{ complaintId: string }>;
}) {
  const { complaintId } = await params;
  const complaint = await getComplaint(complaintId);

  if (!complaint) {
    notFound();
  }

  const currentStepIndex = STATUS_STEPS.indexOf(complaint.status);
  const sevStyle = SEVERITY_COLORS[complaint.severity] || SEVERITY_COLORS.low;

  return (
    <>
      <Navbar />
      <main id="main-content" style={{ minHeight: "calc(100vh - 64px)", background: "var(--neutral-bg)", padding: "48px 24px 80px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          
          {/* Back Action */}
          <div style={{ marginBottom: "24px" }}>
            <Link href="/complaints/track" style={{ fontSize: "14px", color: "var(--text-light)", textDecoration: "none", fontWeight: 600 }}>
              ← Track Another
            </Link>
          </div>

          {/* Main Card */}
          <div className="ui-card animate-fade-up" style={{ padding: "32px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Complaint Record</span>
                <h1 className="font-mono-id" style={{ fontSize: "24px", fontWeight: 800, color: "var(--primary)" }}>{complaint.complaintId}</h1>
              </div>
              <span className={`ui-badge ${sevStyle.badgeClass}`}>
                {complaint.severity?.toUpperCase()} PRIORITY
              </span>
            </div>

            {/* Parameters Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "28px" }}>
              {[
                { label: "Category", value: complaint.category?.replace(/-/g, " ") },
                { label: "Department Routing", value: complaint.suggestedDepartment || "Local grievance office" },
                { label: "Dispatch Area", value: `${complaint.location?.district}, ${complaint.location?.state}` },
                { label: "Registration Date", value: new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
              ].map((item) => (
                <div key={item.label} style={{ background: "var(--neutral-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{item.label}</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", textTransform: "capitalize" }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Formal Description */}
            <div style={{ background: "var(--primary-subtle)", border: "1px solid var(--primary-light)", borderRadius: "var(--radius-md)", padding: "18px", marginBottom: "32px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Synoptic Record</p>
              <p style={{ fontSize: "13.5px", color: "var(--text-muted)", lineHeight: 1.65 }}>{complaint.formalDescription}</p>
            </div>

            {/* Progress Timeline Indicator */}
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "18px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Workflow Status</p>
              <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }} role="list" aria-label="Progress steps">
                {STATUS_STEPS.map((stepName, i) => {
                  const isDone = i < currentStepIndex;
                  const isActive = i === currentStepIndex;
                  const completed = i <= currentStepIndex;
                  return (
                    <div key={stepName} role="listitem" className="wizard-step">
                      <div className={`wizard-indicator ${isActive ? "active" : completed ? "completed" : ""}`}>
                        {isDone ? <Check size={12} style={{ strokeWidth: 3 }} /> : i + 1}
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: isActive ? "var(--primary)" : completed ? "var(--success)" : "var(--text-light)", marginTop: "6px", whiteSpace: "nowrap" }}>
                        {STATUS_LABELS[stepName]}
                      </span>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`wizard-line ${isDone ? "active" : ""}`} style={{ left: "calc(50% + 14px)", right: "calc(-50% + 14px)", top: "14px" }} aria-hidden="true" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Activity Timeline logs */}
          <div className="ui-card animate-fade-up delay-100" style={{ padding: "32px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-main)", marginBottom: "24px" }}>Grievance Timeline Updates</h2>
            <div role="list" aria-label="Complaint progress history">
              {complaint.timeline?.map((entry: { status: string; note: string; timestamp: string }, i: number) => {
                const isLast = i === complaint.timeline.length - 1;
                return (
                  <div key={i} className="track-step" role="listitem" aria-label={`${STATUS_LABELS[entry.status] || entry.status}: ${entry.note}`}>
                    <div className={`track-icon-wrapper ${isLast ? "active" : "completed"}`} aria-hidden="true">
                      {isLast ? <Activity size={12} /> : <Check size={12} style={{ strokeWidth: 3 }} />}
                    </div>
                    <div style={{ flex: 1, paddingTop: "2px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px", gap: "10px" }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
                          {STATUS_LABELS[entry.status] || entry.status}
                        </p>
                        <time dateTime={entry.timestamp} style={{ fontSize: "12px", color: "var(--text-light)", fontWeight: 500 }}>
                          {new Date(entry.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </time>
                      </div>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>{entry.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
