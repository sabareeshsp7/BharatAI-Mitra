"use client";

import React from "react";

/* ─── Skeleton Line ────────────────────────────────── */
export function SkeletonLine({ width = "100%", height = "14px", className = "" }: { width?: string; height?: string; className?: string }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height }}
      role="status"
      aria-label="Loading..."
      aria-busy="true"
    />
  );
}

/* ─── Skeleton Card ────────────────────────────────── */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }} aria-label="Loading content" aria-busy="true">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="skeleton" style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0 }} role="status" aria-label="Loading..." />
        <SkeletonLine width="60px" height="20px" />
      </div>
      <SkeletonLine width="70%" height="16px" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? "55%" : "100%"} height="12px" />
      ))}
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <SkeletonLine width="50%" height="32px" />
        <SkeletonLine width="50%" height="32px" />
      </div>
    </div>
  );
}

/* ─── Skeleton Grid ────────────────────────────────── */
export function SkeletonGrid({ count = 6, columns = 3 }: { count?: number; columns?: number }) {
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: "16px" }}
      role="status"
      aria-label={`Loading ${count} items`}
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  );
}

/* ─── Skeleton Chat Bubble ─────────────────────────── */
export function SkeletonBubble({ side = "left" }: { side?: "left" | "right" }) {
  return (
    <div
      style={{ display: "flex", justifyContent: side === "right" ? "flex-end" : "flex-start", marginBottom: "16px" }}
      role="status"
      aria-label="Loading message"
      aria-busy="true"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "65%" }}>
        <SkeletonLine width="100%" height="16px" />
        <SkeletonLine width="80%" height="16px" />
        <SkeletonLine width="60%" height="16px" />
      </div>
    </div>
  );
}

/* ─── Loading Spinner ──────────────────────────────── */
export function Spinner({ size = 20, color = "var(--navy)" }: { size?: number; color?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        width: size, height: size,
        border: `2px solid ${color}22`,
        borderTopColor: color,
        borderRadius: "50%",
        flexShrink: 0,
      }}
      className="animate-spin"
    />
  );
}

/* ─── Typing Indicator ─────────────────────────────── */
export function TypingIndicator() {
  return (
    <div className="msg-ai" style={{ display: "inline-block" }} role="status" aria-label="Mitra is typing">
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Mitra</span>
        <div className="typing-dots">
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
