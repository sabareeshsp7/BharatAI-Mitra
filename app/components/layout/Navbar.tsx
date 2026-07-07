"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  MessageSquare, 
  Building, 
  AlertCircle, 
  Search, 
  Activity 
} from "@/app/components/ui/icons";

const NAV_LINKS = [
  { href: "/",                label: "Home",     icon: Home },
  { href: "/chat",            label: "Chat",     icon: MessageSquare },
  { href: "/services",        label: "Schemes",  icon: Building },
  { href: "/complaints/new",  label: "Report",   icon: AlertCircle },
  { href: "/complaints/track",label: "Track",    icon: Search },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Top Header Navbar (Desktop & Mobile) ────────────────────────────────── */}
      <nav className="navbar-glass w-full" role="navigation" aria-label="Main navigation">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link
            href="/"
            aria-label="BharatAI Mitra — Home"
            className="flex items-center gap-3 no-underline"
          >
            <div className="bg-[var(--primary-subtle)] text-[var(--primary)] w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center border border-[var(--primary-light)]">
              <MessageSquare size={18} />
            </div>
            <div>
              <div className="font-extrabold text-[15px] md:text-[16px] text-[var(--text-main)] line-clamp-1 leading-none letter-spacing-[-0.01em]">
                BharatAI Mitra
              </div>
              <div className="text-[9px] md:text-[10px] text-[var(--text-light)] font-semibold uppercase tracking-wider mt-0.5">
                AI Civic Companion
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div role="list" className="hidden md:flex items-center gap-1.5" aria-label="Navigation links">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  role="listitem"
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-md)] no-underline text-[13px] transition-all duration-200 border ${
                    isActive
                      ? "font-bold text-[var(--primary)] bg-[var(--primary-subtle)] border-[var(--primary-light)]"
                      : "font-medium text-[var(--text-muted)] bg-transparent border-transparent hover:bg-slate-50"
                  }`}
                >
                  <Icon size={14} className={isActive ? "stroke-[2.5]" : "stroke-2"} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* System Health Check (Status dot on mobile, full tag on desktop) */}
          <Link
            href="/api/health"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View system health status"
            className="flex items-center gap-2 no-underline px-3 py-1.5 md:py-2 rounded-[var(--radius-md)] border border-[var(--border)] text-[12px] font-semibold text-[var(--text-muted)] bg-[var(--surface)] hover:bg-[var(--neutral-bg)] transition-all"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">System Status</span>
          </Link>
        </div>
      </nav>

      {/* ── Bottom Navigation Tab Bar (Mobile Only) ────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1 shadow-[0_-4px_12px_rgba(15,23,42,0.04)] flex justify-around items-center h-16 pb-safe">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-lg no-underline transition-all duration-200 ${
                isActive ? "text-[var(--primary)] font-bold" : "text-[var(--text-light)] hover:text-[var(--text-main)]"
              }`}
            >
              <div className={`p-1 rounded-md transition-all ${isActive ? "bg-[var(--primary-subtle)]" : ""}`}>
                <Icon size={20} className={isActive ? "stroke-[2.2]" : "stroke-2"} />
              </div>
              <span className="text-[10px] tracking-tight leading-none">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
