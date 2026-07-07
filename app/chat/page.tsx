"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { showToast } from "@/app/components/ui/Toast";
import { TypingIndicator } from "@/app/components/ui/SkeletonLoader";
import { 
  MessageSquare, 
  Languages, 
  Mic, 
  Volume2, 
  ArrowRight, 
  Activity,
  Building,
  AlertCircle,
  Loader2
} from "@/app/components/ui/icons";

interface Message {
  role: "user" | "assistant";
  content: string;
  model?: string;
  timestamp: Date;
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "mr", label: "मराठी" },
  { code: "bn", label: "বাংলা" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
];

const SUGGESTIONS = [
  { label: "PM Awas Yojana", text: "How to get PM Awas Yojana housing scheme?", icon: Building },
  { label: "Aadhaar Update", text: "What documents are needed for Aadhaar update?", icon: FileTextIcon }, // Let's make sure it exists
  { label: "PM-KISAN Apply", text: "How to apply for PM-KISAN scheme?", icon: Building },
  { label: "Ayushman Bharat", text: "How does Ayushman Bharat PM-JAY work?", icon: Activity },
  { label: "Report Pothole", text: "How to report a broken street light or pothole?", icon: AlertCircle },
];

// Fallback icon for Aadhaar since FileText wasn't explicitly imported under that alias
function FileTextIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

