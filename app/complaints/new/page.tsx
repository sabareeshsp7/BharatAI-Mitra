"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/app/components/layout/Navbar";
import { Spinner } from "@/app/components/ui/SkeletonLoader";
import { showToast } from "@/app/components/ui/Toast";
import { useSession } from "@/hooks/useSession";
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  Check,
  ChevronRight,
  Info,
  Search,
} from "@/app/components/ui/icons";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry",
];

type Step = "describe" | "preview" | "location" | "done";

interface AIAnalysis {
  category: string; subCategory: string; severity: string;
  formalDescription: string; suggestedDepartment: string;
  isAiGenerated?: boolean; imageInsights?: string;
  ensemble: { confidence: string; agreedBy: string[]; modelsAgreed: boolean };
}
interface SubmittedComplaint {
  complaintId: string; category: string; severity: string; status: string;
  formalDescription: string; suggestedDepartment: string; aiConfidence: string;
}

const SEVERITY_STYLES: Record<string, { badgeClass: string; icon: React.ComponentType<React.ComponentProps<"svg">> }> = {
  critical: { badgeClass: "ui-badge-danger", icon: AlertCircle },
  high:     { badgeClass: "ui-badge-warning", icon: AlertCircle },
  medium:   { badgeClass: "ui-badge-warning", icon: Info },
  low:      { badgeClass: "ui-badge-success", icon: CheckCircle2 },
};

const STEPS = [
  { id: "describe", label: "Describe Issue",  num: 1 },
  { id: "preview",  label: "AI Analysis",     num: 2 },
  { id: "location", label: "Add Location",    num: 3 },
  { id: "done",     label: "Submitted",        num: 4 },
];

