"use client";

import { useEffect, useRef, useCallback } from "react";

type ToastType = "success" | "error" | "info" | "loading";

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

let toastContainer: HTMLElement | null = null;

function getContainer(): HTMLElement {
  if (toastContainer && document.body.contains(toastContainer)) return toastContainer;
  const el = document.createElement("div");
  el.id = "toast-container";
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  el.setAttribute("aria-atomic", "false");
  Object.assign(el.style, {
    position: "fixed", bottom: "24px", right: "24px",
    zIndex: "9999", display: "flex", flexDirection: "column", gap: "10px",
    pointerEvents: "none",
  });
  document.body.appendChild(el);
  toastContainer = el;
  return el;
}

const ICONS: Record<ToastType, string> = {
  success: "✅", error: "❌", info: "ℹ️", loading: "⏳",
};
const COLORS: Record<ToastType, string> = {
  success: "var(--green)", error: "#DC2626", info: "var(--gemini-blue)", loading: "var(--navy)",
};

export function showToast({ message, type = "info", duration = 3500 }: ToastOptions) {
  if (typeof window === "undefined") return;
  const container = getContainer();

  const el = document.createElement("div");
  Object.assign(el.style, {
    display: "flex", alignItems: "center", gap: "10px",
    background: "white", border: `1.5px solid ${COLORS[type]}30`,
    borderLeft: `4px solid ${COLORS[type]}`,
    borderRadius: "12px", padding: "12px 16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
    fontSize: "13px", fontWeight: "600", color: "var(--text-primary)",
    maxWidth: "320px", pointerEvents: "all",
    animation: "slideInRight 300ms ease-out both",
    fontFamily: "var(--font-jakarta, 'Plus Jakarta Sans', sans-serif)",
    cursor: "pointer",
  });
  el.setAttribute("role", "alert");
  el.innerHTML = `<span aria-hidden="true" style="font-size:16px">${ICONS[type]}</span><span>${message}</span>`;

  // Progress bar
  const bar = document.createElement("div");
  Object.assign(bar.style, {
    position: "absolute", bottom: "0", left: "0", height: "3px",
    background: COLORS[type], borderRadius: "0 0 0 8px",
    width: "100%", transition: `width ${duration}ms linear`,
  });
  el.style.position = "relative";
  el.appendChild(bar);

  el.onclick = () => { el.style.animation = "slideInRight 200ms reverse both"; setTimeout(() => el.remove(), 200); };
  container.appendChild(el);
  requestAnimationFrame(() => { bar.style.width = "0%"; });

  if (type !== "loading") {
    setTimeout(() => {
      el.style.opacity = "0"; el.style.transition = "opacity 300ms";
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  return () => el.remove();
}

// React hook version
export function useToast() {
  return useCallback((opts: ToastOptions) => showToast(opts), []);
}
