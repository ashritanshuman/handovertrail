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
    <div className="bg-[#F4F3EE] text-[#463F3A] min-h-screen flex flex-col font-sans selection:bg-[#E0AFA0]/30 selection:text-[#463F3A]">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-8 z-50 animate-fade-in flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-lg bg-white border-[#E7E4DE] text-[13px] font-medium text-[#463F3A]"
        >
          {toast.type === "success" && <CheckCircle2 size={16} className="text-[#5F7A61]" />}
          {toast.type === "warning" && <ShieldAlert size={16} className="text-[#C9822B]" />}
          {toast.type === "error" && <ShieldAlert size={16} className="text-[#BA1A1A]" />}
          {toast.type === "info" && <Info size={16} className="text-[#6B7F94]" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Floating Top Navigation Header */}
      <header className="sticky top-4 z-40 mx-auto w-[calc(100%-2rem)] max-w-7xl rounded-xl border border-[#E7E4DE] bg-white shadow-[0_4px_16px_-2px_rgba(70,63,58,0.08)] transition-all">
        <div className="flex justify-between items-center h-16 px-6">
          {/* Brand Anchor */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E0AFA0] group-hover:scale-110 transition-transform"></span>
              <span className="text-headline-section font-headline-section text-[#463F3A] tracking-tight font-semibold">
                HandoverTrail
              </span>
            </Link>
            <span className="text-[#BCB8B1] select-none">/</span>
            <span className="text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
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
                          ? "bg-[#463F3A] text-white font-medium shadow-xs"
                          : "text-[#8A817C] hover:text-[#463F3A] hover:bg-[#F4F3EE]"
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
                className="flex items-center gap-2 border border-[#E7E4DE] rounded-full pl-3 pr-2 py-1.5 text-label-caption font-label-caption text-[#463F3A] bg-white hover:border-[#BCB8B1] transition-colors"
                title="Switch active user persona"
              >
                <span className="text-[#8A817C]">View as:</span>
                <span className="font-medium text-[#463F3A]">{currentUser.name}</span>
                <span className="text-[11px] px-1.5 py-0.2 rounded bg-[#F4F3EE] text-[#8A817C] capitalize">
                  {currentUser.role}
                </span>
                <ChevronDown size={14} className="text-[#8A817C]" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-[#E7E4DE] shadow-xl py-2 z-50 animate-fade-in">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8A817C] border-b border-[#E7E4DE]/60 mb-1">
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
                            <span className="font-medium text-[#463F3A] text-sm">{user.name}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#5F7A61]"></span>}
                          </div>
                          <div className="text-[12px] text-[#8A817C]">
                            {user.email} · Clearance L{user.clearance}
                          </div>
                        </div>
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#E7E4DE]/60 text-[#463F3A] capitalize">
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
                    ? "bg-[#5F7A61]/12 text-[#5F7A61] border-[#5F7A61]/30 font-medium"
                    : "bg-[#E0AFA0]/20 text-[#463F3A] border-[#E0AFA0]/40 font-medium"
                }`}
              >
                {isApproved ? (
                  <>
                    <CheckCircle2 size={13} strokeWidth={2} />
                    <span>Approved</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E0AFA0]"></span>
                    <span>In review</span>
                  </>
                )}
              </span>
            )}

            <div className="h-4 w-px bg-[#E7E4DE] mx-0.5 hidden sm:block"></div>

            {/* Trailing Icon Actions */}
            <button
              type="button"
              className="p-1.5 text-[#8A817C] hover:text-[#463F3A] hover:bg-[#F4F3EE] rounded-full transition-colors"
              title="Notifications"
            >
              <Bell size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="p-1.5 text-[#8A817C] hover:text-[#463F3A] hover:bg-[#F4F3EE] rounded-full transition-colors"
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
      <footer className="border-t border-[#E7E4DE] bg-[#F4F3EE] mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-6 py-4 gap-2">
          <span className="text-label-mono-metadata font-label-mono-metadata text-[#463F3A] font-medium">
            HandoverTrail — Synthetic demo data for verification review
          </span>
          <div className="flex items-center space-x-6 text-label-mono-metadata font-label-mono-metadata text-[#8A817C]">
            <Link to="/review" className="hover:text-[#463F3A] underline transition-colors">
              Protocol Brief
            </Link>
            <Link to="/timeline" className="hover:text-[#463F3A] underline transition-colors">
              Audit Logs
            </Link>
            <Link to="/handover" className="hover:text-[#463F3A] underline transition-colors">
              Export Artifact
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#463F3A] underline transition-colors inline-flex items-center gap-1"
            >
              <span>Security Specs</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
