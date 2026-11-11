"use client";

import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import { canonicalizeCredential, computeDigitalFingerprint } from "@/lib/crypto";

export const TamperLab: React.FC = () => {
  const authenticBase = {
    studentName: "Rahul Sharma",
    studentRoll: "2022-CSE-0482",
    degree: "Bachelor of Technology in Computer Science & Engineering",
    graduationYear: 2026,
    cgpa: 8.85,
    honors: "First Class with Distinction",
    universityCode: 1042,
    universityName: "Haryana State Tech University",
  };

  const [candidateData, setCandidateData] = useState({ ...authenticBase });
  const [authenticHash, setAuthenticHash] = useState<string>("");
  const [candidateHash, setCandidateHash] = useState<string>("");
  const [isTampered, setIsTampered] = useState(false);

  useEffect(() => {
    const init = async () => {
      const canonical = canonicalizeCredential(authenticBase);
      const hash = await computeDigitalFingerprint(canonical);
      setAuthenticHash(hash);
      setCandidateHash(hash);
    };
    init();
  }, []);

  useEffect(() => {
    const recompute = async () => {
      const canonical = canonicalizeCredential(candidateData);
      const hash = await computeDigitalFingerprint(canonical);
      setCandidateHash(hash);

      const tampered =
        candidateData.cgpa !== authenticBase.cgpa ||
        candidateData.studentName !== authenticBase.studentName ||
        candidateData.studentRoll !== authenticBase.studentRoll ||
        candidateData.graduationYear !== authenticBase.graduationYear ||
        candidateData.honors !== authenticBase.honors;

      setIsTampered(tampered);
    };
    recompute();
  }, [candidateData]);

  const handleResetAuthentic = () => {
    setCandidateData({ ...authenticBase });
  };

  const handleSimulateGradeTamper = () => {
    setCandidateData((prev) => ({
      ...prev,
      cgpa: 9.85,
      honors: "Chancellor's Gold Medalist",
    }));
  };

  const handleSimulateNameTamper = () => {
    setCandidateData((prev) => ({
      ...prev,
      studentName: "Rahul K. Sharma",
    }));
  };

  const renderHashComparison = () => {
    if (!authenticHash || !candidateHash) return null;

    const charsA = authenticHash.split("");
    const charsB = candidateHash.split("");

    return (
      <div className="space-y-3">
        <div className="p-5 rounded-2xl bg-[#F8F9FA] border border-[#E5E5E5] space-y-3 font-mono text-xs">
          <div>
            <div className="flex items-center justify-between text-[#606060] mb-1 font-sans font-medium text-xs">
              <span>Authentic Ledger Fingerprint (Original):</span>
              <span className="text-[11px] text-[#137333] font-medium">
                Anchored at Block #19842103
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E5E5E5] text-[#137333] break-all leading-relaxed shadow-xs">
              {authenticHash}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[#606060] mb-1 font-sans font-medium text-xs">
              <span>Submitted Candidate Fingerprint (Live Computed):</span>
              {isTampered ? (
                <span className="text-[11px] text-[#C5221F] font-bold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  MISMATCH DETECTED
                </span>
              ) : (
                <span className="text-[11px] text-[#137333] font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  PERFECT MATCH
                </span>
              )}
            </div>
            <div
              className={`p-3 rounded-xl border leading-relaxed break-all transition-colors ${
                isTampered
                  ? "bg-[#FCE8E6]/40 border-[#FAD2CF] text-[#0F0F0F]"
                  : "bg-white border-[#CEEAD6] text-[#137333]"
              }`}
            >
              {charsB.map((char, i) => {
                const isMatch = char === charsA[i];
                return (
                  <span
                    key={i}
                    className={
                      !isMatch
                        ? "bg-[#FCE8E6] text-[#C5221F] font-extrabold px-0.5 rounded"
                        : "text-[#0F0F0F]"
                    }
                  >
                    {char}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {isTampered && (
          <div className="p-4 rounded-xl bg-[#FCE8E6] border border-[#FAD2CF] text-xs text-[#0F0F0F] flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-[#C5221F] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#C5221F] block">
                The Cryptographic Avalanche Effect:
              </strong>
              Notice how altering just one number (changing 8.85 to 9.85)
              completely randomizes the 64-character hash. Because the resulting
              fingerprint does not match the Official University Registry, any
              attempted grade modification fails verification instantly.
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Intro Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F0F0F] tracking-tight">
          Interactive Tamper Lab
        </h1>
        <p className="text-sm text-[#606060] max-w-xl mx-auto">
          See firsthand why PDF editing or Photoshop manipulation cannot fool
          the ledger. Modify degree fields below and watch the cryptographic
          digital fingerprint diverge in real-time.
        </p>
      </div>

      {/* Action Controls Bar (YouTube Category Pills with Tactile Micro-Interactions) */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleResetAuthentic}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E6F4EA] hover:bg-emerald-100 hover:scale-[1.02] active:scale-95 text-[#137333] text-xs sm:text-sm font-semibold transition-all duration-150 shadow-2xs hover:shadow-xs"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Load Authentic Sample (CGPA: 8.85)</span>
        </button>

        <button
          type="button"
          onClick={handleSimulateGradeTamper}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FCE8E6] hover:bg-rose-100 hover:scale-[1.02] active:scale-95 text-[#C5221F] text-xs sm:text-sm font-semibold transition-all duration-150 shadow-2xs hover:shadow-xs"
        >
          <Zap className="w-4 h-4" />
          <span>Simulate Grade Tampering (8.85 → 9.85)</span>
        </button>

        <button
          type="button"
          onClick={handleSimulateNameTamper}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FEF7E0] hover:bg-amber-100 hover:scale-[1.02] active:scale-95 text-[#B06000] text-xs sm:text-sm font-semibold transition-all duration-150 shadow-2xs hover:shadow-xs"
        >
          <Sliders className="w-4 h-4" />
          <span>Simulate Name Change</span>
        </button>
      </div>

      {/* Main Interactive Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT COLUMN: AUTHENTIC RECORD */}
        <div className="p-6 rounded-2xl bg-white border border-[#CEEAD6] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#137333]" />
              <h3 className="text-base font-bold text-[#0F0F0F]">
                Original Official Ledger Record
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F4EA] text-[#137333]">
              Immutable
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5]">
              <span className="text-[#606060] block text-[11px]">
                Student Full Name:
              </span>
              <span className="text-[#0F0F0F] font-bold text-sm">
                {authenticBase.studentName}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5]">
              <span className="text-[#606060] block text-[11px]">
                Student Roll Number:
              </span>
              <span className="text-[#065FD4] font-mono font-semibold">
                {authenticBase.studentRoll}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5]">
                <span className="text-[#606060] block text-[11px]">
                  Official CGPA:
                </span>
                <span className="text-[#137333] font-bold text-base">
                  {authenticBase.cgpa.toFixed(2)} / 10.00
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5]">
                <span className="text-[#606060] block text-[11px]">
                  Graduation Year:
                </span>
                <span className="text-[#0F0F0F] font-semibold">
                  {authenticBase.graduationYear}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5]">
              <span className="text-[#606060] block text-[11px]">
                Official Standing:
              </span>
              <span className="text-[#0F0F0F] font-medium">
                {authenticBase.honors}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CANDIDATE / EDITABLE DOCUMENT */}
        <div
          className={`p-6 rounded-2xl bg-white border shadow-xs transition-all space-y-4 ${
            isTampered ? "border-[#FAD2CF]" : "border-[#CEEAD6]"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-2">
              {isTampered ? (
                <ShieldAlert className="w-5 h-5 text-[#C5221F]" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-[#137333]" />
              )}
              <h3 className="text-base font-bold text-[#0F0F0F]">
                Submitted Degree (Edit Any Field)
              </h3>
            </div>
            {isTampered ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FCE8E6] text-[#C5221F]">
                Altered Record
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F4EA] text-[#137333]">
                Authentic Match
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[#606060] block text-[11px] mb-1 font-medium">
                Student Full Name:
              </label>
              <input
                type="text"
                value={candidateData.studentName}
                onChange={(e) =>
                  setCandidateData({
                    ...candidateData,
                    studentName: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] focus:border-[#065FD4] focus:bg-white text-[#0F0F0F] font-semibold text-xs outline-none"
              />
            </div>

            <div>
              <label className="text-[#606060] block text-[11px] mb-1 font-medium">
                Student Roll Number:
              </label>
              <input
                type="text"
                value={candidateData.studentRoll}
                onChange={(e) =>
                  setCandidateData({
                    ...candidateData,
                    studentRoll: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] focus:border-[#065FD4] focus:bg-white text-[#065FD4] font-mono text-xs outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#606060] block text-[11px] mb-1 font-medium">
                  CGPA:
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={candidateData.cgpa}
                  onChange={(e) =>
                    setCandidateData({
                      ...candidateData,
                      cgpa: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                    candidateData.cgpa !== authenticBase.cgpa
                      ? "border-[#C5221F] bg-[#FCE8E6]/40 text-[#C5221F]"
                      : "border-[#CCCCCC] bg-[#F8F9FA] text-[#137333]"
                  }`}
                />
              </div>

              <div>
                <label className="text-[#606060] block text-[11px] mb-1 font-medium">
                  Graduation Year:
                </label>
                <input
                  type="number"
                  value={candidateData.graduationYear}
                  onChange={(e) =>
                    setCandidateData({
                      ...candidateData,
                      graduationYear: parseInt(e.target.value, 10) || 2026,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] focus:border-[#065FD4] text-[#0F0F0F] text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[#606060] block text-[11px] mb-1 font-medium">
                Honors / Distinction:
              </label>
              <input
                type="text"
                value={candidateData.honors}
                onChange={(e) =>
                  setCandidateData({
                    ...candidateData,
                    honors: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] focus:border-[#065FD4] text-[#0F0F0F] text-xs outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Hash Comparison Section */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-[#0F0F0F] flex items-center gap-2">
          <span>Digital Fingerprint Comparison</span>
          {isTampered ? (
            <span className="text-xs text-[#C5221F] font-mono">
              [Status: Tampered / Rejected]
            </span>
          ) : (
            <span className="text-xs text-[#137333] font-mono">
              [Status: Verified Match]
            </span>
          )}
        </h3>

        {renderHashComparison()}
      </div>

      {/* Recruiter / Integrity Explainer Summary Card */}
      <div className="p-6 rounded-2xl bg-[#F8F9FA] border border-[#E5E5E5] text-xs sm:text-sm text-[#0F0F0F] space-y-2">
        <h4 className="text-base font-bold text-[#0F0F0F] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#065FD4]" />
          <span>Why This Protects Employers and Academic Integrity</span>
        </h4>
        <p className="text-[#606060] leading-relaxed">
          In legacy recruitment, applicants could easily alter PDF transcripts or
          scan photoshopped degree certificates. With <strong>VeriDoc</strong>, the
          university anchors the mathematical fingerprint on a public, immutable
          ledger. If even one digit or letter is altered, the resulting
          fingerprint diverges entirely, instantly alerting recruiters before an
          offer letter is extended.
        </p>
      </div>

      {/* DigiLocker / NAD vs Decentralized Ledger Architecture Comparison Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E5E5E5] space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E5E5] gap-2">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F2F2F2] text-[#0F0F0F] mb-1 inline-block">
              System Architecture
            </span>
            <h3 className="text-lg font-bold text-[#0F0F0F]">
              DigiLocker / NAD vs. Decentralized Multi-University Anchoring
            </h3>
          </div>
          <span className="text-xs text-[#606060] font-mono">
            Hybrid Trust Model
          </span>
        </div>

        <p className="text-xs sm:text-sm text-[#606060] leading-relaxed">
          How on-chain hash anchoring complements national centralized repositories
          (like DigiLocker and the National Academic Depository) by eliminating
          single points of failure and enabling frictionless global verification:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Centralized Repositories Box */}
          <div className="p-5 rounded-2xl bg-[#F8F9FA] border border-[#E5E5E5] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F0F0F] uppercase tracking-wider">
                Centralized Repositories (DigiLocker / NAD)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E5E5E5] text-[#606060]">
                Traditional Cloud DB
              </span>
            </div>

            <ul className="space-y-2 text-xs text-[#606060]">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 shrink-0 mt-0.5">•</span>
                <span>
                  <strong>Access Gate:</strong> Requires citizen login (Aadhaar / OTP) or registered institutional API keys to fetch credentials.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 shrink-0 mt-0.5">•</span>
                <span>
                  <strong>Single Point of Failure:</strong> Scheduled server maintenance, central gateway downtime, or portal migration disrupts verification.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 shrink-0 mt-0.5">•</span>
                <span>
                  <strong>International Recruiter Friction:</strong> Foreign employers, visa officers, and overseas talent acquisition lack direct API access.
                </span>
              </li>
            </ul>
          </div>

          {/* Decentralized Ledger Box */}
          <div className="p-5 rounded-2xl bg-white border border-[#CEEAD6] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#137333] uppercase tracking-wider">
                VeriDoc Decentralized Trust Network
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] font-semibold">
                Immutable Ledger
              </span>
            </div>

            <ul className="space-y-2 text-xs text-[#0F0F0F]">
              <li className="flex items-start gap-2">
                <span className="text-[#137333] font-bold shrink-0 mt-0.5">✓</span>
                <span>
                  <strong>100% Zero-Login Verifier:</strong> Recruiters, visa officers, and HR can verify in milliseconds without account registration.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#137333] font-bold shrink-0 mt-0.5">✓</span>
                <span>
                  <strong>Zero Downtime / High Availability:</strong> Anchored cryptographically to decentralized EVM nodes with 100% global uptime.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#137333] font-bold shrink-0 mt-0.5">✓</span>
                <span>
                  <strong>Complete Data Privacy:</strong> Only the 256-bit Digital Fingerprint is stored on-chain. Student PII remains in university and student possession.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5] text-xs text-[#606060]">
          <strong className="text-[#0F0F0F]">The Ideal Symbiosis:</strong> DigiLocker serves as the sovereign student locker for document issuance and storage, while VeriDoc anchors the cryptographic fingerprint on a public ledger for frictionless, cross-border employer verification.
        </div>
      </div>
    </div>
  );
};