export default function NewComplaintPage() {
  const { getSession } = useSession();
  const [step, setStep] = useState<Step>("describe");
  const [description, setDescription] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [submitted, setSubmitted] = useState<SubmittedComplaint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imageMimeType, setImageMimeType] = useState<string>("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreviewUrl(result);
        const [meta, base64Data] = result.split(",");
        const mime = meta.split(";")[0].replace("data:", "");
        
        // Client-side compression
        const img = new Image();
        img.src = result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 800;
          let width = img.width;
          let height = img.height;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setImageBase64(compressedDataUrl.split(",")[1]);
          setImageMimeType("image/jpeg");
        };
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const analyzeComplaint = useCallback(async () => {
    if (description.trim().length < 10) {
      showToast({ message: "Please describe the issue in at least 10 characters.", type: "error" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/categorize-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, imageBase64, imageMimeType }),
      });
      const data = await res.json();
      setAiAnalysis({ ...data.analysis, ensemble: data.ensemble });
      setStep("preview");
    } catch {
      showToast({ message: "AI analysis failed. Please try again.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [description]);

  const submitComplaint = useCallback(async () => {
    if (!state || !district || !address) {
      showToast({ message: "Please fill all location fields.", type: "error" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description, sessionId: getSession(),
          location: { state, district, address }, language: "en", mediaUrls: [],
          imageBase64, imageMimeType,
          isAiGeneratedPhoto: aiAnalysis?.isAiGenerated,
          imageInsights: aiAnalysis?.imageInsights
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSubmitted(data.complaint);
      setStep("done");
      showToast({ message: "Complaint submitted successfully!", type: "success" });
    } catch (err) {
      showToast({ message: (err as Error).message || "Submission failed.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [state, district, address, description, getSession]);

  const sev = aiAnalysis?.severity ? SEVERITY_STYLES[aiAnalysis.severity] : null;

  return (
    <>
      <Navbar />
      <main id="main-content" style={{ minHeight: "calc(100vh - 64px)", background: "var(--neutral-bg)", padding: "48px 24px 80px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>

          {/* Page Header */}
          <div className="animate-fade-up" style={{ marginBottom: "40px", textAlign: "center" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", marginBottom: "8px" }}>
              Report a Civic Issue
            </h1>
            <p style={{ fontSize: "15px", color: "var(--text-light)", maxWidth: "480px", margin: "0 auto" }}>
              File an official complaint with local authorities using ensembled AI logic to verify, summarize, and route automatically.
            </p>
          </div>

          {/* Wizard Tracker */}
          {step !== "done" && (
            <div className="ui-card animate-fade-up delay-50" style={{ padding: "24px", marginBottom: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }} role="list" aria-label="Progress steps">
                {STEPS.filter(s => s.id !== "done").map((s, i) => {
                  const num = STEPS.findIndex(x => x.id === step) + 1;
                  const isDone = s.num < num;
                  const isActive = s.num === num;
                  return (
                    <div key={s.id} role="listitem" className="wizard-step">
                      <div className={`wizard-indicator ${isActive ? "active" : isDone ? "completed" : ""}`}>
                        {isDone ? <Check size={14} style={{ strokeWidth: 3 }} /> : s.num}
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: isActive ? "var(--primary)" : isDone ? "var(--success)" : "var(--text-light)", marginTop: "8px", whiteSpace: "nowrap" }}>
                        {s.label}
                      </span>
                      {i < 2 && (
                        <div className={`wizard-line ${isDone ? "active" : ""}`} aria-hidden="true" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 1: Describe ──────────────────────────────────── */}
          {step === "describe" && (
            <div className="ui-card animate-fade-up delay-100" style={{ padding: "32px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-main)", marginBottom: "8px", letterSpacing: "-0.01em" }}>
                Describe the Incident
              </h2>
              <p style={{ fontSize: "14px", color: "var(--text-light)", marginBottom: "24px" }}>
                Provide details about what, when, and where. You may enter text in any regional Indian language.
              </p>

              <label htmlFor="complaint-description" style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>
                Issue Description <span aria-hidden="true" style={{ color: "var(--danger)" }}>*</span>
              </label>
              <textarea
                id="complaint-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Describe the issue. (e.g., Water logging in Sector 3 area after rains, causing blocked passage and traffic delays.)"
                aria-required="true"
                aria-describedby="desc-hint"
                style={{
                  width: "100%", padding: "14px 16px",
                  border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                  fontSize: "14px", color: "var(--text-main)", lineHeight: 1.6,
                  resize: "vertical", outline: "none", fontFamily: "inherit",
                  transition: "all 0.2s ease",
                  background: "var(--surface)",
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.15)"; }}
                onBlur={(e)  => { e.target.style.borderColor = "var(--border)";       e.target.style.boxShadow = "none"; }}
              />
              <div id="desc-hint" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-light)" }}>
                  Minimum 10 characters required.
                </span>
                <span style={{ fontSize: "12px", color: description.length < 10 ? "var(--danger)" : "var(--text-light)", fontWeight: 700 }}>
                  {description.length} characters
                </span>
              </div>

              <div style={{ marginTop: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>
                  Attach Photo (Optional)
                </label>
                <div style={{ 
                  border: "2px dashed var(--border)", borderRadius: "var(--radius-md)", 
                  padding: imagePreviewUrl ? "16px" : "32px", textAlign: "center",
                  background: "var(--neutral-bg)", cursor: "pointer", transition: "all 0.2s ease",
                  position: "relative"
                }}>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} />
                  {imagePreviewUrl ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <img src={imagePreviewUrl} alt="Preview" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px" }} />
                      <div style={{ textAlign: "left", flex: 1 }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>{imageFile?.name}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-light)" }}>Click or drag to change image</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--surface)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                        <Info size={18} style={{ color: "var(--primary)" }} />
                      </div>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>Upload evidence photo</p>
                      <p style={{ fontSize: "12px", color: "var(--text-light)" }}>PNG, JPG up to 10MB</p>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={analyzeComplaint}
                disabled={isLoading || description.length < 10}
                className="ui-btn ui-btn-primary ui-btn-lg"
                aria-label="Analyze complaint with AI"
                style={{ width: "100%", marginTop: "24px" }}
              >
                {isLoading ? (
                  <>
                    <Spinner size={16} color="white" />
                    <span>Analyzing with Ensemble logic…</span>
                  </>
                ) : (
                  <>
                    <Cpu size={16} />
                    <span>Analyze with Ensemble AI</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Step 2: AI Preview ────────────────────────────────── */}
          {step === "preview" && aiAnalysis && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              <div className="ui-card animate-scale-in" style={{ padding: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "10px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px", letterSpacing: "-0.01em" }}>
                    <Cpu size={20} style={{ color: "var(--primary)" }} />
                    <span>Ensemble Verification Summary</span>
                  </h2>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {aiAnalysis.ensemble?.confidence && (
                      <span className={`ui-badge ${aiAnalysis.ensemble.confidence === "HIGH" ? "ui-badge-success" : "ui-badge-warning"}`}>
                        {aiAnalysis.ensemble.confidence} Confidence
                      </span>
                    )}
                    {aiAnalysis.ensemble?.modelsAgreed && (
                      <span className="ui-badge ui-badge-success">Consensus Verified</span>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                  {[
                    { label: "AI Suggested Category", value: aiAnalysis.category?.replace(/-/g, " "), cap: true },
                    { label: "AI Suggested Sub-category", value: aiAnalysis.subCategory },
                    { label: "Target Routing Department", value: aiAnalysis.suggestedDepartment, full: true },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{ background: "var(--neutral-bg)", borderRadius: "var(--radius-md)", padding: "14px 16px", border: "1px solid var(--border)", gridColumn: item.full ? "1 / -1" : undefined }}
                    >
                      <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                        {item.label}
                      </p>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", textTransform: item.cap ? "capitalize" : undefined }}>
                        {item.value}
                      </p>
                    </div>
                  ))}

                  {/* Severity level */}
                  <div style={{ background: "var(--neutral-bg)", borderRadius: "var(--radius-md)", padding: "14px 16px", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                      Assessed Severity
                    </p>
                    <p style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                      {sev && <span className={`ui-badge ${sev.badgeClass}`} style={{ padding: "2px 8px" }}>{aiAnalysis.severity?.toUpperCase()}</span>}
                    </p>
                  </div>
                </div>

                {/* Formatted official translation/summary */}
                <div style={{ background: "var(--primary-subtle)", border: "1px solid var(--primary-light)", borderRadius: "var(--radius-md)", padding: "20px", marginBottom: "24px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Formal Complaint Synopsis (AI Generated)
                  </p>
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.65 }}>
                    {aiAnalysis.formalDescription}
                  </p>
                </div>
                
                {/* Image Insights & Fraud Detection */}
                {aiAnalysis.imageInsights && (
                  <div style={{ 
                    background: aiAnalysis.isAiGenerated ? "var(--danger-bg)" : "var(--success-bg)", 
                    border: `1px solid ${aiAnalysis.isAiGenerated ? "var(--danger-border)" : "var(--success-border)"}`, 
                    borderRadius: "var(--radius-md)", padding: "20px", marginBottom: "24px",
                    display: "flex", gap: "16px", alignItems: "flex-start"
                  }}>
                    <div style={{ flexShrink: 0, marginTop: "2px", color: aiAnalysis.isAiGenerated ? "var(--danger)" : "var(--success)" }}>
                      {aiAnalysis.isAiGenerated ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                    </div>
                    <div>
                      <p style={{ 
                        fontSize: "11px", fontWeight: 700, 
                        color: aiAnalysis.isAiGenerated ? "var(--danger)" : "var(--success)", 
                        marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em",
                        display: "flex", alignItems: "center", gap: "6px"
                      }}>
                        Gemini Image Verification 
                        {aiAnalysis.isAiGenerated && <span className="ui-badge ui-badge-danger" style={{ fontSize: "10px", padding: "2px 6px" }}>FAKE DETECTED</span>}
                      </p>
                      <p style={{ fontSize: "14px", color: "var(--text-main)", lineHeight: 1.6 }}>
                        {aiAnalysis.imageInsights}
                      </p>
                      {aiAnalysis.isAiGenerated && (
                        <p style={{ fontSize: "12px", color: "var(--danger)", marginTop: "8px", fontWeight: 600 }}>
                          Warning: This image appears to be digitally altered or AI-generated. The complaint may be subject to manual review.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Model pipeline summary */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-light)", fontWeight: 600 }}>Active Agents:</span>
                  {aiAnalysis.ensemble?.agreedBy?.map((model) => (
                    <span key={model} className="ui-badge ui-badge-neutral">
                      {model}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => setStep("describe")} className="ui-btn ui-btn-secondary" aria-label="Edit description" style={{ flex: 1 }}>
                  Edit Draft
                </button>
                <button onClick={() => setStep("location")} className="ui-btn ui-btn-primary ui-btn-lg" aria-label="Proceed to add location" style={{ flex: 2 }}>
                  <span>Proceed to Location</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Location ──────────────────────────────────── */}
          {step === "location" && (
            <div className="ui-card animate-slide-right" style={{ padding: "32px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-main)", marginBottom: "8px", letterSpacing: "-0.01em" }}>
                📍 Specify Location
              </h2>
              <p style={{ fontSize: "14px", color: "var(--text-light)", marginBottom: "28px" }}>
                Identify the state, district, and exact street address to dispatch this complaint.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label htmlFor="state-select" style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>
                    State <span aria-hidden="true" style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <select id="state-select" value={state} onChange={(e) => setState(e.target.value)} className="ui-input ui-select" aria-required="true">
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="district-input" style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>
                    District <span aria-hidden="true" style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input id="district-input" type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g., Nagpur, Coimbatore, Vadodara" className="ui-input" aria-required="true" />
                </div>

                <div>
                  <label htmlFor="address-input" style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>
                    Street Address / Landmark <span aria-hidden="true" style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input id="address-input" type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g., Near Post Office, Sector 4 Main Road" className="ui-input" aria-required="true" />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                <button onClick={() => setStep("preview")} className="ui-btn ui-btn-secondary" aria-label="Back to preview">
                  Back
                </button>
                <button onClick={submitComplaint} disabled={isLoading || !state || !district || !address} className="ui-btn ui-btn-primary ui-btn-lg" aria-label="Submit complaint to database" style={{ flex: 1 }}>
                  {isLoading ? (
                    <>
                      <Spinner size={16} color="white" />
                      <span>Filing Complaint…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>File Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Done ─────────────────────────────────────── */}
          {step === "done" && submitted && (
            <div className="ui-card animate-pop-in" style={{ padding: "48px 40px", textAlign: "center" }}>
              <div style={{ 
                width: "64px", 
                height: "64px", 
                borderRadius: "50%", 
                background: "var(--success-bg)", 
                color: "var(--success)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
                border: "1px solid var(--success-border)"
              }} aria-hidden="true">
                <CheckCircle2 size={32} />
              </div>
              <h2 style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em", marginBottom: "8px" }}>
                Complaint Registered
              </h2>
              <p style={{ fontSize: "14.5px", color: "var(--text-light)", maxWidth: "480px", margin: "0 auto 32px", lineHeight: 1.6 }}>
                Your ticket has been recorded and scheduled for dispatch to public grievance systems.
              </p>

              <div style={{ background: "var(--neutral-bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: "32px" }}>
                <p style={{ fontSize: "11px", color: "var(--text-light)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                  Assigned Complaint ID
                </p>
                <p className="font-mono-id" style={{ fontSize: "30px", fontWeight: 800, color: "var(--primary)", letterSpacing: "0.05em" }}>
                  {submitted.complaintId}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-light)", marginTop: "6px" }}>
                  Make a note of this code to monitor status checks.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "36px" }}>
                {[
                  { label: "Category", value: submitted.category?.replace(/-/g, " ") },
                  { label: "AI Verification", value: `${submitted.aiConfidence} Match` },
                  { label: "Official Status", value: submitted.status },
                  { label: "Assessed Level", value: submitted.severity?.toUpperCase() },
                ].map((item) => (
                  <div key={item.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 14px", textAlign: "left" }}>
                    <p style={{ fontSize: "10px", color: "var(--text-light)", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>{item.label}</p>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", textTransform: "capitalize" }}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <Link href={`/complaints/track?id=${submitted.complaintId}`} className="ui-btn ui-btn-primary" style={{ flex: 1, textDecoration: "none" }} aria-label="Track complaint status">
                  <Search size={16} />
                  <span>Track Status</span>
                </Link>
                <button onClick={() => { setStep("describe"); setDescription(""); setDistrict(""); setAddress(""); }} className="ui-btn ui-btn-secondary" style={{ flex: 1 }} aria-label="File another issue">
                  File Another
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
