"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/app/components/layout/Navbar";
import { Spinner } from "@/app/components/ui/SkeletonLoader";
import { showToast } from "@/app/components/ui/Toast";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Building,
  Activity,
  Calendar,
  MapPin,
  Clock,
  Info,
  ChevronRight,
} from "@/app/components/ui/icons";

interface ComplaintData {
  complaintId: string; category: string; subCategory: string;
  severity: string; status: string; formalDescription: string;
  suggestedDepartment: string; aiCategoryConfidence: string;
  originalLanguage: string; location: { state: string; district: string; address: string };
  timeline?: { status: string; note: string; timestamp: string }[];
  createdAt: string; updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; badgeClass: string }> = {
  submitted:     { label: "Submitted",    icon: Info, color: "var(--warning)", badgeClass: "ui-badge-warning" },
  acknowledged:  { label: "Acknowledged", icon: Activity, color: "var(--info)", badgeClass: "ui-badge-info" },
  in_progress:   { label: "In Progress",  icon: Clock, color: "var(--primary)", badgeClass: "ui-badge-primary" },
  resolved:      { label: "Resolved",     icon: CheckCircle2, color: "var(--success)", badgeClass: "ui-badge-success" },
  closed:        { label: "Closed",       icon: CheckCircle2, color: "var(--text-light)", badgeClass: "ui-badge-neutral" },
};

const SEVERITY_STYLES: Record<string, { bgClass: string; color: string }> = {
  critical: { bgClass: "ui-badge-danger", color: "var(--danger)" },
  high:     { bgClass: "ui-badge-warning", color: "var(--warning)" },
  medium:   { bgClass: "ui-badge-warning", color: "var(--warning)" },
  low:      { bgClass: "ui-badge-success", color: "var(--success)" },
};

