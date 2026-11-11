"use client";

import React, { useState, useRef } from "react";
import Papa from "papaparse";
import {
  Building2,
  FileCheck,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  Ban,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Certificate, ExecutionMode } from "@/types";
import {
  SUPPORTED_UNIVERSITIES,
  getUniversityByCode,
  getAllCertificates,
  issueCertificateRecord,
  issueBatchCertificates,
  revokeCertificateRecord,
} from "@/lib/registry";
import { generateCertificatePDF } from "@/lib/pdfGenerator";
import { canonicalizeCredential, computeDigitalFingerprint } from "@/lib/crypto";

interface UniversityPortalProps {
  mode: ExecutionMode;
  walletConnected?: boolean;
  walletAddress?: string;
}

export const UniversityPortal: React.FC<UniversityPortalProps> = ({
  mode,
  walletConnected,
  walletAddress,
}) => {
  const [selectedUniCode, setSelectedUniCode] = useState<number>(1042);
  const [staffPassword, setStaffPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"single" | "bulk" | "manage">(
    "single"
  );

  // Single Form State
  const [studentName, setStudentName] = useState("");
  const [studentRoll, setStudentRoll] = useState("");
  const [degree, setDegree] = useState(
    "Bachelor of Technology in Computer Science & Engineering"
  );
  const [graduationYear, setGraduationYear] = useState(2026);
  const [cgpa, setCgpa] = useState("8.75");
  const [honors, setHonors] = useState("First Class with Distinction");
  const [isIssuingSingle, setIsIssuingSingle] = useState(false);
  const [singleSuccessCert, setSingleSuccessCert] =
    useState<Certificate | null>(null);

  // Bulk CSV State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<
    Array<{
      studentName: string;
      studentRoll: string;
      degree: string;
      graduationYear: number;
      cgpa: number;
      honors: string;
      fingerprint?: string;
    }>
  >([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isAnchoringBatch, setIsAnchoringBatch] = useState(false);
  const [batchSuccessCerts, setBatchSuccessCerts] = useState<Certificate[]>([]);
  const [batchDownloadProgress, setBatchDownloadProgress] = useState<
    string | null
  >(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Manage / Revocation State
  const [searchManage, setSearchManage] = useState("");
  const [revokingCertId, setRevokingCertId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);

  const activeUniversity =
    getUniversityByCode(selectedUniCode) || SUPPORTED_UNIVERSITIES[0];

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  const handleDemoBypass = (uniCode: number) => {
    setSelectedUniCode(uniCode);
    setStaffPassword("admin-authorized-demo");
    setIsLoggedIn(true);
  };

  const handleSingleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentRoll.trim()) {
      alert("Please provide student full name and roll number.");
      return;
    }

    setIsIssuingSingle(true);
    setSingleSuccessCert(null);

    try {
      const newCert = await issueCertificateRecord({
        studentName,
        studentRoll,
        degree,
        graduationYear: Number(graduationYear),
        cgpa: parseFloat(cgpa) || 8.0,
        honors,
        universityCode: activeUniversity.code,
      });

      setSingleSuccessCert(newCert);
      setStudentName("");
      setStudentRoll("");
    } catch (err) {
      console.error(err);
      alert("Failed to anchor certificate to registry ledger.");
    } finally {
      setIsIssuingSingle(false);
    }
  };

  const handleDownloadSampleCSV = () => {
    const csvContent =
      "StudentName,RollNumber,Degree,GraduationYear,CGPA,Honors\n" +
      "Kavita Mehta,2022-CSE-1102,Bachelor of Technology in Computer Science,2026,9.15,First Class with Distinction\n" +
      "Vikramaditya Roy,2022-ECE-0419,Bachelor of Technology in Electronics,2026,8.40,First Class\n" +
      "Simran Kaur,2022-MECH-0921,Bachelor of Technology in Mechanical Engineering,2026,8.90,First Class with Distinction\n" +
      "Aarav Deshmukh,2022-IT-0155,Bachelor of Technology in Information Technology,2026,7.85,Second Class\n" +
      "Meera Nambiar,2022-AI-0732,Bachelor of Technology in Artificial Intelligence,2026,9.50,Chancellor's Gold Medalist";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `FileOk_Graduate_Template_${activeUniversity.shortName}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (file: File) => {
    setCsvFile(file);
    setIsParsing(true);
    setBatchSuccessCerts([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as Array<Record<string, string>>;
          const parsed = await Promise.all(
            rows.map(async (row) => {
              const name =
                row.StudentName || row.studentName || row.Name || "Candidate";
              const roll =
                row.RollNumber || row.rollNumber || row.Roll || "2022-GEN-0000";
              const deg =
                row.Degree ||
                row.degree ||
                "Bachelor of Technology in Engineering";
              const year = parseInt(row.GraduationYear || row.year || "2026", 10);
              const gpa = parseFloat(row.CGPA || row.cgpa || "8.5");
              const hnr = row.Honors || row.honors || "First Class";

              const payload = canonicalizeCredential({
                studentName: name,
                studentRoll: roll,
                degree: deg,
                graduationYear: year,
                cgpa: gpa,
                honors: hnr,
                universityCode: activeUniversity.code,
              });

              const fp = await computeDigitalFingerprint(payload);

              return {
                studentName: name,
                studentRoll: roll,
                degree: deg,
                graduationYear: year,
                cgpa: gpa,
                honors: hnr,
                fingerprint: fp,
              };
            })
          );

          setParsedRows(parsed);
        } catch (e) {
          console.error("Error processing CSV data:", e);
          alert("Error parsing CSV rows. Please ensure valid template headers.");
        } finally {
          setIsParsing(false);
        }
      },
      error: (err) => {
        console.error(err);
        alert("Failed to parse CSV file.");
        setIsParsing(false);
      },
    });
  };

  const handleAnchorBatch = async () => {
    if (parsedRows.length === 0) return;
    setIsAnchoringBatch(true);

    try {
      const records = parsedRows.map((r) => ({
        ...r,
        universityCode: activeUniversity.code,
      }));

      const results = await issueBatchCertificates(records);
      setBatchSuccessCerts(results);
    } catch (e) {
      console.error(e);
      alert("Failed to anchor batch certificates.");
    } finally {
      setIsAnchoringBatch(false);
    }
  };

  const handleBatchDownloadAllPDFs = async () => {
    if (batchSuccessCerts.length === 0) return;
    for (let i = 0; i < batchSuccessCerts.length; i++) {
      const cert = batchSuccessCerts[i];
      setBatchDownloadProgress(
        `Generating ${i + 1} of ${batchSuccessCerts.length}: ${cert.studentName}...`
      );
      await generateCertificatePDF(cert, { download: true });
      await new Promise((r) => setTimeout(r, 400));
    }
    setBatchDownloadProgress(null);
  };

  const handleExecuteRevoke = async () => {
    if (!revokingCertId || !revokeReason.trim()) {
      alert("Please specify the official revocation reason.");
      return;
    }

    setIsRevoking(true);
    try {
      await revokeCertificateRecord(revokingCertId, revokeReason.trim());
      setRevokingCertId(null);
      setRevokeReason("");
    } catch (e) {
      console.error(e);
      alert("Failed to revoke certificate.");
    } finally {
      setIsRevoking(false);
    }
  };

  const allCerts = getAllCertificates();
  const universityCerts = allCerts.filter(
    (c) => c.universityCode === activeUniversity.code
  );
  const activeCount = universityCerts.filter((c) => c.isValid).length;
  const revokedCount = universityCerts.filter((c) => !c.isValid).length;

  const filteredCerts = universityCerts.filter((c) => {
    const q = searchManage.toLowerCase();
    return (
      c.studentName.toLowerCase().includes(q) ||
      c.studentRoll.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F0F0F] tracking-tight">
          University Admin Portal
        </h1>
        <p className="text-sm text-[#606060] max-w-xl mx-auto">
          Authorized university registrars and exam controllers can issue and
          manage tamper-proof degrees individually or in bulk.
        </p>
      </div>

      {!isLoggedIn ? (
        /* Staff Gate Login (YouTube Light Card) */
        <div className="max-w-md mx-auto p-6 sm:p-8 rounded-2xl bg-white border border-[#E5E5E5] shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E5E5E5]">
            <div className="w-10 h-10 rounded-full bg-[#F2F2F2] flex items-center justify-center text-[#0F0F0F]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F0F0F]">
                Institutional Signer Gate
              </h2>
              <p className="text-xs text-[#606060]">
                Select your University AISHE Code
              </p>
            </div>
          </div>

          <form onSubmit={handleStaffLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F0F0F] mb-1">
                Authorized Institution (AISHE)
              </label>
              <select
                value={selectedUniCode}
                onChange={(e) => setSelectedUniCode(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] focus:border-[#065FD4] focus:bg-white text-[#0F0F0F] text-xs sm:text-sm outline-none transition-all"
              >
                {SUPPORTED_UNIVERSITIES.map((uni) => (
                  <option key={uni.code} value={uni.code}>
                    {uni.code} — {uni.name} ({uni.aisheCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F0F0F] mb-1">
                Staff Passkey / Password
              </label>
              <input
                type="password"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                placeholder="Enter password or use 1-click login below"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] focus:border-[#065FD4] focus:bg-white text-[#0F0F0F] text-xs sm:text-sm outline-none transition-all placeholder:text-[#909090]"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#0F0F0F] hover:bg-[#272727] text-white text-sm font-semibold transition-all shadow-xs"
            >
              <span>Authenticate as Institutional Signer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Login Presets */}
          <div className="pt-4 border-t border-[#E5E5E5] space-y-2">
            <span className="text-[11px] font-semibold text-[#606060] uppercase tracking-wider block">
              1-Click Institutional Access:
            </span>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleDemoBypass(1042)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9FA] hover:bg-[#F2F2F2] border border-[#E5E5E5] text-left transition-colors"
              >
                <div>
                  <span className="text-sm font-semibold text-[#0F0F0F]">
                    1042 — Haryana State Tech Univ
                  </span>
                  <p className="text-xs text-[#606060]">
                    AISHE C-1042 • Signer: 0x8920...765A
                  </p>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] font-medium">
                  Select
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoBypass(2091)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9FA] hover:bg-[#F2F2F2] border border-[#E5E5E5] text-left transition-colors"
              >
                <div>
                  <span className="text-sm font-semibold text-[#0F0F0F]">
                    2091 — Delhi Tech University
                  </span>
                  <p className="text-xs text-[#606060]">
                    AISHE U-0097 • Signer: 0x4B08...D2dB
                  </p>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] font-medium">
                  Select
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated Portal Dashboard */
        <div className="space-y-6">
          {/* Institutional Stats Row */}
          {/* Institutional Stats Row with Soft Color Accents & Tactile Hover */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] hover:border-[#D0D0D0] hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#606060] font-medium">
                  Active University
                </span>
                <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-base font-bold text-[#0F0F0F] mt-1 truncate">
                {activeUniversity.name}
              </p>
              <span className="text-xs text-[#065FD4] font-medium">
                {activeUniversity.aisheCode}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] hover:border-[#CEEAD6] hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#606060] font-medium">
                  Total Anchored
                </span>
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileCheck className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-2xl font-bold text-[#0F0F0F] mt-1">
                {universityCerts.length}
              </p>
              <span className="text-xs text-[#137333] font-medium">
                {activeCount} Active in Good Standing
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] hover:border-[#FAD2CF] hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#606060] font-medium">
                  Revoked Credentials
                </span>
                <span className="w-7 h-7 rounded-lg bg-rose-50 text-[#C5221F] flex items-center justify-center">
                  <Ban className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-2xl font-bold text-[#C5221F] mt-1">
                {revokedCount}
              </p>
              <span className="text-xs text-[#606060]">Senate Orders</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] hover:border-indigo-200 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#606060] font-medium">
                  Institutional Signer
                </span>
                <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-xs font-mono text-[#0F0F0F] mt-1.5 break-all">
                {activeUniversity.authorizedSigner}
              </p>
              <span className="text-[11px] text-[#137333] font-medium">
                Authorized Ledger Signer
              </span>
            </div>
          </div>

          {/* Sub Navigation (YouTube Category Pills) */}
          <div className="flex space-x-2 border-b border-[#E5E5E5] pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("single")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95 ${
                activeTab === "single"
                  ? "bg-[#0F0F0F] text-white shadow-xs"
                  : "bg-[#F2F2F2] text-[#0F0F0F] hover:bg-[#E5E5E5]"
              }`}
            >
              <FileCheck className="w-4 h-4 text-emerald-500" />
              <span>Single Degree Issuance</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("bulk")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95 ${
                activeTab === "bulk"
                  ? "bg-[#0F0F0F] text-white shadow-xs"
                  : "bg-[#F2F2F2] text-[#0F0F0F] hover:bg-[#E5E5E5]"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-500" />
              <span>Bulk Batch Issuance (CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("manage")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95 ${
                activeTab === "manage"
                  ? "bg-[#0F0F0F] text-white shadow-xs"
                  : "bg-[#F2F2F2] text-[#0F0F0F] hover:bg-[#E5E5E5]"
              }`}
            >
              <Layers className="w-4 h-4 text-blue-500" />
              <span>Registry Records & Revocation</span>
            </button>
          </div>

          {/* TAB 1: SINGLE DEGREE ISSUANCE */}
          {activeTab === "single" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-white border border-[#E5E5E5] shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
                  <h3 className="text-base font-bold text-[#0F0F0F]">
                    Issue Individual Degree
                  </h3>
                  <span className="text-xs text-[#065FD4] font-medium">
                    AISHE: {activeUniversity.aisheCode}
                  </span>
                </div>

                <form onSubmit={handleSingleIssue} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#0F0F0F] mb-1">
                        Student Full Name *
                      </label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="e.g. Siddharth Verma"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] text-[#0F0F0F] text-xs sm:text-sm focus:border-[#065FD4] focus:bg-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0F0F0F] mb-1">
                        Roll / Reg Number *
                      </label>
                      <input
                        type="text"
                        value={studentRoll}
                        onChange={(e) => setStudentRoll(e.target.value)}
                        placeholder="e.g. 2022-CSE-0914"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] text-[#0F0F0F] text-xs sm:text-sm focus:border-[#065FD4] focus:bg-white outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F0F0F] mb-1">
                      Degree / Academic Program *
                    </label>
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      placeholder="e.g. Bachelor of Technology in Computer Science & Engineering"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] text-[#0F0F0F] text-xs sm:text-sm focus:border-[#065FD4] focus:bg-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#0F0F0F] mb-1">
                        Graduation Year
                      </label>
                      <input
                        type="number"
                        value={graduationYear}
                        onChange={(e) =>
                          setGraduationYear(parseInt(e.target.value, 10))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] text-[#0F0F0F] text-xs sm:text-sm focus:border-[#065FD4] focus:bg-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0F0F0F] mb-1">
                        CGPA (Scale 10.00)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={cgpa}
                        onChange={(e) => setCgpa(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] text-[#0F0F0F] text-xs sm:text-sm focus:border-[#065FD4] focus:bg-white outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#0F0F0F] mb-1">
                        Honors / Division
                      </label>
                      <input
                        type="text"
                        value={honors}
                        onChange={(e) => setHonors(e.target.value)}
                        placeholder="e.g. First Class with Distinction"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] text-[#0F0F0F] text-xs sm:text-sm focus:border-[#065FD4] focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isIssuingSingle}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#0F0F0F] hover:bg-[#272727] text-white text-sm font-semibold transition-all shadow-xs disabled:opacity-50"
                  >
                    {isIssuingSingle ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Anchoring to University Registry Ledger...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Anchor Degree to Official Registry</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Side: Preview & Success Card */}
              <div className="lg:col-span-5 space-y-4">
                {singleSuccessCert ? (
                  <div className="p-6 rounded-2xl border border-[#CEEAD6] bg-[#E6F4EA]/40 space-y-4 shadow-xs">
                    <div className="flex items-center gap-2 text-[#137333] font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Degree Successfully Anchored!</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-[#CEEAD6] space-y-1.5 text-xs font-mono">
                      <div>
                        <span className="text-[#606060]">Certificate ID:</span>{" "}
                        <span className="text-[#0F0F0F] font-bold">
                          {singleSuccessCert.id}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#606060]">Student:</span>{" "}
                        <span className="text-[#0F0F0F]">
                          {singleSuccessCert.studentName} (
                          {singleSuccessCert.studentRoll})
                        </span>
                      </div>
                      <div>
                        <span className="text-[#606060]">Fingerprint:</span>{" "}
                        <span className="text-[#137333] break-all text-[11px]">
                          {singleSuccessCert.digitalFingerprint}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#606060]">Block:</span>{" "}
                        <span className="text-[#0F0F0F]">
                          #{singleSuccessCert.blockNumber}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        generateCertificatePDF(singleSuccessCert, {
                          download: true,
                        })
                      }
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#137333] hover:bg-[#0e5c28] text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Stamped Official PDF</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] text-center space-y-3 shadow-xs">
                    <Sparkles className="w-8 h-8 text-[#065FD4] mx-auto" />
                    <h4 className="text-sm font-bold text-[#0F0F0F]">
                      Instant Credential Anchoring
                    </h4>
                    <p className="text-xs text-[#606060] leading-relaxed">
                      Degrees issued here have their 256-bit Digital Fingerprint
                      anchored to the Official University Registry. Recruiters
                      worldwide can verify credentials without requiring staff
                      email exchanges.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BULK BATCH ISSUANCE (CSV) */}
          {activeTab === "bulk" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl bg-white border border-[#E5E5E5] gap-4 shadow-xs">
                <div>
                  <h3 className="text-base font-bold text-[#0F0F0F]">
                    Bulk Graduate Degree Anchoring
                  </h3>
                  <p className="text-xs text-[#606060] mt-0.5">
                    Upload a spreadsheet of graduating candidates to anchor all
                    credentials in an atomic batch.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSampleCSV}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#0F0F0F] text-xs font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>

              {/* CSV Dropzone */}
              <div
                onClick={() => csvInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-[#CCCCCC] hover:border-[#0F0F0F] rounded-2xl p-8 text-center bg-[#F8F9FA] hover:bg-[#F2F2F2] transition-all space-y-3"
              >
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleCSVUpload(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center text-[#0F0F0F] mx-auto shadow-xs">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F0F0F]">
                    Drop Graduate CSV File Here or Click to Browse
                  </p>
                  <p className="text-xs text-[#606060] mt-1">
                    Accepts comma-separated format: StudentName, RollNumber,
                    Degree, GraduationYear, CGPA, Honors
                  </p>
                </div>

                {csvFile && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#0F0F0F] border border-[#E5E5E5] text-xs font-medium shadow-xs">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#065FD4]" />
                    <span>{csvFile.name}</span>
                  </span>
                )}
              </div>

              {/* Table Preview */}
              {parsedRows.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F0F0F]">
                      Parsed Graduates ({parsedRows.length} Candidates)
                    </span>
                    <button
                      type="button"
                      onClick={handleAnchorBatch}
                      disabled={isAnchoringBatch || batchSuccessCerts.length > 0}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F0F0F] hover:bg-[#272727] disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      {isAnchoringBatch ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Anchoring Batch to Ledger...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Anchor Entire Batch ({parsedRows.length})</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-[#E5E5E5] bg-white shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8F9FA] text-[#606060] font-semibold border-b border-[#E5E5E5]">
                        <tr>
                          <th className="py-3 px-4">#</th>
                          <th className="py-3 px-4">Student Name</th>
                          <th className="py-3 px-4">Roll Number</th>
                          <th className="py-3 px-4">Degree</th>
                          <th className="py-3 px-4">CGPA</th>
                          <th className="py-3 px-4">Computed Fingerprint</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5] text-[#0F0F0F]">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#F8F9FA]">
                            <td className="py-2.5 px-4 text-[#606060]">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-4 font-semibold">
                              {row.studentName}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-[#065FD4]">
                              {row.studentRoll}
                            </td>
                            <td className="py-2.5 px-4 text-[#606060]">
                              {row.degree}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-[#0F0F0F]">
                              {row.cgpa.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-[11px] text-[#137333]">
                              {row.fingerprint
                                ? `${row.fingerprint.slice(0, 14)}...`
                                : "Computing..."}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Batch Success Action Banner */}
              {batchSuccessCerts.length > 0 && (
                <div className="p-6 rounded-2xl border border-[#CEEAD6] bg-[#E6F4EA]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[#137333] font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>
                        Successfully Anchored {batchSuccessCerts.length} Degrees!
                      </span>
                    </div>
                    <p className="text-xs text-[#606060]">
                      All candidate digital fingerprints have been registered to{" "}
                      {activeUniversity.name}.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleBatchDownloadAllPDFs}
                    disabled={!!batchDownloadProgress}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#137333] hover:bg-[#0e5c28] text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {batchDownloadProgress ||
                        `Download All (${batchSuccessCerts.length}) Stamped PDFs`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REGISTRY RECORDS & REVOCATION */}
          {activeTab === "manage" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#606060]" />
                  <input
                    type="text"
                    value={searchManage}
                    onChange={(e) => setSearchManage(e.target.value)}
                    placeholder="Search by student name, roll number, or ID..."
                    className="w-full pl-10 pr-4 py-2 rounded-full bg-[#F8F9FA] border border-[#CCCCCC] text-xs sm:text-sm text-[#0F0F0F] focus:border-[#065FD4] focus:bg-white outline-none"
                  />
                </div>

                <span className="text-xs text-[#606060]">
                  Showing {filteredCerts.length} of {universityCerts.length}{" "}
                  credentials
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#E5E5E5] bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F9FA] text-[#606060] font-semibold border-b border-[#E5E5E5]">
                    <tr>
                      <th className="py-3 px-4">Certificate ID</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Roll</th>
                      <th className="py-3 px-4">Degree</th>
                      <th className="py-3 px-4">CGPA</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5] text-[#0F0F0F]">
                    {filteredCerts.map((cert) => (
                      <tr key={cert.id} className="hover:bg-[#F8F9FA]">
                        <td className="py-3 px-4 font-mono font-bold text-[#065FD4]">
                          {cert.id}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {cert.studentName}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#606060]">
                          {cert.studentRoll}
                        </td>
                        <td className="py-3 px-4 text-[#606060] truncate max-w-[200px]">
                          {cert.degree}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#0F0F0F]">
                          {cert.cgpa.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          {cert.isValid ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E6F4EA] text-[#137333]">
                              Active
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FCE8E6] text-[#C5221F]">
                              Revoked
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              generateCertificatePDF(cert, { download: true })
                            }
                            className="px-3 py-1 rounded-full bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#0F0F0F] text-[11px] font-medium"
                            title="Download PDF"
                          >
                            PDF
                          </button>
                          {cert.isValid && (
                            <button
                              type="button"
                              onClick={() => {
                                setRevokingCertId(cert.id);
                                setRevokeReason("");
                              }}
                              className="px-3 py-1 rounded-full bg-[#FCE8E6] hover:bg-rose-100 text-[#C5221F] text-[11px] font-medium"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Revocation Modal */}
          {revokingCertId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
              <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E5E5] p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 text-[#C5221F] font-bold text-sm">
                  <Ban className="w-5 h-5" />
                  <span>Revoke Academic Credential</span>
                </div>

                <p className="text-xs text-[#606060]">
                  You are about to permanently revoke credential{" "}
                  <strong className="text-[#0F0F0F] font-mono">
                    {revokingCertId}
                  </strong>
                  . This will mark the record as invalid on the Official
                  University Registry.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-[#0F0F0F] mb-1">
                    Official Senate Reference & Disciplinary Reason *
                  </label>
                  <textarea
                    rows={3}
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    placeholder="e.g. Senate Order #SO-2026/89 — Disciplinary action: Academic misconduct & falsification confirmed by Senate."
                    className="w-full p-3 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] text-[#0F0F0F] text-xs outline-none focus:border-[#C5221F]"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-[#606060]">
                      Template:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setRevokeReason(
                          "Senate Order #SO-2026/89 — Disciplinary action: Academic misconduct confirmed by Senate Disciplinary Committee."
                        )
                      }
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#0F0F0F]"
                    >
                      #SO-2026/89 Misconduct
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRevokeReason(
                          "Senate Order #SO-2026/102 — Administrative correction: Duplicate issuance issued under clerical error."
                        )
                      }
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#0F0F0F]"
                    >
                      Administrative Error
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRevokingCertId(null)}
                    className="px-4 py-2 rounded-full bg-[#F2F2F2] text-[#0F0F0F] text-xs font-medium hover:bg-[#E5E5E5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteRevoke}
                    disabled={isRevoking || !revokeReason.trim()}
                    className="px-4 py-2 rounded-full bg-[#C5221F] hover:bg-[#a51a17] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {isRevoking ? "Revoking..." : "Confirm Revocation"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
