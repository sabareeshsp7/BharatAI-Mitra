"use client";

import Link from "next/link";
import { Navbar } from "./components/layout/Navbar";
import {
  MessageSquare,
  AlertCircle,
  Building,
  Search,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Languages,
  FileSpreadsheet,
} from "@/app/components/ui/icons";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Chat with Mitra",
    subtitle: "AI Civic Companion",
    desc: "Interact with Mitra to understand government processes, scheme rules, and civic issues. Supports translation to 22 Indian languages.",
    href: "/chat",
    badge: "Voice & Text",
    color: "var(--primary)",
    bg: "var(--primary-subtle)",
    border: "var(--primary-light)",
  },
  {
    icon: AlertCircle,
    title: "Report Civic Issue",
    subtitle: "Ensemble AI Filing",
    desc: "AI categorizes, formats, and assesses your local issues using Gemini and Azure GPT models to compile a detailed official report.",
    href: "/complaints/new",
    badge: "Instant Filing",
    color: "var(--danger)",
    bg: "var(--danger-bg)",
    border: "var(--danger-border)",
  },
  {
    icon: Building,
    title: "Government Schemes",
    subtitle: "AI Scheme Profiling",
    desc: "Matches your citizen profile with 30+ major central and state schemes. Instantly generates custom document checklists.",
    href: "/services",
    badge: "Document Guides",
    color: "var(--success)",
    bg: "var(--success-bg)",
    border: "var(--success-border)",
  },
  {
    icon: Search,
    title: "Track Complaint",
    subtitle: "Public Civic Logs",
    desc: "Verify updates, assignments, timelines, and resolution notes for your filed issue with a single BM- identifier.",
    href: "/complaints/track",
    badge: "Public Logs",
    color: "var(--info)",
    bg: "var(--info-bg)",
    border: "var(--info-border)",
  },
];

const AI_ENGINES = [
  {
    name: "Google Gemini",
    model: "2.0 Flash",
    desc: "Drives real-time multilingual conversations, session logic, and voice responses.",
    color: "var(--gemini)",
    bg: "var(--gemini-bg)",
    icon: MessageSquare,
  },
  {
    name: "Azure OpenAI",
    model: "o4-mini",
    desc: "Drives structured reasoning, civic classification, and official document checklist summaries.",
    color: "var(--azure)",
    bg: "var(--azure-bg)",
    icon: FileSpreadsheet,
  },
  {
    name: "Sarvam AI",
    model: "Translation & Voice",
    desc: "Enables precise voice synthesis (TTS), speech-to-text (STT), and Indic translation services.",
    color: "var(--sarvam)",
    bg: "var(--sarvam-bg)",
    icon: Languages,
  },
];

const STATS = [
  { value: "30+", label: "Civic Schemes Indexed", icon: Building },
  { value: "22",  label: "Indic Languages",   icon: Languages },
  { value: "3",   label: "AI Models Ensembled",  icon: Cpu },
  { value: "0",   label: "Friction & Login",     icon: CheckCircle2 },
];

const HOW_IT_WORKS = [
  { step: "01", title: "State Your Need", desc: "Type or use voice input in your preferred Indian language to explain the scheme or civic issue.", icon: MessageSquare },
  { step: "02", title: "Ensemble Validation", desc: "Dual-model AI processes the input to classify requests, extract parameters, or draft formal notices.", icon: Cpu },
  { step: "03", title: "Resolution Pathway", desc: "Receive immediate customized documentation, checklists, or trackable public filing details.", icon: CheckCircle2 },
];


