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
    <nav className="navbar-glass" role="navigation" aria-label="Main navigation">
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
        
        {/* Logo */}
        <Link
          href="/"
          aria-label="BharatAI Mitra — Home"
          style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}
        >
          <div style={{
            background: "var(--primary-subtle)", 
            color: "var(--primary)", 
            width: "36px", 
            height: "36px", 
            borderRadius: "var(--radius-md)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            border: "1px solid var(--primary-light)",
          }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "16px", color: "var(--text-main)", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
              BharatAI Mitra
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-light)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              AI Civic Companion
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div role="list" style={{ display: "flex", alignItems: "center", gap: "6px" }} aria-label="Navigation links">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                role="listitem"
                aria-current={isActive ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--primary)" : "var(--text-muted)",
                  background: isActive ? "var(--primary-subtle)" : "transparent",
                  transition: "all 0.2s ease",
                  border: "1px solid",
                  borderColor: isActive ? "var(--primary-light)" : "transparent",
                }}
              >
                <Icon size={15} style={{ strokeWidth: isActive ? 2.5 : 2 }} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* System Health Check */}
        <Link
          href="/api/health"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View system health status"
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            textDecoration: "none", 
            padding: "8px 14px", 
            borderRadius: "var(--radius-md)", 
            border: "1px solid var(--border)", 
            fontSize: "12px", 
            fontWeight: 600,
            color: "var(--text-muted)",
            background: "var(--surface)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--border-hover)";
            e.currentTarget.style.background = "var(--neutral-bg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.background = "var(--surface)";
          }}
        >
          <Activity size={14} style={{ color: "var(--success)" }} />
          <span>System Status</span>
        </Link>
      </div>
    </nav>
  );
}
