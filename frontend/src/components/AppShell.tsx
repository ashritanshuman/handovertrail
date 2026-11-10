import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Info,
} from "lucide-react";
import { useHandover, USERS } from "../context/HandoverContext";
import { Logo } from "./Logo";

interface AppShellProps {
  children: React.ReactNode;
  minimal?: boolean; // For start page
}

export const AppShell: React.FC<AppShellProps> = ({ children, minimal = false }) => {
  const { currentUser, switchUser, project, handover, toast } = useHandover();
  const location = useLocation();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Review", path: "/review" },
    { label: "Timeline", path: "/timeline" },
    { label: "Gaps", path: "/gaps" },
    { label: "Handover", path: "/handover" },
  ];

  const isApproved = project?.handover_state === "approved" || handover !== null;

  return (
    <div className="bg-[#F4F3EE] text-[#241d18] min-h-screen flex flex-col font-sans selection:bg-[#E0AFA0]/30 selection:text-[#241d18]">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-8 z-50 animate-fade-in flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-lg bg-white border-[#d8d0c0] text-sm font-medium text-[#241d18]"
        >
          {toast.type === "success" && <CheckCircle2 size={16} className="text-[#38523A]" />}
          {toast.type === "warning" && <ShieldAlert size={16} className="text-[#8F5105]" />}
          {toast.type === "error" && <ShieldAlert size={16} className="text-[#BA1A1A]" />}
          {toast.type === "info" && <Info size={16} className="text-[#3C5066]" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Floating Top Navigation Header */}
      <header className="sticky top-4 z-40 mx-auto w-[calc(100%-2rem)] max-w-7xl rounded-xl border border-[#d8d0c0] bg-white shadow-[0_4px_16px_-2px_rgba(70,63,58,0.08)] transition-all">
        <div className="flex justify-between items-center h-16 px-6">
          {/* Brand Anchor */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
              <Logo
                size={24}
                showWordmark={true}
                wordmarkClassName="text-headline-section font-headline-section text-[#241d18] tracking-tight font-semibold"
              />
            </Link>
            <span className="text-[#6B635E] select-none">/</span>
            <span className="text-label-mono-metadata font-label-mono-metadata text-[#5C544F] font-medium">
              {project?.name || "CampusConnect"}
            </span>

            {/* Global Nav Tabs (Hidden on minimal mode) */}
            {!minimal && (
              <nav aria-label="Global Navigation" className="hidden md:flex items-center space-x-1 ml-6">
                {navLinks.map((tab) => {
                  const isActive = location.pathname === tab.path;
                  return (
                    <Link
                      key={tab.path}
                      to={tab.path}
                      className={`px-4 py-1.5 text-label-caption font-label-caption rounded-full transition-colors duration-150 ${
                        isActive
                          ? "bg-[#2B2521] text-white font-medium shadow-xs"
                          : "text-[#413934] hover:text-[#241d18] hover:bg-[#F4F3EE]"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Trailing Controls & Persona Selector */}
          <div className="flex items-center gap-3">
            {/* View As Persona Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 border border-[#d8d0c0] rounded-full pl-3 pr-2 py-1.5 text-label-caption font-label-caption text-[#241d18] bg-white hover:border-[#6B635E] transition-colors"
                title="Switch active user persona"
              >
                <span className="text-[#6B635E]">View as:</span>
                <span className="font-semibold text-[#241d18]">{currentUser.name}</span>
                <span className="text-xs px-1.5 py-0.2 rounded bg-[#F4F3EE] text-[#5C544F] border border-[#d8d0c0] capitalize font-medium">
                  {currentUser.role}
                </span>
                <ChevronDown size={14} className="text-[#6B635E]" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-[#d8d0c0] shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#6B635E] border-b border-[#d8d0c0] mb-1">
                    Select User Persona
                  </div>
                  {USERS.map((user) => {
                    const isSelected = user.id === currentUser.id;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          switchUser(user.id);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 flex items-start justify-between text-body-default transition-colors ${
                          isSelected ? "bg-[#F4F3EE]" : "hover:bg-[#F4F3EE]/60"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#241d18] text-sm">{user.name}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#38523A]"></span>}
                          </div>
                          <div className="text-xs text-[#5C544F]">
                            {user.email} · Clearance L{user.clearance}
                          </div>
                        </div>
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[#F4F3EE] text-[#241d18] border border-[#d8d0c0] capitalize font-medium">
                          {user.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Global Handover State Pill */}
            {!minimal && (
              <span
                className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-caption font-label-caption border ${
                  isApproved
                    ? "bg-[#5F7A61]/12 text-[#38523A] border-[#5F7A61]/35 font-medium"
                    : "bg-[#8d3b2a]/15 text-[#241d18] border-[#8d3b2a]/35 font-medium"
                }`}
              >
                {isApproved ? (
                  <>
                    <CheckCircle2 size={13} strokeWidth={2} />
                    <span>Approved</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8d3b2a]"></span>
                    <span>In review</span>
                  </>
                )}
              </span>
            )}

            <div className="h-4 w-px bg-[#d8d0c0] mx-0.5 hidden sm:block"></div>

            {/* Trailing Icon Actions */}
            <button
              type="button"
              className="p-1.5 text-[#5C544F] hover:text-[#241d18] hover:bg-[#F4F3EE] rounded-full transition-colors"
              title="Notifications"
            >
              <Bell size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="p-1.5 text-[#5C544F] hover:text-[#241d18] hover:bg-[#F4F3EE] rounded-full transition-colors"
              title="Documentation and Guidance"
            >
              <HelpCircle size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-6">{children}</main>

      {/* Docked Footer */}
      <footer className="border-t border-[#d8d0c0] bg-[#F4F3EE] mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-6 py-4 gap-2">
          <span className="text-label-mono-metadata font-label-mono-metadata text-[#241d18] font-medium">
            HandoverTrail — Synthetic demo data for verification review
          </span>
          <div className="flex items-center space-x-6 text-label-mono-metadata font-label-mono-metadata text-[#413934]">
            <Link to="/review" className="hover:text-[#241d18] underline transition-colors">
              Protocol Brief
            </Link>
            <Link to="/timeline" className="hover:text-[#241d18] underline transition-colors">
              Audit Logs
            </Link>
            <Link to="/handover" className="hover:text-[#241d18] underline transition-colors">
              Export Artifact
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#241d18] underline transition-colors inline-flex items-center gap-1"
            >
              <span>Security Specs</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
