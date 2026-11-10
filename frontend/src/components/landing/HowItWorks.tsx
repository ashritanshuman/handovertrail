import React from "react";
import { Network, Brain, CheckSquare, ShieldCheck } from "lucide-react";

export const HowItWorks: React.FC = () => {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto" id="how-it-works">
      <div className="text-center mb-16">
        <div className="border border-[#d8d0c0] bg-white text-xs font-mono uppercase tracking-wider text-[#6B635E] px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 mb-4 shadow-xs font-semibold">
          <span>PROTOCOL</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-serif text-[#241d18] font-normal tracking-tight">
          From scattered activity to an approved handover
        </h2>
      </div>

      {/* 4 Horizontal Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {/* Step 01 */}
        <div className="bg-white border border-[#d8d0c0] rounded-2xl p-6 shadow-sm flex flex-col justify-between group hover:border-[#6B635E] transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-serif font-medium text-[#8d3b2a]">01</span>
              <Network size={20} className="text-[#6B635E] group-hover:text-[#241d18] transition-colors" />
            </div>
            <h3 className="font-serif text-xl font-medium text-[#241d18] mb-2">Connect sources</h3>
            <p className="text-base text-[#5C544F] leading-relaxed mb-6 font-normal">
              Git commits, PR discussions, Slack channels, Notion RFCs, and Jira tickets connected in
              read-only mode.
            </p>
          </div>
          {/* Micro UI */}
          <div className="bg-[#F4F3EE] rounded-lg p-2.5 border border-[#d8d0c0] text-xs font-mono text-[#5C544F] flex items-center justify-between">
            <span>GitHub / Slack / RFC</span>
            <span className="text-[#38523A] font-semibold">Synced</span>
          </div>
        </div>

        {/* Step 02 */}
        <div className="bg-white border border-[#d8d0c0] rounded-2xl p-6 shadow-sm flex flex-col justify-between group hover:border-[#6B635E] transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-serif font-medium text-[#6B635E]">02</span>
              <Brain size={20} className="text-[#6B635E] group-hover:text-[#241d18] transition-colors" />
            </div>
            <h3 className="font-serif text-xl font-medium text-[#241d18] mb-2">Extract &amp; verify</h3>
            <p className="text-base text-[#5C544F] leading-relaxed mb-6 font-normal">
              Synthesizes key decisions, surfaces contradictions, and links every claim directly to verbatim
              sources.
            </p>
          </div>
          {/* Micro UI */}
          <div className="bg-[#F4F3EE] rounded-lg p-2.5 border border-[#d8d0c0] text-xs font-mono text-[#5C544F] flex items-center justify-between">
            <span>48 claims extracted</span>
            <span className="text-[#8d3b2a] font-semibold">100% cited</span>
          </div>
        </div>

        {/* Step 03 */}
        <div className="bg-white border border-[#d8d0c0] rounded-2xl p-6 shadow-sm flex flex-col justify-between group hover:border-[#6B635E] transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-serif font-medium text-[#6B635E]">03</span>
              <CheckSquare size={20} className="text-[#6B635E] group-hover:text-[#241d18] transition-colors" />
            </div>
            <h3 className="font-serif text-xl font-medium text-[#241d18] mb-2">Review &amp; approve</h3>
            <p className="text-base text-[#5C544F] leading-relaxed mb-6 font-normal">
              Leaver Riya resolves discrepancies; Tech Lead Maya ratifies with permanent cryptographic
              sign-off.
            </p>
          </div>
          {/* Micro UI */}
          <div className="bg-[#F4F3EE] rounded-lg p-2.5 border border-[#d8d0c0] text-xs font-mono text-[#5C544F] flex items-center justify-between">
            <span>Riya Sharma</span>
            <span className="text-[#38523A] font-semibold">Approved v3</span>
          </div>
        </div>

        {/* Step 04 */}
        <div className="bg-white border border-[#d8d0c0] rounded-2xl p-6 shadow-sm flex flex-col justify-between group hover:border-[#6B635E] transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-serif font-medium text-[#6B635E]">04</span>
              <ShieldCheck size={20} className="text-[#6B635E] group-hover:text-[#241d18] transition-colors" />
            </div>
            <h3 className="font-serif text-xl font-medium text-[#241d18] mb-2">Share by role</h3>
            <p className="text-base text-[#5C544F] leading-relaxed mb-6 font-normal">
              Successor Arjun receives a tailored orientation dossier with privileged credentials safely
              auto-redacted.
            </p>
          </div>
          {/* Micro UI */}
          <div className="bg-[#F4F3EE] rounded-lg p-2.5 border border-[#d8d0c0] text-xs font-mono text-[#5C544F] flex items-center justify-between">
            <span>Arjun Rao (Successor)</span>
            <span className="text-[#241d18] font-semibold">Clean brief</span>
          </div>
        </div>
      </div>
    </section>
  );
};

