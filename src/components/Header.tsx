"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Search,
  Wallet,
  CheckCircle2,
  GraduationCap,
  Building2,
  FlaskConical,
} from "lucide-react";
import { ExecutionMode, TabType } from "@/types";

interface HeaderProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  mode: ExecutionMode;
  onToggleMode: (mode: ExecutionMode) => void;
  walletConnected: boolean;
  walletAddress?: string;
  onConnectWallet: () => void;
  onGlobalSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  mode,
  onToggleMode,
  walletConnected,
  walletAddress,
  onConnectWallet,
  onGlobalSearch,
}) => {
  const [headerSearch, setHeaderSearch] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerSearch.trim()) return;
    if (onGlobalSearch) {
      onGlobalSearch(headerSearch.trim());
    } else {
      onSelectTab("verify");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] transition-all">
      {/* Main Top Bar (YouTube h-14 Header) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Left: Brand Icon & Logo with Micro-bounce */}
          <div
            onClick={() => onSelectTab("verify")}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 group active:scale-95 transition-transform duration-150"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#0F0F0F] group-hover:bg-[#272727] text-white shadow-xs group-hover:shadow-sm transition-all duration-200">
              <ShieldCheck className="w-5 h-5 text-white transition-transform duration-200 group-hover:scale-105" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight text-[#0F0F0F] font-sans">
                FileOk
              </span>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-[#606060] tracking-normal">
                Academic Trust
              </span>
            </div>
          </div>

          {/* Center: YouTube-style Rounded-Full Search Bar with Smooth Ring Focus */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-xl mx-2 hidden sm:flex items-center"
          >
            <div className="flex w-full items-center rounded-full border border-[#CCCCCC] bg-[#F8F9FA] hover:border-[#909090] focus-within:border-[#065FD4] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#065FD4]/10 shadow-xs transition-all duration-200 overflow-hidden pl-4 pr-1 py-1">
              <Search className="w-4 h-4 text-[#606060] shrink-0 mr-2 transition-colors duration-150" />
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                placeholder="Search Certificate ID (e.g. CERT-HSTU-2026-0482) or Roll..."
                className="w-full bg-transparent text-xs sm:text-sm text-[#0F0F0F] placeholder-[#606060] outline-none"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full bg-[#0F0F0F] hover:bg-[#272727] active:scale-95 text-white text-xs font-medium transition-all duration-150 ml-1 shrink-0 shadow-xs"
              >
                Verify
              </button>
            </div>
          </form>

          {/* Right: Mode Switcher & Wallet Pill */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Mode Switch Toggle Pill */}
            <div className="inline-flex items-center p-1 rounded-full bg-[#F2F2F2] border border-[#E5E5E5] text-xs">
              <button
                type="button"
                onClick={() => onToggleMode("DEMO")}
                className={`px-3 py-1 rounded-full font-medium transition-all duration-150 active:scale-95 ${
                  mode === "DEMO"
                    ? "bg-[#0F0F0F] text-white shadow-xs"
                    : "text-[#606060] hover:text-[#0F0F0F]"
                }`}
              >
                Demo
              </button>
              <button
                type="button"
                onClick={() => onToggleMode("TESTNET")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all duration-150 active:scale-95 ${
                  mode === "TESTNET"
                    ? "bg-[#065FD4] text-white shadow-xs"
                    : "text-[#606060] hover:text-[#0F0F0F]"
                }`}
              >
                <span>Testnet</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </button>
            </div>

            {/* Testnet Wallet / Demo Status Pill */}
            {mode === "TESTNET" ? (
              walletConnected ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E6F4EA] border border-[#CEEAD6] text-xs text-[#137333] font-medium font-mono shadow-2xs">
                  <div className="w-2 h-2 rounded-full bg-[#137333] animate-pulse" />
                  <span>
                    {walletAddress
                      ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                      : "Arbitrum Sepolia"}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onConnectWallet}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#065FD4] hover:bg-[#0553ba] active:scale-95 text-white text-xs font-semibold shadow-xs transition-all duration-150"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Connect</span>
                </button>
              )
            ) : (
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F2F2F2] text-[#606060] text-xs font-medium border border-[#E5E5E5] hover:bg-[#EAEAEA] transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#137333]" />
                <span>Instant Ledger</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* YouTube Style Category Navigation Chips Bar with Soft Color Accents */}
      <div className="bg-white border-t border-[#F2F2F2] px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center space-x-2 overflow-x-auto scrollbar-none">
          {/* Tab 1: Verify Document (Royal Blue Accent) */}
          <button
            type="button"
            onClick={() => onSelectTab("verify")}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 active:scale-95 whitespace-nowrap ${
              currentTab === "verify"
                ? "bg-[#0F0F0F] text-white shadow-xs"
                : "bg-[#F8F9FA] text-[#0F0F0F] hover:bg-[#F2F2F2] border border-[#E5E5E5]"
            }`}
          >
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-lg transition-colors ${
                currentTab === "verify"
                  ? "bg-white/20 text-white"
                  : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
            <span>1. Public Verifier</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                currentTab === "verify"
                  ? "bg-white/20 text-white"
                  : "bg-[#E5E5E5] text-[#606060]"
              }`}
            >
              Zero Login
            </span>
          </button>

          {/* Tab 2: Student Hub (Indigo/Violet Accent) */}
          <button
            type="button"
            onClick={() => onSelectTab("student")}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 active:scale-95 whitespace-nowrap ${
              currentTab === "student"
                ? "bg-[#0F0F0F] text-white shadow-xs"
                : "bg-[#F8F9FA] text-[#0F0F0F] hover:bg-[#F2F2F2] border border-[#E5E5E5]"
            }`}
          >
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-lg transition-colors ${
                currentTab === "student"
                  ? "bg-white/20 text-white"
                  : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
            </span>
            <span>2. Student Hub</span>
          </button>

          {/* Tab 3: University Admin Portal (Emerald/Teal Accent) */}
          <button
            type="button"
            onClick={() => onSelectTab("university")}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 active:scale-95 whitespace-nowrap ${
              currentTab === "university"
                ? "bg-[#0F0F0F] text-white shadow-xs"
                : "bg-[#F8F9FA] text-[#0F0F0F] hover:bg-[#F2F2F2] border border-[#E5E5E5]"
            }`}
          >
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-lg transition-colors ${
                currentTab === "university"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
            </span>
            <span>3. University Admin Portal</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                currentTab === "university"
                  ? "bg-white/20 text-white"
                  : "bg-[#E5E5E5] text-[#606060]"
              }`}
            >
              AISHE Gated
            </span>
          </button>

          {/* Tab 4: Interactive Tamper Lab (Warm Amber/Coral Accent) */}
          <button
            type="button"
            onClick={() => onSelectTab("tamper")}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 active:scale-95 whitespace-nowrap ${
              currentTab === "tamper"
                ? "bg-[#0F0F0F] text-white shadow-xs"
                : "bg-[#F8F9FA] text-[#0F0F0F] hover:bg-[#F2F2F2] border border-[#E5E5E5]"
            }`}
          >
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-lg transition-colors ${
                currentTab === "tamper"
                  ? "bg-white/20 text-white"
                  : "bg-amber-50 text-amber-600 group-hover:bg-amber-100"
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
            </span>
            <span>4. Interactive Tamper Lab</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                currentTab === "tamper"
                  ? "bg-white/20 text-white"
                  : "bg-[#E5E5E5] text-[#606060]"
              }`}
            >
              Playground
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
