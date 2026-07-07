"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/app/components/layout/Navbar";
import { Spinner } from "@/app/components/ui/SkeletonLoader";
import { showToast } from "@/app/components/ui/Toast";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  ChevronRight,
  ChevronDown,
  Building,
  Check,
  X,
} from "@/app/components/ui/icons";
import type { IComplaint } from "@/models/Complaint.model";

type UIComplaint = Omit<IComplaint, "_id"> & { _id: string };

export default function AdminDashboardPage() {
  const [complaints, setComplaints] = useState<UIComplaint[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, closed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/complaints");
      const data = await res.json();
      if (res.ok) {
        setComplaints(data.complaints);
        setStats(data.stats);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      showToast({ message: "Failed to load admin data", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const updateStatus = async (id: string, newStatus: string, note: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast({ message: `Ticket marked as ${newStatus}`, type: "success" });
      
      // Update local state to reflect changes instantly without full reload
      setComplaints(prev => prev.map(c => c._id === id ? data.complaint : c));
      
      // Minimal recalculation of stats
      setStats(prev => ({
        ...prev,
        pending: newStatus === "acknowledged" ? prev.pending : prev.pending - 1,
        resolved: newStatus === "resolved" ? prev.resolved + 1 : prev.resolved,
        closed: newStatus === "closed" ? prev.closed + 1 : prev.closed,
      }));

    } catch (err) {
      showToast({ message: "Failed to update status", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <span className="ui-badge ui-badge-info">New</span>;
      case "acknowledged":
      case "in_progress":
        return <span className="ui-badge ui-badge-warning">In Progress</span>;
      case "resolved":
        return <span className="ui-badge ui-badge-success">Resolved</span>;
      case "closed":
        return <span className="ui-badge ui-badge-danger">Closed / Rejected</span>;
      default:
        return <span className="ui-badge ui-badge-neutral">{status}</span>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical": return <span className="ui-badge ui-badge-danger" style={{ padding: "2px 6px", fontSize: "10px" }}>CRITICAL</span>;
      case "high": return <span className="ui-badge ui-badge-warning" style={{ padding: "2px 6px", fontSize: "10px" }}>HIGH</span>;
      case "medium": return <span className="ui-badge ui-badge-info" style={{ padding: "2px 6px", fontSize: "10px" }}>MEDIUM</span>;
      default: return <span className="ui-badge ui-badge-success" style={{ padding: "2px 6px", fontSize: "10px" }}>LOW</span>;
    }
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 64px)", background: "var(--neutral-bg)", padding: "40px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
            <div>
              <h1 style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em" }}>
                Admin Operations
              </h1>
              <p style={{ color: "var(--text-light)", marginTop: "4px" }}>
                Triage and manage civic reports automatically categorized by Ensemble AI.
              </p>
            </div>
            <div>
              <button onClick={fetchComplaints} className="ui-btn ui-btn-secondary ui-btn-sm">
                Refresh Data
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "40px" }}>
            <div className="ui-card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", background: "var(--primary-subtle)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={24} />
              </div>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase" }}>Total Reports</p>
                <p style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-main)", lineHeight: 1 }}>{stats.total}</p>
              </div>
            </div>

            <div className="ui-card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", background: "var(--warning-bg)", color: "var(--warning)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={24} />
              </div>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase" }}>Pending Triage</p>
                <p style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-main)", lineHeight: 1 }}>{stats.pending}</p>
              </div>
            </div>

            <div className="ui-card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", background: "var(--success-bg)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase" }}>Resolved</p>
                <p style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-main)", lineHeight: 1 }}>{stats.resolved}</p>
              </div>
            </div>
          </div>

          {/* Table / List */}
          <div className="ui-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-main)" }}>Recent Civic Tickets</h2>
            </div>
            
            {isLoading ? (
              <div style={{ padding: "60px", textAlign: "center", color: "var(--text-light)" }}>
                <Spinner size={32} color="var(--primary)" />
                <p style={{ marginTop: "16px", fontWeight: 600 }}>Loading tickets...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center", color: "var(--text-light)" }}>
                <FileText size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
                <p style={{ fontWeight: 600, fontSize: "16px" }}>No tickets found in the system.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {complaints.map((c) => {
                  const isExpanded = expandedId === c._id;
                  const isActionLoading = actionLoading === c._id;
                  
                  return (
                    <div key={c._id} style={{ borderBottom: "1px solid var(--border)", background: isExpanded ? "var(--neutral-bg)" : "var(--surface)", transition: "background 0.2s" }}>
                      
                      {/* Condensed Row */}
                      <div 
                        onClick={() => setExpandedId(isExpanded ? null : c._id)}
                        style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "2fr 2fr 3fr 1.5fr 1fr", gap: "16px", alignItems: "center", cursor: "pointer" }}
                      >
                        <div>
                          <p className="font-mono-id" style={{ fontSize: "14px", fontWeight: 800, color: "var(--primary)" }}>{c.complaintId}</p>
                          <p style={{ fontSize: "12px", color: "var(--text-light)", marginTop: "4px" }}>
                            {new Date(c.createdAt).toLocaleDateString()} • {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", textTransform: "capitalize" }}>{c.category?.replace("-", " ")}</p>
                          <div style={{ marginTop: "4px" }}>
                            {getSeverityBadge(c.severity)}
                          </div>
                        </div>

                        <div>
                          <p style={{ fontSize: "13px", color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5 }}>
                            {c.originalDescription}
                          </p>
                        </div>

                        <div>
                          {getStatusBadge(c.status)}
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", color: "var(--text-light)" }}>
                          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </div>
                      </div>

                      {/* Expanded Detail View */}
                      {isExpanded && (
                        <div className="animate-fade-up" style={{ padding: "0 24px 24px", borderTop: "1px dashed var(--border)" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "32px", marginTop: "24px" }}>
                            
                            {/* Left Side: Details */}
                            <div>
                              <h3 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--primary)", letterSpacing: "0.05em", marginBottom: "8px" }}>
                                AI Formal Assessment
                              </h3>
                              <p style={{ fontSize: "14px", color: "var(--text-main)", lineHeight: 1.6, background: "var(--surface)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: "20px" }}>
                                {c.formalDescription}
                              </p>

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div style={{ background: "var(--surface)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", marginBottom: "8px" }}>
                                    <MapPin size={16} />
                                    <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Location</span>
                                  </div>
                                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>{c.location.address}</p>
                                  <p style={{ fontSize: "13px", color: "var(--text-light)", marginTop: "2px" }}>{c.location.district}, {c.location.state}</p>
                                </div>
                                <div style={{ background: "var(--surface)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", marginBottom: "8px" }}>
                                    <Building size={16} />
                                    <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>Suggested Dept</span>
                                  </div>
                                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)", textTransform: "capitalize" }}>{c.suggestedDepartment}</p>
                                </div>
                              </div>
                            </div>

                            {/* Right Side: Actions */}
                            <div style={{ background: "var(--surface)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
                              <h3 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "16px" }}>
                                Operator Actions
                              </h3>
                              
                              <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                                {c.status === "submitted" && (
                                  <button 
                                    disabled={isActionLoading}
                                    onClick={() => updateStatus(c._id as string, "acknowledged", "Ticket has been reviewed and acknowledged by the administration.")}
                                    className="ui-btn" 
                                    style={{ background: "var(--primary)", color: "white", justifyContent: "center" }}
                                  >
                                    <Check size={16} /> Accept & Acknowledge
                                  </button>
                                )}
                                
                                {(c.status === "submitted" || c.status === "acknowledged" || c.status === "in_progress") && (
                                  <button 
                                    disabled={isActionLoading}
                                    onClick={() => updateStatus(c._id as string, "resolved", "The issue has been officially resolved by the respective department.")}
                                    className="ui-btn" 
                                    style={{ background: "var(--success)", color: "white", justifyContent: "center" }}
                                  >
                                    <CheckCircle2 size={16} /> Mark as Resolved
                                  </button>
                                )}

                                {(c.status === "submitted" || c.status === "acknowledged") && (
                                  <button 
                                    disabled={isActionLoading}
                                    onClick={() => updateStatus(c._id as string, "closed", "Ticket rejected due to insufficient details or invalid claim.")}
                                    className="ui-btn ui-btn-secondary" 
                                    style={{ color: "var(--danger)", borderColor: "var(--danger-border)", justifyContent: "center" }}
                                  >
                                    <X size={16} /> Reject Ticket
                                  </button>
                                )}

                                {c.status === "resolved" && (
                                  <div style={{ padding: "16px", background: "var(--success-bg)", color: "var(--success)", borderRadius: "var(--radius-sm)", textAlign: "center", fontSize: "13px", fontWeight: 700 }}>
                                    This ticket is fully resolved.
                                  </div>
                                )}
                                {c.status === "closed" && (
                                  <div style={{ padding: "16px", background: "var(--danger-bg)", color: "var(--danger)", borderRadius: "var(--radius-sm)", textAlign: "center", fontSize: "13px", fontWeight: 700 }}>
                                    This ticket was rejected/closed.
                                  </div>
                                )}
                              </div>
                            </div>

                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  );
}