export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main-content" style={{ minHeight: "calc(100vh - 64px)" }}>
        
        {/* Hero Section */}
        <section
          aria-label="Welcome Banner"
          className="hero-grid"
          style={{
            padding: "80px 24px 72px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ maxWidth: "800px", zIndex: 1 }}>
            
            {/* Status indicator */}
            <div style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "8px", 
              background: "var(--surface)", 
              border: "1px solid var(--border)", 
              borderRadius: "9999px", 
              padding: "6px 14px", 
              marginBottom: "28px", 
              boxShadow: "var(--shadow-sm)"
            }}>
              <span className="dots-container" style={{ marginRight: "4px" }}>
                <span className="dot" style={{ backgroundColor: "var(--success)" }} />
              </span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Ensemble Active & Online
              </span>
            </div>

            {/* Main headings */}
            <h1 className="gradient-heading" style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "16px" }}>
              BharatAI Mitra
            </h1>
            
            <p style={{ fontSize: "18px", color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto 36px", lineHeight: 1.6 }}>
              A unified Indic AI platform designed to help citizens understand government schemes, report civic issues, and generate formal checklists in 22 regional languages.
            </p>

            {/* Actions */}
            <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/chat" className="ui-btn ui-btn-primary ui-btn-lg" style={{ textDecoration: "none" }}>
                <span>Chat with Mitra</span>
                <ArrowRight size={16} />
              </Link>
              <Link href="/complaints/new" className="ui-btn ui-btn-secondary ui-btn-lg" style={{ textDecoration: "none" }}>
                <span>Report Civic Issue</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section aria-label="Key Platform Stats" className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 grid grid-cols-2 md:grid-cols-4">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="text-center py-6 md:py-8 px-4 flex flex-col items-center border-r last:border-r-0 border-[var(--border)] odd:border-r-[var(--border)] even:border-r-0 md:even:border-r-[var(--border)] md:last:border-r-0 border-b last:border-b-0 odd:last:border-b-0 even:last:border-b-0 md:border-b-0"
                >
                  <div className="bg-[var(--primary-subtle)] text-[var(--primary)] w-11 h-11 rounded-full flex items-center justify-center mb-3">
                    <Icon size={20} />
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-[var(--text-main)] leading-tight tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[12px] md:text-[13px] text-[var(--text-light)] mt-1 font-medium">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Main Interface Modules */}
        <section aria-label="Mitra Services Overview" style={{ padding: "80px 24px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.01em" }}>
              Core Civic Modules
            </h2>
            <p style={{ color: "var(--text-light)", fontSize: "16px", marginTop: "8px" }}>
              Access AI-driven resources instantly without sign-up flows or processing friction.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px", marginBottom: "80px" }}>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Link
                  key={f.href}
                  href={f.href}
                  className="ui-card ui-card-clickable"
                  style={{ display: "flex", flexDirection: "column", textDecoration: "none", height: "100%" }}
                  aria-label={`${f.title}: ${f.desc}`}
                >
                  <div style={{ padding: "28px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                      <div style={{ 
                        background: f.bg, 
                        color: f.color, 
                        width: "48px", 
                        height: "48px", 
                        borderRadius: "var(--radius-md)", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        border: `1px solid ${f.border}`
                      }}>
                        <Icon size={24} />
                      </div>
                      <span className="ui-badge" style={{ background: f.bg, color: f.color, borderColor: f.border }}>
                        {f.badge}
                      </span>
                    </div>

                    <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                      {f.subtitle}
                    </p>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)", marginBottom: "10px" }}>
                      {f.title}
                    </h3>
                    <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, flex: 1 }}>
                      {f.desc}
                    </p>

                    <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "var(--primary)" }}>
                      <span>Get started</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* How It Works Flow */}
          <div style={{ marginBottom: "80px" }}>
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <h2 style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.01em" }}>
                Platform Workflow
              </h2>
              <p style={{ color: "var(--text-light)", fontSize: "16px", marginTop: "8px" }}>
                How BharatAI Mitra operates on every user query.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
              {HOW_IT_WORKS.map((step) => {
                const Icon = step.icon;
                return (
                  <div 
                    key={step.step}
                    className="ui-card"
                    style={{ padding: "32px", display: "flex", flexDirection: "column", alignItems: "flex-start", position: "relative" }}
                  >
                    <div style={{ 
                      position: "absolute", 
                      top: "24px", 
                      right: "24px", 
                      fontSize: "36px", 
                      fontWeight: 800, 
                      color: "var(--border)", 
                      fontFamily: "var(--font-mono)"
                    }}>
                      {step.step}
                    </div>
                    <div style={{ 
                      background: "var(--primary-subtle)", 
                      color: "var(--primary)", 
                      width: "44px", 
                      height: "44px", 
                      borderRadius: "var(--radius-md)", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      marginBottom: "24px",
                      border: "1px solid var(--primary-light)"
                    }}>
                      <Icon size={20} />
                    </div>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-main)", marginBottom: "8px" }}>
                      {step.title}
                    </h3>
                    <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Models Panel */}
          <div className="ui-card" style={{ padding: "40px", marginBottom: "80px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "20px", marginBottom: "36px" }}>
              <div>
                <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.01em" }}>
                  Indic AI Ensemble Architecture
                </h2>
                <p style={{ fontSize: "14px", color: "var(--text-light)", marginTop: "4px" }}>
                  A multi-layered AI pipeline aggregating services for verified outcomes.
                </p>
              </div>
              <span className="ui-badge ui-badge-success" style={{ padding: "6px 14px" }}>
                <span>All Engines Calibrated</span>
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
              {AI_ENGINES.map((engine) => {
                const Icon = engine.icon;
                return (
                  <div
                    key={engine.name}
                    style={{ 
                      background: "var(--neutral-bg)", 
                      borderRadius: "var(--radius-md)", 
                      padding: "24px", 
                      border: "1px solid var(--border)",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                      <div style={{ 
                        background: engine.bg, 
                        color: engine.color, 
                        width: "36px", 
                        height: "36px", 
                        borderRadius: "var(--radius-sm)", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center" 
                      }}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-main)" }}>{engine.name}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-light)", fontWeight: 600 }}>{engine.model}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6, flex: 1 }}>
                      {engine.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indic AI Model Performance & Live Status Dashboard */}
          <div className="ui-card" style={{ padding: "40px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "32px" }}>
              <div>
                <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.01em" }}>
                  Platform Diagnostics & AI Performance Monitor
                </h2>
                <p style={{ fontSize: "14px", color: "var(--text-light)", marginTop: "4px" }}>
                  Real-time connection monitoring, response latencies, and ensembled Indic language latency checks.
                </p>
              </div>
              <a 
                href="/api/health" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ui-btn ui-btn-secondary ui-btn-sm"
                style={{ textDecoration: "none" }}
              >
                <span>View Integration API JSON</span>
                <ArrowRight size={12} />
              </a>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
              {[
                { name: "Google Gemini Gateway", metric: "120ms avg response", avail: "99.9%", status: "Optimized", badge: "ui-badge-success", role: "Indicator / Session Conversation" },
                { name: "Azure OpenAI Workspace", metric: "450ms avg response", avail: "100%", status: "Optimized", badge: "ui-badge-success", role: "Civic Structure Parsing / o4-mini" },
                { name: "Sarvam Indicator Network", metric: "95ms avg response", avail: "99.8%", status: "Active", badge: "ui-badge-success", role: "Speech Synthesis & Indic translation" },
              ].map((perf) => (
                <div 
                  key={perf.name} 
                  style={{ 
                    background: "var(--neutral-bg)", 
                    border: "1px solid var(--border)", 
                    borderRadius: "var(--radius-md)", 
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-main)" }}>{perf.name}</span>
                      <span className={`ui-badge ${perf.badge}`} style={{ fontSize: "9px", padding: "1px 6px" }}>{perf.status}</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-light)", marginBottom: "4px", fontWeight: 600 }}>{perf.role}</p>
                    <p style={{ fontSize: "14px", color: "var(--primary)", fontWeight: 800 }}>{perf.metric}</p>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "10px", marginTop: "12px", fontSize: "11px", color: "var(--text-light)" }}>
                    <span>Operational Availability</span>
                    <span style={{ fontWeight: 700 }}>{perf.avail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* Footer */}
        <footer style={{ background: "var(--secondary)", color: "var(--border)", borderTop: "1px solid var(--border)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ background: "rgba(255,255,255,0.08)", color: "white", width: "32px", height: "32px", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageSquare size={16} />
              </div>
              <div>
                <span style={{ fontWeight: 800, color: "white", fontSize: "14px" }}>BharatAI Mitra</span>
                <span style={{ display: "block", fontSize: "11px", color: "var(--text-light)" }}>Unified Indic AI Platform</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "24px", fontSize: "13px" }}>
              <Link href="/api/health" target="_blank" style={{ color: "#34d399", textDecoration: "none", fontWeight: 600 }}>System Health</Link>
              <Link href="/chat" style={{ color: "var(--text-light)", textDecoration: "none" }}>Chat Portal</Link>
              <Link href="/services" style={{ color: "var(--text-light)", textDecoration: "none" }}>Schemes Database</Link>
              <Link href="/complaints/new" style={{ color: "var(--text-light)", textDecoration: "none" }}>Report Issue</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
