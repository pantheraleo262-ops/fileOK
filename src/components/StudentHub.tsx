"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  Download,
  Share2,
  ExternalLink,
  CheckCircle,
  Copy,
  Lock,
  ArrowRight,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Certificate } from "@/types";
import {
  SUPPORTED_UNIVERSITIES,
  getCertificateByRoll,
} from "@/lib/registry";
import { generateCertificatePDF } from "@/lib/pdfGenerator";

export const StudentHub: React.FC = () => {
  const [selectedUniCode, setSelectedUniCode] = useState<number>(1042);
  const [rollNumber, setRollNumber] = useState("");
  const [activeCertificate, setActiveCertificate] =
    useState<Certificate | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!rollNumber.trim()) {
      setErrorMessage("Please enter your official student roll number.");
      return;
    }

    const cert = getCertificateByRoll(selectedUniCode, rollNumber.trim());
    if (!cert) {
      setErrorMessage(
        `No credential found for Roll Number "${rollNumber.trim()}" under the selected university. Please check your roll number or select a demo sample below.`
      );
      return;
    }

    setActiveCertificate(cert);
  };

  const handleDemoLogin = (uniCode: number, roll: string) => {
    setSelectedUniCode(uniCode);
    setRollNumber(roll);
    setErrorMessage("");
    const cert = getCertificateByRoll(uniCode, roll);
    if (cert) {
      setActiveCertificate(cert);
    }
  };

  const handleDownloadPDF = async () => {
    if (!activeCertificate) return;
    setIsDownloading(true);
    try {
      await generateCertificatePDF(activeCertificate, { download: true });
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const getPublicVerificationUrl = (certId: string) => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://veridoc.academic";
    return `${origin}/?tab=verify&id=${encodeURIComponent(certId)}`;
  };

  const handleCopyLink = () => {
    if (!activeCertificate) return;
    const url = getPublicVerificationUrl(activeCertificate.id);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getLinkedInAddCertificationUrl = (cert: Certificate) => {
    const baseUrl = "https://www.linkedin.com/profile/add";
    const params = new URLSearchParams({
      startTask: "CERTIFICATION_NAME",
      name: cert.degree,
      organizationName: cert.universityName,
      issueYear: cert.graduationYear.toString(),
      issueMonth: "6",
      certId: cert.id,
      certUrl: getPublicVerificationUrl(cert.id),
    });
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Head banner */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F0F0F] tracking-tight">
          Student Self-Service Hub
        </h1>
        <p className="text-sm text-[#606060] max-w-lg mx-auto">
          Access and share your tamper-proof academic degrees. Sign in with your
          University Code and Roll Number.
        </p>
      </div>

      {!activeCertificate ? (
        /* Access Gate Form (YouTube Light Card) */
        <div className="max-w-md mx-auto p-6 sm:p-8 rounded-2xl bg-white border border-[#E5E5E5] shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E5E5E5]">
            <div className="w-10 h-10 rounded-full bg-[#F2F2F2] flex items-center justify-center text-[#0F0F0F]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F0F0F]">
                Student Credential Access
              </h2>
              <p className="text-xs text-[#606060]">
                Official Institutional Registry Login
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F0F0F] mb-1">
                Issuing University
              </label>
              <select
                value={selectedUniCode}
                onChange={(e) => setSelectedUniCode(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] focus:border-[#065FD4] focus:bg-white text-[#0F0F0F] text-xs sm:text-sm outline-none transition-all"
              >
                {SUPPORTED_UNIVERSITIES.map((uni) => (
                  <option key={uni.code} value={uni.code}>
                    {uni.code} — {uni.name} ({uni.shortName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F0F0F] mb-1">
                Student Roll / Registration Number
              </label>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. 2022-CSE-0482"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] focus:border-[#065FD4] focus:bg-white text-[#0F0F0F] text-xs sm:text-sm outline-none transition-all placeholder:text-[#909090]"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-[#C5221F] bg-[#FCE8E6] rounded-xl p-3">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#0F0F0F] hover:bg-[#272727] active:scale-95 text-white text-sm font-semibold transition-all duration-150 shadow-xs hover:shadow-sm"
            >
              <span>Access My Credentials</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Login Chips (YouTube List Style with Tactile Hover) */}
          <div className="pt-4 border-t border-[#E5E5E5] space-y-2">
            <span className="text-[11px] font-semibold text-[#606060] uppercase tracking-wider block">
              1-Click Demo Graduate Logins:
            </span>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin(1042, "2022-CSE-0482")}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9FA] hover:bg-indigo-50/30 hover:border-indigo-200 border border-[#E5E5E5] text-left hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-150 shadow-2xs"
              >
                <div>
                  <span className="text-sm font-semibold text-[#0F0F0F]">
                    Rahul Sharma
                  </span>
                  <p className="text-xs text-[#606060]">
                    HSTU (1042) • Roll: 2022-CSE-0482
                  </p>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] font-medium">
                  Active
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin(2091, "2022-ECE-1092")}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9FA] hover:bg-indigo-50/30 hover:border-indigo-200 border border-[#E5E5E5] text-left hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-150 shadow-2xs"
              >
                <div>
                  <span className="text-sm font-semibold text-[#0F0F0F]">
                    Priya Patel
                  </span>
                  <p className="text-xs text-[#606060]">
                    DTU (2091) • Roll: 2022-ECE-1092
                  </p>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] font-medium">
                  Active
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated Student Dashboard */
        <div className="space-y-6">
          {/* Top Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white border border-[#E5E5E5] gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#137333]">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#0F0F0F]">
                  Welcome, {activeCertificate.studentName}
                </h2>
                <p className="text-xs text-[#606060]">
                  Official Academic Record // {activeCertificate.universityName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F2F2F2] hover:bg-[#E5E5E5] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 text-[#0F0F0F] text-xs font-semibold transition-all duration-150 shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? "Copied!" : "Copy Public Link"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLinkedInModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 text-white text-xs font-semibold transition-all duration-150 shadow-xs hover:shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Add to LinkedIn</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCertificate(null)}
                className="flex items-center gap-1 px-3 py-2 rounded-full bg-[#F2F2F2] hover:bg-[#E5E5E5] active:scale-95 text-[#606060] hover:text-[#0F0F0F] text-xs transition-all duration-150"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Elegant Certificate Preview Card */}
          <div className="relative rounded-3xl border-2 border-[#D4AF37] bg-gradient-to-b from-[#FEFEFC] to-[#FAF8F2] p-8 sm:p-12 shadow-sm overflow-hidden text-[#0F0F0F]">
            {/* Corner Decorative Lines */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#D4AF37]" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#D4AF37]" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#D4AF37]" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#D4AF37]" />

            <div className="relative z-10 text-center space-y-6">
              {/* Seal */}
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full bg-[#1E3A8A] flex items-center justify-center text-[#D4AF37] font-serif font-bold text-xs shadow-md ring-4 ring-[#D4AF37]/30">
                  VERITAS
                </div>
              </div>

              {/* Institution Title */}
              <div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E3A8A] tracking-wide uppercase">
                  {activeCertificate.universityName}
                </h3>
                <p className="text-xs text-[#606060] tracking-widest uppercase font-mono mt-1">
                  OFFICIAL DEGREE OF CONFERMENT // CODE:{" "}
                  {activeCertificate.universityCode}
                </p>
              </div>

              <div className="w-28 h-[1px] bg-[#D4AF37] mx-auto" />

              <p className="text-xs sm:text-sm text-[#606060] italic font-serif">
                This is to certify that
              </p>

              {/* Student Name */}
              <div className="space-y-1">
                <h2 className="text-3xl sm:text-4xl font-serif font-extrabold text-[#0F0F0F] tracking-tight">
                  {activeCertificate.studentName}
                </h2>
                <p className="text-xs font-mono text-[#065FD4] font-semibold tracking-wider">
                  REGISTRATION NO: {activeCertificate.studentRoll}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-[#606060] italic font-serif max-w-lg mx-auto">
                having satisfied all the curriculum requirements and Senate
                regulations, is admitted to the degree of
              </p>

              {/* Degree */}
              <div className="py-2">
                <h4 className="text-xl sm:text-2xl font-serif font-bold text-[#1E3A8A]">
                  {activeCertificate.degree}
                </h4>
                <div className="inline-flex items-center gap-2 mt-2 px-4 py-1 rounded-full bg-amber-50 border border-amber-200 text-[#B06000] text-xs font-semibold">
                  <span>Class of {activeCertificate.graduationYear}</span>
                  <span>•</span>
                  <span>CGPA: {activeCertificate.cgpa.toFixed(2)} / 10.00</span>
                  <span>•</span>
                  <span>{activeCertificate.honors}</span>
                </div>
              </div>

              {/* Signatures & Footer metadata */}
              <div className="pt-6 border-t border-[#E5E5E5] flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div>
                  <span className="text-[10px] text-[#606060] font-mono uppercase block">
                    Certificate Credential ID
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0F0F0F]">
                    {activeCertificate.id}
                  </span>
                </div>

                <div className="text-center sm:text-right">
                  <span className="text-[10px] text-[#606060] font-mono uppercase block">
                    Digital Fingerprint
                  </span>
                  <span className="text-[11px] font-mono text-[#137333] font-medium break-all">
                    {activeCertificate.digitalFingerprint.slice(0, 22)}...
                    {activeCertificate.digitalFingerprint.slice(-10)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-[#0F0F0F] hover:bg-[#272727] hover:-translate-y-0.5 active:translate-y-0 active:scale-98 text-white font-semibold text-sm transition-all duration-150 shadow-xs hover:shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>
                {isDownloading
                  ? "Generating Stamped PDF..."
                  : "Download Official Certified PDF"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-[#F2F2F2] hover:bg-[#E5E5E5] hover:-translate-y-0.5 active:translate-y-0 active:scale-98 text-[#0F0F0F] font-semibold text-sm transition-all duration-150 shadow-2xs"
            >
              <Copy className="w-4 h-4" />
              <span>
                {copiedLink ? "Link Copied!" : "Copy Public Verification Link"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* LinkedIn Certification Modal */}
      {showLinkedInModal && activeCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E5E5] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
              <div className="flex items-center gap-2 text-[#0F0F0F] font-bold text-sm">
                <Share2 className="w-4 h-4 text-[#0A66C2]" />
                <span>Add Degree to LinkedIn Profile</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkedInModal(false)}
                className="text-[#606060] hover:text-[#0F0F0F] text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#606060]">
              Recruiters can click the credential link directly on your LinkedIn
              profile to verify your degree authenticity in 1-click.
            </p>

            <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5] space-y-2 text-xs">
              <div>
                <span className="text-[#606060]">Degree:</span>{" "}
                <span className="text-[#0F0F0F] font-semibold">
                  {activeCertificate.degree}
                </span>
              </div>
              <div>
                <span className="text-[#606060]">Issuing Org:</span>{" "}
                <span className="text-[#0F0F0F] font-semibold">
                  {activeCertificate.universityName}
                </span>
              </div>
              <div>
                <span className="text-[#606060]">Credential ID:</span>{" "}
                <span className="text-[#065FD4] font-mono font-medium">
                  {activeCertificate.id}
                </span>
              </div>
              <div>
                <span className="text-[#606060]">Verification URL:</span>{" "}
                <span className="text-[#137333] font-mono text-[10px] break-all">
                  {getPublicVerificationUrl(activeCertificate.id)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkedInModal(false)}
                className="px-4 py-2 rounded-full bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#0F0F0F] text-xs font-medium"
              >
                Close
              </button>
              <a
                href={getLinkedInAddCertificationUrl(activeCertificate)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <span>Open LinkedIn Form</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
