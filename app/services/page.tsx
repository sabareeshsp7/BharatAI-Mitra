"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/app/components/layout/Navbar";
import { SkeletonGrid } from "@/app/components/ui/SkeletonLoader";
import { showToast } from "@/app/components/ui/Toast";
import { useSession } from "@/hooks/useSession";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Building,
  Activity,
  FileSpreadsheet,
  User,
  CreditCard,
  CheckCircle2,
  HelpCircle,
  Search,
  ArrowRight,
  Info,
  Clock,
  X,
  Check,
} from "@/app/components/ui/icons";

interface Service {
  _id: string; name: string; category: string; description: string;
  eligibility: string[]; ministry: string; targetBeneficiaries: string[];
  applicationUrl?: string; helplineNumber?: string; benefitType: string; launchYear?: number;
}
type ChecklistData = {
  documents?: { name: string; description: string; isOptional: boolean; whereToGet: string }[];
  applicationSteps?: string[]; notes?: string[]; estimatedTime?: string; fees?: string;
};

// Map categories to standard Lucide icons
const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  housing:         Building,
  health:          Activity,
  agriculture:     HelpCircle,
  education:       FileSpreadsheet,
  employment:      User,
  finance:         CreditCard,
  "social-security":CheckCircle2,
  digital:         CpuIcon, // Fallback
  other:           HelpCircle,
};

function CpuIcon({ size = 20, ...props }: { size?: number } & React.ComponentProps<"svg">) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
    </svg>
  );
}

const CATEGORY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  housing:         { bg: "#f5f3ff", color: "#4f46e5", border: "#e0e7ff" },
  health:          { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
  agriculture:     { bg: "#fff7ed", color: "#ea580c", border: "#ffedd5" },
  education:       { bg: "#eff6ff", color: "#1d4ed8", border: "#dbeafe" },
  employment:      { bg: "#f0fdfa", color: "#0d9488", border: "#ccfbf1" },
  finance:         { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  "social-security":{ bg: "#f0f9ff", color: "#0284c7", border: "#e0f2fe" },
  digital:         { bg: "#faf5ff", color: "#9333ea", border: "#f3e8ff" },
  other:           { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
};

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "housing",          label: "Housing" },
  { value: "health",           label: "Health" },
  { value: "agriculture",      label: "Agriculture" },
  { value: "education",        label: "Education" },
  { value: "employment",       label: "Employment" },
  { value: "finance",          label: "Finance" },
  { value: "social-security",  label: "Social Security" },
  { value: "digital",          label: "Digital Access" },
];