export default function TrackPage() {
  const [complaintId, setComplaintId] = useState("");
  const [loading, setLoading] = useState(false);
  const [complaint, setComplaint] = useState<ComplaintData | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleTrack = useCallback(async () => {
    const id = complaintId.trim().toUpperCase();
    if (!id.startsWith("BM-")) {
      showToast({ message: "Complaint ID must start with BM- (e.g., BM-2026-ABC12)", type: "error" });
      return;
    }
    setLoading(true);
    setNotFound(false);
    setComplaint(null);
    try {
      const res = await fetch(`/api/complaints/${id}`);
      if (res.status === 404) { setNotFound(true); return; }
      const data = await res.json();
      setComplaint(data.complaint);
    } catch { showToast({ message: "Failed to fetch complaint. Please try again.", type: "error" }); }
    finally { setLoading(false); }
  }, [complaintId]);

  const statusInfo = complaint ? (STATUS_CONFIG[complaint.status] || STATUS_CONFIG.submitted) : null;
  const StatusIcon = statusInfo ? statusInfo.icon : Info;
  const sevStyle = complaint ? (SEVERITY_STYLES[complaint.severity] || SEVERITY_STYLES.low) : null;

  return (
    <>
      <Navbar />
      <main id="main-content" style={{ minHeight: "calc(100vh - 64px)", background: "var(--neutral-bg)", padding: "48px 24px 80px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>

          {/* Header */}
          <div className="animate-fade-up" style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", marginBottom: "8px" }}>
              Track Civic Grievance
            </h1>
            <p style={{ fontSize: "15px", color: "var(--text-light)", maxWidth: "480px", margin: "0 auto" }}>
              Enter your assigned complaint code to verify real-time status updates and department execution schedules.
            </p>
          </div>

          {/* Search Card */}
          <div className="ui-card animate-fade-up delay-100" style={{ padding: "32px", marginBottom: "28px" }}>
            <label htmlFor="complaint-id-input" style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>
              Registered Complaint ID
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
              <input
                id="complaint-id-input"
                type="text"
                value={complaintId}
                onChange={(e) => setComplaintId(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                placeholder="BM-2026-XXXXX"
                aria-label="Enter your complaint ID"
                aria-describedby="complaint-id-hint"
                className="ui-input font-mono-id"
                style={{ flex: 1, fontSize: "16px", letterSpacing: "0.05em", textAlign: "center", height: "46px" }}
                autoComplete="off"
                spellCheck="false"
              />
              <button
                onClick={handleTrack}
                disabled={loading || complaintId.length < 5}
                className="ui-btn ui-btn-primary"
                aria-label="Search grievance log"
                style={{ flexShrink: 0, height: "46px", padding: "0 20px" }}
              >
                {loading ? <Spinner size={16} color="white" /> : <Search size={16} />}
              </button>
            </div>
            <p id="complaint-id-hint" style={{ fontSize: "12px", color: "var(--text-light)", marginTop: "10px", textAlign: "center" }}>
              Assigned identifier format: <code className="font-mono-id">BM-2026-XXXXX</code>
            </p>
          </div>

          {/* Not Found */}
          {notFound && (
            <div className="ui-card animate-scale-in" style={{ padding: "48px 32px", textAlign: "center" }}>
              <AlertCircle size={40} style={{ color: "var(--danger)", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-main)", marginBottom: "8px" }}>Log Entry Not Found</h2>
              <p style={{ fontSize: "14px", color: "var(--text-light)", marginBottom: "24px" }}>
                We could not locate any records for complaint ID <code className="font-mono-id" style={{ color: "var(--primary)", fontWeight: 700 }}>{complaintId}</code>.
              </p>
              <Link href="/complaints/new" className="ui-btn ui-btn-primary" style={{ textDecoration: "none" }}>
                File a New Ticket
              </Link>
            </div>
          )}

          {/* Complaint Result */}
          {complaint && statusInfo && sevStyle && (
            <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Status Header */}
              <div className="ui-card" style={{ padding: "0", overflow: "hidden" }}>
                <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Grievance Log Record</span>
                    <p className="font-mono-id" style={{ fontSize: "22px", fontWeight: 800, color: "var(--primary)" }}>{complaint.complaintId}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className={`ui-badge ${statusInfo.badgeClass}`} style={{ padding: "6px 14px" }}>
                      <StatusIcon size={12} />
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="ui-card" style={{ padding: "28px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-main)", marginBottom: "20px" }}>Grievance Parameters</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                  {[
                    { label: "Category", value: complaint.category?.replace(/-/g, " ") },
                    { label: "Sub-category", value: complaint.subCategory },
                    { label: "Severity Level", value: complaint.severity?.toUpperCase(), sev: true },
                    { label: "AI Verification Confidence", value: `${complaint.aiCategoryConfidence} confidence` },
                    { label: "Routed Department", value: complaint.suggestedDepartment, full: true },
                    { label: "Verified Dispatch Address", value: `${complaint.location?.address}, ${complaint.location?.district}, ${complaint.location?.state}`, full: true },
                  ].map((item) => (
                    <div key={item.label} style={{ gridColumn: item.full ? "1 / -1" : undefined, background: "var(--neutral-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                      <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{item.label}</p>
                      <p style={{
                        fontSize: "13.5px", fontWeight: 700, color: "var(--text-main)",
                        textTransform: "capitalize",
                      }}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Synopsis */}
                <div style={{ background: "var(--primary-subtle)", border: "1px solid var(--primary-light)", borderRadius: "var(--radius-md)", padding: "16px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Synoptic Record</p>
                  <p style={{ fontSize: "13.5px", color: "var(--text-muted)", lineHeight: 1.6 }}>{complaint.formalDescription}</p>
                </div>
              </div>

              {/* Timeline */}
              {complaint.timeline && complaint.timeline.length > 0 && (
                <div className="ui-card" style={{ padding: "28px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-main)", marginBottom: "24px" }}>Grievance Operations Timeline</h2>
                  <div role="list" aria-label="Grievance status history">
                    {complaint.timeline.map((item, i) => {
                      const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.submitted;
                      const TimeIcon = st.icon;
                      const isLast = i === complaint.timeline!.length - 1;
                      return (
                        <div key={i} className="track-step" role="listitem" aria-label={`${st.label}: ${item.note}`}>
                          <div className={`track-icon-wrapper ${isLast ? "active" : "completed"}`} aria-hidden="true">
                            <TimeIcon size={12} />
                          </div>
                          <div style={{ flex: 1, paddingTop: "2px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px", gap: "10px" }}>
                              <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>{st.label}</p>
                              <time dateTime={item.timestamp} style={{ fontSize: "12px", color: "var(--text-light)", fontWeight: 500 }}>
                                {new Date(item.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </time>
                            </div>
                            <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>{item.note}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Link href="/complaints/new" className="ui-btn ui-btn-secondary" style={{ textDecoration: "none", justifyContent: "center" }} aria-label="Report another civic issue">
                <span>File Another Ticket</span>
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