export default function ChatPage() {
  const { getSession } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const sessionId = getSession();
    setMessages((prev) => [...prev, { role: "user", content: text, timestamp: new Date() }]);
    setInput("");
    setIsLoading(true);
    setIsStreaming(true);

    // Streaming placeholder
    setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp: new Date(), model: "gemini-2.0-flash" }]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId, conversationId, language }),
      });

      if (!response.ok) throw new Error("Chat request failed");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data:"));
        for (const line of lines) {
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "text") {
              fullText += parsed.content;
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  updated[updated.length - 1] = { ...last, content: fullText };
                }
                return updated;
              });
            } else if (parsed.type === "metadata" && parsed.conversationId) {
              setConversationId(parsed.conversationId);
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch {
      showToast({ message: "Message failed. Please try again.", type: "error" });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLoading, getSession, conversationId, language]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const actualMimeType = mr.mimeType || "audio/webm";
        const ext = actualMimeType.includes("mp4") ? "mp4" : "webm";
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
        const formData = new FormData();
        formData.append("audio", blob, `recording.${ext}`);
        formData.append("language", language);
        try {
          const res = await fetch("/api/voice/speech-to-text", { method: "POST", body: formData });
          const data = await res.json();
          if (data.transcript) { setInput(data.transcript); inputRef.current?.focus(); }
        } catch { showToast({ message: "Voice recognition failed.", type: "error" }); }
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch { showToast({ message: "Microphone access denied.", type: "error" }); }
  }, [language]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const playTTS = useCallback(async (text: string) => {
    try {
      const res = await fetch("/api/voice/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 500), language }),
      });
      const data = await res.json();
      if (data.audioBase64) {
        const audio = new Audio(`data:${data.mimeType};base64,${data.audioBase64}`);
        audio.play();
      }
    } catch { /* silently fail */ }
  }, [language]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--neutral-bg)" }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header
        role="banner"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: "64px",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/" aria-label="Back to home" style={{ color: "var(--text-light)", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
            ← Home
          </Link>
          <div style={{ width: "1px", height: "20px", background: "var(--border)" }} aria-hidden="true" />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ 
              background: "var(--primary-subtle)", 
              color: "var(--primary)", 
              width: "36px", 
              height: "36px", 
              borderRadius: "var(--radius-md)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              position: "relative" 
            }}>
              <MessageSquare size={18} />
              {!isLoading && (
                <span
                  style={{
                    position: "absolute", bottom: "-2px", right: "-2px",
                    width: "10px", height: "10px", background: "var(--success)",
                    borderRadius: "50%", border: "2px solid var(--surface)",
                  }}
                  role="img"
                  aria-label="Mitra is online"
                />
              )}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-main)" }}>Mitra</div>
              <div style={{ fontSize: "11px", color: "var(--text-light)", fontWeight: 500 }}>
                {isStreaming ? "Typing…" : "Online companion"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--neutral-bg)", padding: "4px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
            <Languages size={14} style={{ color: "var(--text-light)" }} />
            <label htmlFor="language-select" className="sr-only">Select language</label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Select language for chat"
              className="ui-select"
              style={{
                background: "transparent", color: "var(--text-main)",
                border: "none", fontSize: "12px", fontWeight: 600,
                cursor: "pointer", outline: "none", padding: "0 20px 0 0",
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); setConversationId(null); }}
              aria-label="Clear conversation"
              className="ui-btn ui-btn-secondary ui-btn-sm"
            >
              Clear
            </button>
          )}
        </div>
      </header>

      {/* ── Messages Area ──────────────────────────────────────────── */}
      <main
        id="main-content"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        style={{ flex: 1, overflowY: "auto", padding: "32px 24px" }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="animate-fade-up" style={{ textAlign: "center", paddingTop: "60px" }}>
              <div
                style={{
                  width: "72px", height: "72px", borderRadius: "var(--radius-lg)",
                  background: "var(--primary-subtle)", margin: "0 auto 24px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--primary)",
                  boxShadow: "var(--shadow-sm)",
                  border: "1px solid var(--primary-light)",
                }}
                aria-hidden="true"
              >
                <MessageSquare size={36} />
              </div>
              <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.01em", marginBottom: "8px" }}>
                Meet Mitra
              </h1>
              <p style={{ fontSize: "15px", color: "var(--text-light)", maxWidth: "480px", margin: "0 auto 24px", lineHeight: 1.6 }}>
                Your unified AI companion for government scheme directories, application compliance, and instant ticket filing.
              </p>
              
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "40px" }}>
                <span className="ui-badge ui-badge-primary">Gemini 2.0 Flash</span>
                <span className="ui-badge ui-badge-info">Azure o4-mini</span>
                <span className="ui-badge ui-badge-warning">Sarvam Voice API</span>
              </div>
              
              <div
                role="list"
                aria-label="Suggested questions"
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", maxWidth: "720px", margin: "0 auto" }}
              >
                {SUGGESTIONS.map((s) => {
                  const SugIcon = s.icon;
                  return (
                    <button
                      key={s.text}
                      role="listitem"
                      onClick={() => sendMessage(s.text)}
                      className={`ui-card ui-card-clickable animate-fade-up`}
                      aria-label={`Ask: ${s.text}`}
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        background: "var(--surface)",
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ 
                        color: "var(--primary)", 
                        background: "var(--primary-subtle)", 
                        width: "32px", 
                        height: "32px", 
                        borderRadius: "var(--radius-sm)", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <SugIcon size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                          {s.label}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-light)", lineHeight: 1.4 }}>
                          {s.text.length > 40 ? s.text.slice(0, 40) + "..." : s.text}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{ marginBottom: "24px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}
            >
              {msg.role === "assistant" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "80%" }}>
                  {/* AI header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "4px" }}>
                    <div style={{ background: "var(--primary-subtle)", color: "var(--primary)", width: "20px", height: "20px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MessageSquare size={12} />
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-main)" }}>Mitra</span>
                    {msg.model && (
                      <span className="ui-badge ui-badge-primary" style={{ fontSize: "9px", padding: "1px 6px" }}>{msg.model}</span>
                    )}
                  </div>

                  {/* Bubble or typing */}
                  {msg.content === "" && isStreaming ? (
                    <TypingIndicator />
                  ) : (
                    <div className="chat-bubble-ai">
                      <p style={{ fontSize: "14.5px", lineHeight: 1.65, whiteSpace: "pre-wrap", color: "var(--text-main)", margin: 0 }}>
                        {msg.content}
                      </p>
                      {msg.content && (
                        <button
                          onClick={() => playTTS(msg.content)}
                          aria-label="Listen to this message (Sarvam TTS)"
                          title="Listen via Sarvam AI voice"
                          style={{ 
                            marginTop: "12px", 
                            background: "var(--neutral-bg)", 
                            border: "1px solid var(--border)", 
                            borderRadius: "var(--radius-sm)",
                            padding: "4px 8px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "var(--text-muted)",
                            cursor: "pointer", 
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--border-hover)";
                            e.currentTarget.style.color = "var(--text-main)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.color = "var(--text-muted)";
                          }}
                        >
                          <Volume2 size={13} />
                          <span>Speak Response</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {msg.role === "user" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end", maxWidth: "75%" }}>
                  <div className="chat-bubble-user">
                    <p style={{ fontSize: "14.5px", lineHeight: 1.6, margin: 0 }}>
                      {msg.content}
                    </p>
                  </div>
                  <span style={{ fontSize: "10px", color: "var(--text-light)", paddingRight: "4px" }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
      </main>

      {/* ── Input Bar ─────────────────────────────────────────────── */}
      <div
        role="complementary"
        aria-label="Message input bar"
        style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          padding: "20px 24px",
          flexShrink: 0,
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {/* Voice recording button */}
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              aria-label={isRecording ? "Recording — release to stop" : "Hold to record voice input"}
              aria-pressed={isRecording}
              className="ui-btn ui-btn-secondary"
              style={{
                width: "48px", height: "48px", padding: 0, flexShrink: 0, borderRadius: "var(--radius-md)",
                borderColor: isRecording ? "var(--danger)" : "var(--border)",
                background: isRecording ? "var(--danger-bg)" : "var(--surface)",
                color: isRecording ? "var(--danger)" : "var(--text-muted)",
                position: "relative",
              }}
            >
              <Mic size={20} />
              {isRecording && (
                <span
                  style={{
                    position: "absolute", inset: "-4px",
                    borderRadius: "14px",
                    border: "2px solid var(--danger)",
                    opacity: 0.3,
                    animation: "ripple 1s ease-out infinite",
                  }}
                  aria-hidden="true"
                />
              )}
            </button>

            {/* Input field */}
            <div style={{ flex: 1, position: "relative" }}>
              <input
                ref={inputRef}
                id="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder={`Type a message to Mitra...`}
                aria-label="Type your message to Mitra"
                disabled={isLoading}
                className="ui-input"
                style={{ paddingRight: "48px", height: "48px" }}
              />
              {input.length > 0 && (
                <span
                  style={{
                    position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                    fontSize: "11px", color: "var(--text-light)", fontWeight: 600,
                  }}
                  aria-hidden="true"
                >
                  {input.length}
                </span>
              )}
            </div>

            {/* Send button */}
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="ui-btn ui-btn-primary"
              style={{ height: "48px", padding: "0 22px", borderRadius: "var(--radius-md)" }}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ArrowRight size={16} />
              )}
            </button>
          </div>

          <p
            style={{ fontSize: "11px", color: "var(--text-light)", textAlign: "center", marginTop: "10px", fontWeight: 500 }}
          >
            Powered by BharatAI Mitra Ensemble AI Suite (Gemini 2.0 Flash, Azure o4-mini, and Sarvam AI).
          </p>
        </div>
      </div>
    </div>
  );
}