export default function ServicesPage() {
  const { getSession } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [checklist, setChecklist] = useState<ChecklistData | null>(null);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<{ name: string; reason: string; relevanceScore: number; category: string }[]>([]);
  const [recLoading, setRecLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"documents" | "steps" | "info">("documents");

  const debouncedSearch = useDebounce(search, 350);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (category) params.set("category", category);
      params.set("limit", "12");
      const res = await fetch(`/api/services?${params}`);
      const data = await res.json();
      setServices(data.services || []);
      setTotal(data.pagination?.total || 0);
    } catch { showToast({ message: "Failed to load schemes.", type: "error" }); }
    finally { setLoading(false); }
  }, [debouncedSearch, category]);

  const fetchRecommendations = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/recommend-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSession() }),
      });
      const data = await res.json();
      setRecommendations(data.recommendations?.slice(0, 5) || []);
    } catch { /* silently fail */ }
    finally { setRecLoading(false); }
  }, [getSession]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchServices(); }, [fetchServices]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchRecommendations(); }, [fetchRecommendations]);

  const fetchChecklist = useCallback(async (service: Service) => {
    setSelectedService(service);
    setChecklist(null);
    setChecklistLoading(true);
    setActiveTab("documents");
    try {
      const res = await fetch("/api/ai/document-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service._id, language: "en" }),
      });
      const data = await res.json();
      setChecklist(data.checklist);
    } catch { showToast({ message: "Failed to load document checklist.", type: "error" }); }
    finally { setChecklistLoading(false); }
  }, []);

  const catStyle = (cat: string) => CATEGORY_COLORS[cat] || CATEGORY_COLORS.other;

  return (
    <>
      <Navbar />
      <main id="main-content" style={{ minHeight: "calc(100vh - 64px)", background: "var(--neutral-bg)", padding: "48px 24px 80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

          {/* Page Header */}
          <div className="animate-fade-up" style={{ marginBottom: "40px", textAlign: "center" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", marginBottom: "8px" }}>
              Government Schemes Directory
            </h1>
            <p style={{ fontSize: "15px", color: "var(--text-light)", maxWidth: "560px", margin: "0 auto" }}>
              Explore major social benefits, housing schemes, and scholarship programs. Query requirements and generate step-by-step checklist forms.
            </p>
          </div>

          {/* AI Recommended horizontal track */}
          {(recLoading || recommendations.length > 0) && (
            <section aria-label="AI scheme recommendations" style={{ marginBottom: "40px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Personalized AI Suggestions
                </h2>
                <span className="ui-badge ui-badge-primary">Ensemble Profile Matching</span>
              </div>
              <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "12px" }}>
                {recLoading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="ui-skeleton" style={{ width: "260px", height: "130px", flexShrink: 0, borderRadius: "var(--radius-lg)" }} aria-label="Loading suggestions" aria-busy="true" />
                    ))
                  : recommendations.map((rec, i) => {
                      const cs = catStyle(rec.category);
                      const RecIcon = CATEGORY_ICONS[rec.category] || HelpCircle;
                      return (
                        <div
                          key={i}
                          className={`ui-card animate-fade-up`}
                          style={{
                            background: "var(--surface)", border: `1px solid ${cs.border}`,
                            borderRadius: "var(--radius-lg)", padding: "20px",
                            minWidth: "280px", width: "280px", flexShrink: 0,
                            display: "flex", flexDirection: "column",
                            justifyContent: "space-between",
                          }}
                          role="article"
                          aria-label={`Suggestion: ${rec.name}`}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                              <div style={{ background: cs.bg, color: cs.color, width: "28px", height: "28px", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <RecIcon size={14} />
                              </div>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: cs.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                {rec.category}
                              </span>
                            </div>
                            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px", lineHeight: 1.4 }} className="line-clamp-2">
                              {rec.name}
                            </h3>
                            <p style={{ fontSize: "12px", color: "var(--text-light)", lineHeight: 1.4, marginBottom: "14px" }} className="line-clamp-2">
                              {rec.reason}
                            </p>
                          </div>

                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <span style={{ fontSize: "11px", color: "var(--text-light)", fontWeight: 600 }}>Relevance Profile Match</span>
                              <span style={{ fontSize: "11px", color: cs.color, fontWeight: 700 }}>{rec.relevanceScore}%</span>
                            </div>
                            <div style={{ background: "var(--neutral-bg)", borderRadius: "100px", height: "6px", overflow: "hidden", border: "1px solid var(--border)" }} role="meter" aria-valuenow={rec.relevanceScore} aria-valuemin={0} aria-valuemax={100} aria-label={`Match score ${rec.relevanceScore} percent`}>
                              <div style={{ background: cs.color, height: "100%", width: `${rec.relevanceScore}%`, borderRadius: "100px", transition: "width 1s ease" }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
              </div>
            </section>
          )}

          {/* Search controls */}
          <div className="animate-fade-up" style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, position: "relative", minWidth: "260px" }}>
              <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search database by keyword... (e.g. ration, resident, widow, support)"
                aria-label="Search schemes database"
                className="ui-input"
                style={{ paddingLeft: "42px", height: "46px" }}
              />
            </div>
            <label htmlFor="category-select" className="sr-only">Filter by category</label>
            <select
              id="category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter schemes by category"
              className="ui-input ui-select"
              style={{ width: "200px", height: "46px" }}
            >
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <p style={{ fontSize: "14px", color: "var(--text-light)", marginBottom: "20px", fontWeight: 500 }} aria-live="polite" aria-atomic="true">
            {loading ? "Searching..." : `${total} matching scheme${total !== 1 ? "s" : ""} found`}
          </p>

          {/* Grid list */}
          {loading ? (
            <SkeletonGrid count={6} columns={3} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {services.map((service) => {
                const cs = catStyle(service.category);
                const ItemIcon = CATEGORY_ICONS[service.category] || HelpCircle;
                return (
                  <article
                    key={service._id}
                    className="ui-card animate-fade-up"
                    style={{ display: "flex", flexDirection: "column", height: "100%" }}
                  >
                    <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                        <div style={{ background: cs.bg, color: cs.color, width: "40px", height: "40px", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${cs.border}` }}>
                          <ItemIcon size={20} />
                        </div>
                        <span className="ui-badge" style={{ background: cs.bg, color: cs.color, borderColor: cs.border }}>
                          {service.category}
                        </span>
                      </div>

                      <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-main)", marginBottom: "8px", lineHeight: 1.4 }}>
                        {service.name}
                      </h3>
                      <p style={{ fontSize: "13.5px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "16px", flex: 1 }} className="line-clamp-3">
                        {service.description}
                      </p>

                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px", marginTop: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", fontSize: "12px", color: "var(--text-light)", fontWeight: 500 }}>
                          <span>{service.ministry}</span>
                          {service.helplineNumber && <span style={{ color: "var(--success)" }}>Helpline: {service.helplineNumber}</span>}
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            onClick={() => fetchChecklist(service)}
                            className="ui-btn ui-btn-primary ui-btn-sm"
                            style={{ flex: 1 }}
                            aria-label={`View requirements for ${service.name}`}
                          >
                            <span>Requirements</span>
                          </button>
                          {service.applicationUrl && (
                            <a
                              href={service.applicationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ui-btn ui-btn-secondary ui-btn-sm"
                              style={{ flex: 1, textDecoration: "none" }}
                              aria-label={`Go to official application for ${service.name}`}
                            >
                              <span>Official Site</span>
                              <ArrowRight size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && services.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-light)" }}>
              <HelpCircle size={48} style={{ margin: "0 auto 16px", strokeWidth: 1.5 }} />
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px" }}>No matched schemes</h2>
              <p style={{ fontSize: "14px" }}>Modify your query terms or selection filters.</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal dialog */}
      {selectedService && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) { setSelectedService(null); setChecklist(null); } }}
        >
          <div className="modal-content">
            
            {/* Header */}
            <div style={{ padding: "24px 24px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", borderBottom: "1px solid var(--border)" }}>
              <div>
                <h2 id="modal-title" style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.01em" }}>
                  {selectedService.name}
                </h2>
                <p style={{ fontSize: "12px", color: "var(--text-light)", marginTop: "4px", fontWeight: 500 }}>
                  Assisted requirements index compiled via AI
                </p>
              </div>
              <button
                onClick={() => { setSelectedService(null); setChecklist(null); }}
                aria-label="Close details"
                className="ui-btn ui-btn-secondary"
                style={{ width: "32px", height: "32px", padding: 0, borderRadius: "50%", minWidth: "auto" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Tab links */}
            <div style={{ padding: "0 24px", background: "var(--neutral-bg)", borderBottom: "1px solid var(--border)" }}>
              <div role="tablist" style={{ display: "flex", gap: "4px" }}>
                {(["documents", "steps", "info"] as const).map((tab) => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "14px 16px", fontSize: "13px", fontWeight: 700,
                      border: "none", background: "none", cursor: "pointer",
                      borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
                      color: activeTab === tab ? "var(--primary)" : "var(--text-light)",
                      textTransform: "capitalize",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tab === "documents" ? "Documents Checklist" : tab === "steps" ? "Execution Steps" : "General Info"}
                  </button>
                ))}
              </div>
            </div>

            {/* Panel details */}
            <div role="tabpanel" style={{ padding: "24px", overflowY: "auto", maxHeight: "50vh" }}>
              {checklistLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ textAlign: "center", padding: "16px", color: "var(--text-light)", fontSize: "14px", fontWeight: 500 }}>
                    Analyzing scheme requirements file...
                  </div>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="ui-skeleton" style={{ height: "64px", borderRadius: "var(--radius-md)" }} aria-busy="true" />
                  ))}
                </div>
              ) : checklist ? (
                <>
                  {activeTab === "documents" && (
                    <div role="list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {checklist.documents?.map((doc, i) => (
                        <div
                          key={i}
                          role="listitem"
                          style={{
                            padding: "16px", borderRadius: "var(--radius-md)",
                            border: doc.isOptional ? "1px dashed var(--border)" : "1px solid var(--border)",
                            background: doc.isOptional ? "var(--neutral-bg)" : "var(--surface)",
                            display: "flex",
                            gap: "12px",
                            alignItems: "flex-start"
                          }}
                        >
                          <div style={{ 
                            color: doc.isOptional ? "var(--text-light)" : "var(--success)", 
                            background: doc.isOptional ? "var(--neutral-bg)" : "var(--success-bg)",
                            width: "22px", height: "22px", borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, marginTop: "2px",
                            border: `1px solid ${doc.isOptional ? "var(--border)" : "var(--success-border)"}`
                          }}>
                            {doc.isOptional ? <Info size={12} /> : <Check size={12} style={{ strokeWidth: 3 }} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>{doc.name}</span>
                              {doc.isOptional && <span className="ui-badge ui-badge-neutral" style={{ fontSize: "9px", padding: "1px 6px" }}>Optional</span>}
                            </div>
                            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "6px" }}>{doc.description}</p>
                            <p style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 700 }}>Source: {doc.whereToGet}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "steps" && checklist.applicationSteps && (
                    <ol role="list" style={{ display: "flex", flexDirection: "column", gap: "14px", padding: 0, listStyle: "none" }}>
                      {checklist.applicationSteps.map((step, i) => (
                        <li key={i} role="listitem" style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                          <span style={{ 
                            width: "24px", height: "24px", borderRadius: "50%", 
                            background: "var(--primary-subtle)", color: "var(--primary)", 
                            display: "flex", alignItems: "center", justifyContent: "center", 
                            fontSize: "12px", fontWeight: 800, flexShrink: 0,
                            border: "1px solid var(--primary-light)"
                          }}>
                            {i + 1}
                          </span>
                          <p style={{ fontSize: "13.5px", color: "var(--text-muted)", lineHeight: 1.6, paddingTop: "2px" }}>{step}</p>
                        </li>
                      ))}
                    </ol>
                  )}

                  {activeTab === "info" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        {[
                          { label: "Estimated Time", value: checklist.estimatedTime, icon: Clock },
                          { label: "Required Fees", value: checklist.fees, icon: CreditCard },
                        ].filter(x => x.value).map((item) => {
                          const InfoIcon = item.icon;
                          return (
                            <div key={item.label} style={{ background: "var(--neutral-bg)", borderRadius: "var(--radius-md)", padding: "16px", border: "1px solid var(--border)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                                <InfoIcon size={14} style={{ color: "var(--text-light)" }} />
                                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
                              </div>
                              <p style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-main)" }}>{item.value}</p>
                            </div>
                          );
                        })}
                      </div>

                      {checklist.notes?.map((note, i) => (
                        <div key={i} style={{ background: "var(--warning-bg)", border: "1px solid var(--warning-border)", borderRadius: "var(--radius-md)", padding: "14px 16px", display: "flex", gap: "10px" }}>
                          <Info size={16} style={{ color: "var(--warning)", flexShrink: 0, marginTop: "2px" }} />
                          <p style={{ fontSize: "13px", color: "var(--warning)", fontWeight: 600, lineHeight: 1.5 }}>{note}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "16px", color: "var(--text-light)" }}>
                  No extra data resolved.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
