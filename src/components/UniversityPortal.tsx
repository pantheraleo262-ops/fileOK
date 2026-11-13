"use client";

import React, { useState, useEffect, useRef } from "react";
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
  UserCheck,
  Award,
  Clock,
  Send,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Certificate, ExecutionMode, StaffRole, PendingApproval } from "@/types";
import {
  SUPPORTED_UNIVERSITIES,
  getUniversityByCode,
  getAllCertificates,
  issueCertificateRecord,
  issueBatchCertificates,
  revokeCertificateRecord,
  getPendingApprovals,
  addPendingApproval,
  updatePendingApprovalStatus,
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
  const [activeTab, setActiveTab] = useState<
    "single" | "bulk" | "queue" | "manage"
  >("single");

  // Two-Person Governance Role (Clerk vs Registrar)
  const [staffRole, setStaffRole] = useState<StaffRole>("REGISTRAR");
  const [pendingQueue, setPendingQueue] = useState<PendingApproval[]>([]);
  const [clerkNotice, setClerkNotice] = useState<string | null>(null);
  const [registrarNotice, setRegistrarNotice] = useState<string | null>(null);
  const [isProcessingApproval, setIsProcessingApproval] = useState<string | null>(null);

  // Single Form State
  const [studentName, setStudentName] = useState("");
  const [studentRoll, setStudentRoll] = useState("");
  const [degree, setDegree] = useState(
    "Bachelor of Technology in Computer Science & Engineering"
  );
  const [graduationYear, setGraduationYear] = useState(2026);
  const [cgpa, setCgpa] = useState("8.75");
  const [honors, setHonors] = useState("First Class with Distinction");
  const [ipfsCid, setIpfsCid] = useState("");
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
      ipfsCid?: string;
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

  useEffect(() => {
    setPendingQueue(getPendingApprovals());
  }, []);

  const refreshQueue = () => {
    setPendingQueue(getPendingApprovals());
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  const handleDemoBypass = (uniCode: number) => {
    setSelectedUniCode(uniCode);
    setStaffPassword("admin-authorized-demo");
    setIsLoggedIn(true);
  };

  // Exam Clerk submit single
  const handleClerkSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentRoll.trim()) {
      alert("Please provide student full name and roll number.");
      return;
    }

    const newReqId = `REQ-${activeUniversity.shortName}-${Date.now().toString().slice(-6)}`;
    const newPending: PendingApproval = {
      id: newReqId,
      type: "SINGLE",
      preparedBy: "Exam Clerk (Academic Section)",
      submittedAt: new Date().toISOString(),
      universityCode: activeUniversity.code,
      universityName: activeUniversity.name,
      status: "PENDING",
      singleRecord: {
        studentName: studentName.trim(),
        studentRoll: studentRoll.trim().toUpperCase(),
        degree: degree.trim(),
        graduationYear: Number(graduationYear),
        cgpa: parseFloat(cgpa) || 8.0,
        honors: honors.trim() || "Pass Division",
        ipfsCid: ipfsCid.trim() || undefined,
      },
    };

    addPendingApproval(newPending);
    refreshQueue();
    setClerkNotice(
      `Degree record for ${studentName.trim()} submitted to the Registrar Approval Queue (ID: ${newReqId}). Switch to "Registrar / Dean" view to sign off and anchor onto the blockchain.`
    );
    setStudentName("");
    setStudentRoll("");
    setIpfsCid("");
  };

  // Registrar direct issue
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
        ipfsCid: ipfsCid.trim() || undefined,
        preparedBy: "Exam Clerk (Academic Section)",
        approvedBy: "Prof. S. K. Bansal (Registrar)",
      });

      setSingleSuccessCert(newCert);
      setStudentName("");
      setStudentRoll("");
      setIpfsCid("");
    } catch (err) {
      console.error(err);
      alert("Failed to anchor certificate to registry ledger.");
    } finally {
      setIsIssuingSingle(false);
    }
  };

  // Exam Clerk submit batch
  const handleClerkSubmitBatch = () => {
    if (parsedRows.length === 0) return;

    const newReqId = `REQ-${activeUniversity.shortName}-BATCH-${Date.now().toString().slice(-5)}`;
    const newPending: PendingApproval = {
      id: newReqId,
      type: "BATCH",
      preparedBy: "Exam Clerk (Academic Section)",
      submittedAt: new Date().toISOString(),
      universityCode: activeUniversity.code,
      universityName: activeUniversity.name,
      status: "PENDING",
      batchRecords: parsedRows.map((r) => ({
        studentName: r.studentName,
        studentRoll: r.studentRoll,
        degree: r.degree,
        graduationYear: r.graduationYear,
        cgpa: r.cgpa,
        honors: r.honors,
        ipfsCid: r.ipfsCid,
      })),
    };

    addPendingApproval(newPending);
    refreshQueue();
    setClerkNotice(
      `Batch of ${parsedRows.length} graduate records submitted to Registrar Approval Queue (ID: ${newReqId}). Switch to "Registrar / Dean" view to sign off.`
    );
    setParsedRows([]);
    setCsvFile(null);
  };

  // Registrar approve pending request from queue
  const handleApproveQueueItem = async (item: PendingApproval) => {
    setIsProcessingApproval(item.id);
    try {
      if (item.type === "SINGLE" && item.singleRecord) {
        const cert = await issueCertificateRecord({
          ...item.singleRecord,
          universityCode: item.universityCode,
          preparedBy: item.preparedBy,
          approvedBy: "Prof. S. K. Bansal (Registrar)",
        });
        updatePendingApprovalStatus(item.id, "APPROVED", {
          approvedBy: "Prof. S. K. Bansal (Registrar)",
        });
        refreshQueue();
        setRegistrarNotice(
          `Approved & Anchored Certificate ${cert.id} for ${cert.studentName} onto the Registry Ledger (Block #${cert.blockNumber})!`
        );
      } else if (item.type === "BATCH" && item.batchRecords) {
        const results = await issueBatchCertificates(
          item.batchRecords.map((r) => ({
            ...r,
            universityCode: item.universityCode,
          })),
          {
            preparedBy: item.preparedBy,
            approvedBy: "Prof. S. K. Bansal (Registrar)",
          }
        );
        updatePendingApprovalStatus(item.id, "APPROVED", {
          approvedBy: "Prof. S. K. Bansal (Registrar)",
        });
        refreshQueue();
        setRegistrarNotice(
          `Approved & Anchored Batch of ${results.length} graduate degrees onto the Registry Ledger!`
        );
      }
    } catch (e) {
      console.error(e);
      alert("Failed to approve and anchor pending request.");
    } finally {
      setIsProcessingApproval(null);
    }
  };

  // Registrar reject pending request
  const handleRejectQueueItem = (item: PendingApproval) => {
    const reason =
      prompt(
        "Enter official reason for rejection / return:",
        "Returned for revision: Discrepancy in course credits or graduation list."
      ) || "Discrepancy in candidate records";

    updatePendingApprovalStatus(item.id, "REJECTED", { reason });
    refreshQueue();
    setRegistrarNotice(`Request ${item.id} rejected and returned to Exam Clerk.`);
  };

  const handleDownloadSampleCSV = () => {
    const csvContent =
      "StudentName,RollNumber,Degree,GraduationYear,CGPA,Honors,IPFS_CID\n" +
      "Kavita Mehta,2022-CSE-1102,Bachelor of Technology in Computer Science,2026,9.15,First Class with Distinction,QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco\n" +
      "Vikramaditya Roy,2022-ECE-0419,Bachelor of Technology in Electronics,2026,8.40,First Class,QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx\n" +
      "Simran Kaur,2022-MECH-0921,Bachelor of Technology in Mechanical Engineering,2026,8.90,First Class with Distinction,QmRazDog1ndsp965eD5S6g8fePjR7aLgQe9XjX5k285hT2\n" +
      "Aarav Deshmukh,2022-IT-0155,Bachelor of Technology in Information Technology,2026,7.85,Second Class,\n" +
      "Meera Nambiar,2022-AI-0732,Bachelor of Technology in Artificial Intelligence,2026,9.50,Chancellor's Gold Medalist,QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

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
    setClerkNotice(null);

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
              const cid = row.IPFS_CID || row.ipfs_cid || row.ipfsCid || undefined;

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
                ipfsCid: cid,
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

      const results = await issueBatchCertificates(records, {
        preparedBy: "Exam Clerk (Academic Section)",
        approvedBy: "Prof. S. K. Bansal (Registrar)",
      });
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

  const pendingItemsForUni = pendingQueue.filter(
    (q) => q.status === "PENDING" && q.universityCode === activeUniversity.code
  );
  const pendingCount = pendingItemsForUni.length;

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
          govern immutable, tamper-proof student degrees on-chain.
        </p>
      </div>

      {!isLoggedIn ? (
        /* Access Gate */
        <div className="max-w-md mx-auto p-6 sm:p-8 rounded-2xl bg-white border border-[#E5E5E5] shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E5E5E5]">
            <div className="w-10 h-10 rounded-full bg-[#F2F2F2] flex items-center justify-center text-[#0F0F0F]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F0F0F]">
                University Staff Gate
              </h2>
              <p className="text-xs text-[#606060]">
                Institutional Signer & AISHE Authentication
              </p>
            </div>
          </div>

          <form onSubmit={handleStaffLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F0F0F] mb-1">
                Select Your Institution
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
                Staff Passcode
              </label>
              <input
                type="password"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                placeholder="Enter authorized credential passcode"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] focus:border-[#065FD4] focus:bg-white text-[#0F0F0F] text-xs sm:text-sm outline-none transition-all placeholder:text-[#909090]"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#0F0F0F] hover:bg-[#272727] text-white text-sm font-semibold transition-all shadow-xs"
            >
              <span>Authenticate Staff Access</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Selector */}
          <div className="pt-4 border-t border-[#E5E5E5] space-y-2">
            <span className="text-[11px] font-semibold text-[#606060] uppercase tracking-wider block">
              1-Click Demo University Logins:
            </span>
            <div className="flex flex-col gap-2">
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

            <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] hover:border-[#FEF7E0] hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#606060] font-medium">
                  Pending Registrar Approval
                </span>
                <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-2xl font-bold text-[#0F0F0F] mt-1">
                {pendingCount}
              </p>
              <span className="text-xs text-[#B06000] font-medium">
                {pendingCount > 0 ? "Awaiting Sign-Off" : "Queue Empty"}
              </span>
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

          {/* TWO-PERSON GOVERNANCE ROLE SWITCHER BANNER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5E5] shadow-xs gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5] flex items-center justify-center text-[#0F0F0F] shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#065FD4]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#0F0F0F]">
                    Two-Person Approval & Insider Fraud Prevention
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#065FD4] font-semibold border border-blue-200">
                    Dual Governance Active
                  </span>
                </div>
                <p className="text-xs text-[#606060] mt-0.5">
                  {staffRole === "CLERK" ? (
                    <span>
                      <strong className="text-[#0F0F0F]">Exam Clerk Mode:</strong> Records are staged to the Registrar Approval Queue to prevent single-person tampering.
                    </span>
                  ) : (
                    <span>
                      <strong className="text-[#065FD4]">Registrar / Dean Mode:</strong> Review, reject, or officially sign off and anchor pending student degrees onto the blockchain.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Role Switcher Pill */}
            <div className="inline-flex items-center p-1 rounded-full bg-[#F2F2F2] border border-[#E5E5E5] text-xs shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setStaffRole("CLERK");
                  setClerkNotice(null);
                  setRegistrarNotice(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold transition-all duration-150 active:scale-95 ${
                  staffRole === "CLERK"
                    ? "bg-[#0F0F0F] text-white shadow-xs"
                    : "text-[#606060] hover:text-[#0F0F0F] hover:bg-[#E5E5E5]"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Exam Clerk (Preparer)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStaffRole("REGISTRAR");
                  setClerkNotice(null);
                  setRegistrarNotice(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold transition-all duration-150 active:scale-95 ${
                  staffRole === "REGISTRAR"
                    ? "bg-[#065FD4] text-white shadow-xs"
                    : "text-[#606060] hover:text-[#0F0F0F] hover:bg-[#E5E5E5]"
                }`}
              >
                <Award className="w-3.5 h-3.5 text-white" />
                <span>Registrar / Dean (Approver)</span>
              </button>
            </div>
          </div>

          {/* Feedback Banners */}
          {clerkNotice && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-[#B06000] shadow-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{clerkNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStaffRole("REGISTRAR");
                  setActiveTab("queue");
                }}
                className="underline font-bold hover:text-[#0F0F0F] ml-3 shrink-0"
              >
                Switch to Registrar & View Queue →
              </button>
            </div>
          )}

          {registrarNotice && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#E6F4EA] border border-[#CEEAD6] text-xs text-[#137333] shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{registrarNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setRegistrarNotice(null)}
                className="underline font-semibold ml-3 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Sub Navigation (YouTube Category Pills) */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E5E5] pb-3">
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
              onClick={() => setActiveTab("queue")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95 ${
                activeTab === "queue"
                  ? "bg-[#0F0F0F] text-white shadow-xs"
                  : "bg-[#F2F2F2] text-[#0F0F0F] hover:bg-[#E5E5E5]"
              }`}
            >
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Pending Approval Queue</span>
              {pendingCount > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-[#B06000] text-white text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
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
                  <div>
                    <h3 className="text-base font-bold text-[#0F0F0F]">
                      {staffRole === "CLERK"
                        ? "Prepare & Stage Individual Degree (Exam Clerk)"
                        : "Issue & Anchor Individual Degree (Registrar / Dean)"}
                    </h3>
                    <p className="text-xs text-[#606060]">
                      {staffRole === "CLERK"
                        ? "Staged to the Registrar sign-off queue for anti-fraud validation."
                        : "Authorized institutional signature anchors directly to the public ledger."}
                    </p>
                  </div>
                  <span className="text-xs text-[#065FD4] font-medium font-mono">
                    {activeUniversity.aisheCode}
                  </span>
                </div>

                <form
                  onSubmit={
                    staffRole === "CLERK"
                      ? handleClerkSubmitSingle
                      : handleSingleIssue
                  }
                  className="space-y-4"
                >
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

                  {/* Optional IPFS CID Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#0F0F0F] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        <span>IPFS Document CID (Optional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setIpfsCid("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco")
                        }
                        className="text-[11px] text-[#065FD4] hover:underline font-medium"
                      >
                        Fill Sample CID
                      </button>
                    </div>
                    <input
                      type="text"
                      value={ipfsCid}
                      onChange={(e) => setIpfsCid(e.target.value)}
                      placeholder="e.g. QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] text-[#0F0F0F] text-xs sm:text-sm focus:border-[#065FD4] focus:bg-white outline-none font-mono placeholder:text-[#909090]"
                    />
                    <p className="text-[10px] text-[#606060] mt-1">
                      Enables recruiters to view the original diploma on decentralized IPFS gateways.
                    </p>
                  </div>

                  {staffRole === "CLERK" ? (
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#0F0F0F] hover:bg-[#272727] text-white text-sm font-semibold transition-all shadow-xs active:scale-95"
                    >
                      <Send className="w-4 h-4 text-amber-400" />
                      <span>Submit for Registrar Approval</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isIssuingSingle}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#0F0F0F] hover:bg-[#272727] text-white text-sm font-semibold transition-all shadow-xs disabled:opacity-50 active:scale-95"
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
                  )}
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
                        <span className="text-[#606060]">Signer:</span>{" "}
                        <span className="text-[#0F0F0F] break-all text-[11px]">
                          {singleSuccessCert.institutionalSigner}
                        </span>
                      </div>
                      {singleSuccessCert.ipfsCid && (
                        <div>
                          <span className="text-[#606060]">IPFS CID:</span>{" "}
                          <span className="text-[#065FD4] break-all text-[11px]">
                            {singleSuccessCert.ipfsCid}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-[#606060]">Block Anchored:</span>{" "}
                        <span className="text-[#0F0F0F]">
                          #{singleSuccessCert.blockNumber}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          generateCertificatePDF(singleSuccessCert, {
                            download: true,
                          })
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-[#137333] hover:bg-[#0e5c28] text-white text-xs font-semibold transition-colors shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Certified PDF</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-[#F8F9FA] border border-[#E5E5E5] space-y-3">
                    <span className="text-xs font-bold text-[#0F0F0F] uppercase tracking-wider block">
                      Live Ledger Preview
                    </span>
                    <p className="text-xs text-[#606060] leading-relaxed">
                      As credentials are created, client-side SubtleCrypto
                      computes the deterministic SHA-256 digital fingerprint
                      over the student payload before ledger transmission.
                    </p>
                    <div className="p-3 rounded-xl bg-white border border-[#E5E5E5] text-xs font-mono text-[#606060] space-y-1">
                      <div>Signer: {activeUniversity.authorizedSigner}</div>
                      <div>Accreditation: {activeUniversity.accreditation}</div>
                      <div>Format: CANONICAL-FILEOK-SHA256</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BULK BATCH ISSUANCE (CSV) */}
          {activeTab === "bulk" && (
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E5E5E5] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E5E5] gap-4">
                <div>
                  <h3 className="text-base font-bold text-[#0F0F0F]">
                    {staffRole === "CLERK"
                      ? "Bulk Graduate Staging (Exam Clerk)"
                      : "Bulk Graduate Batch Anchoring (Registrar / Dean)"}
                  </h3>
                  <p className="text-xs text-[#606060]">
                    Upload a class CSV of graduates to compute individual digital
                    fingerprints and stage or anchor them in a single operation.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSampleCSV}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#0F0F0F] text-xs font-semibold transition-colors shrink-0 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>

              {/* Upload Drop Area */}
              <div
                onClick={() => csvInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-[#CCCCCC] hover:border-[#0F0F0F] rounded-2xl p-8 sm:p-10 text-center bg-[#F8F9FA] hover:bg-[#F2F2F2] transition-colors space-y-3"
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
                    Degree, GraduationYear, CGPA, Honors, IPFS_CID
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-bold text-[#0F0F0F]">
                      Parsed Graduates ({parsedRows.length} Candidates)
                    </span>
                    {staffRole === "CLERK" ? (
                      <button
                        type="button"
                        onClick={handleClerkSubmitBatch}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F0F0F] hover:bg-[#272727] text-white text-xs font-semibold transition-colors shadow-xs active:scale-95"
                      >
                        <Send className="w-4 h-4 text-amber-400" />
                        <span>Submit Batch for Registrar Approval ({parsedRows.length})</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAnchorBatch}
                        disabled={isAnchoringBatch || batchSuccessCerts.length > 0}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F0F0F] hover:bg-[#272727] disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-xs active:scale-95"
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
                    )}
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

          {/* TAB 3: TWO-PERSON APPROVAL QUEUE */}
          {activeTab === "queue" && (
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E5E5E5] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E5E5] gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#0F0F0F] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <span>Pending Registrar Sign-Off Queue</span>
                  </h3>
                  <p className="text-xs text-[#606060] mt-0.5">
                    Two-step anti-fraud validation. Exam Clerk prepares and stages
                    candidates; only authorized Registrar / Dean credentials can
                    anchor them on-chain.
                  </p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-[#F2F2F2] text-[#0F0F0F] font-semibold font-mono">
                  {pendingItemsForUni.length} Pending for {activeUniversity.shortName}
                </span>
              </div>

              {pendingQueue.length === 0 ? (
                <div className="text-center py-12 text-[#606060] space-y-2">
                  <CheckCircle className="w-10 h-10 text-[#137333] mx-auto opacity-70" />
                  <p className="text-sm font-semibold text-[#0F0F0F]">
                    Approval Queue is Completely Clear!
                  </p>
                  <p className="text-xs">
                    No pending degree submissions are awaiting registrar approval.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingQueue.map((item) => (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border transition-all duration-150 space-y-3 ${
                        item.status === "PENDING"
                          ? "bg-white border-[#E5E5E5] hover:border-[#CCCCCC] shadow-xs"
                          : item.status === "APPROVED"
                          ? "bg-[#E6F4EA]/30 border-[#CEEAD6]"
                          : "bg-[#FCE8E6]/30 border-[#FAD2CF]"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E5E5]/60">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-[#0F0F0F]">
                            {item.id}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F2F2F2] text-[#0F0F0F] font-semibold">
                            {item.type === "SINGLE"
                              ? "Single Degree"
                              : `Batch (${item.batchRecords?.length || 0} Candidates)`}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              item.status === "PENDING"
                                ? "bg-[#FEF7E0] text-[#B06000]"
                                : item.status === "APPROVED"
                                ? "bg-[#E6F4EA] text-[#137333]"
                                : "bg-[#FCE8E6] text-[#C5221F]"
                            }`}
                          >
                            {item.status === "PENDING"
                              ? "Pending Registrar Approval"
                              : item.status === "APPROVED"
                              ? "Approved & Anchored"
                              : "Rejected"}
                          </span>
                        </div>

                        <span className="text-[11px] text-[#606060]">
                          Submitted: {new Date(item.submittedAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Details Area */}
                      <div className="text-xs text-[#0F0F0F] space-y-1.5">
                        <div className="flex items-center gap-2 text-[#606060]">
                          <span>Prepared By:</span>
                          <span className="font-semibold text-[#0F0F0F]">
                            {item.preparedBy}
                          </span>
                          <span>•</span>
                          <span>University:</span>
                          <span className="font-semibold text-[#0F0F0F]">
                            {item.universityName}
                          </span>
                        </div>

                        {item.type === "SINGLE" && item.singleRecord && (
                          <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5] grid grid-cols-1 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                            <div>
                              <span className="text-[#606060] block font-sans text-[10px]">
                                Candidate:
                              </span>
                              <strong className="text-[#0F0F0F]">
                                {item.singleRecord.studentName}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[#606060] block font-sans text-[10px]">
                                Roll Number:
                              </span>
                              <span className="text-[#065FD4]">
                                {item.singleRecord.studentRoll}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#606060] block font-sans text-[10px]">
                                Program & CGPA:
                              </span>
                              <span>
                                {item.singleRecord.degree} (CGPA:{" "}
                                {item.singleRecord.cgpa.toFixed(2)})
                              </span>
                            </div>
                            <div>
                              <span className="text-[#606060] block font-sans text-[10px]">
                                IPFS CID:
                              </span>
                              <span className="truncate block text-[#606060]">
                                {item.singleRecord.ipfsCid || "Auto-assigned"}
                              </span>
                            </div>
                          </div>
                        )}

                        {item.type === "BATCH" && item.batchRecords && (
                          <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5] space-y-1">
                            <span className="text-[11px] font-semibold text-[#0F0F0F] block">
                              Batch Candidates ({item.batchRecords.length} Students):
                            </span>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {item.batchRecords.map((cand, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-white border border-[#E5E5E5] text-[10px] text-[#0F0F0F]"
                                >
                                  {cand.studentName} ({cand.studentRoll})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.rejectionReason && (
                          <p className="text-xs text-[#C5221F] bg-[#FCE8E6] p-2 rounded-lg">
                            Rejection Note: {item.rejectionReason}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      {item.status === "PENDING" && (
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E5E5]/60">
                          {staffRole === "REGISTRAR" ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleApproveQueueItem(item)}
                                disabled={isProcessingApproval === item.id}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#137333] hover:bg-[#0e5c28] disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-xs active:scale-95"
                              >
                                {isProcessingApproval === item.id ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Signing & Anchoring...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve & Anchor to Registry</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRejectQueueItem(item)}
                                disabled={isProcessingApproval === item.id}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF] text-xs font-semibold transition-all active:scale-95"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[11px] text-[#B06000] italic">
                                Exam Clerk View: Awaiting Registrar / Dean Sign-Off
                              </span>
                              <button
                                type="button"
                                onClick={() => setStaffRole("REGISTRAR")}
                                className="text-xs font-bold text-[#065FD4] hover:underline"
                              >
                                Switch to Registrar Mode to Sign Off →
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REGISTRY RECORDS & REVOCATION */}
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
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] font-semibold text-[11px]">
                              Valid
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FEF7E0] text-[#B06000] font-semibold text-[11px]">
                              Revoked
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {cert.isValid ? (
                            <button
                              type="button"
                              onClick={() => {
                                setRevokingCertId(cert.id);
                                setRevokeReason(
                                  `Senate Order #SO-${new Date().getFullYear()}/89 — Disciplinary action for academic integrity violation confirmed by Executive Council.`
                                );
                              }}
                              className="px-3 py-1 rounded-full bg-white hover:bg-[#FEF7E0] text-[#B06000] border border-[#FEF7E0] font-semibold text-xs transition-colors"
                            >
                              Revoke...
                            </button>
                          ) : (
                            <span className="text-[#606060] italic text-[11px]">
                              Revoked on {new Date(cert.revocationDate || "").toLocaleDateString()}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Revocation Modal */}
              {revokingCertId && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl border border-[#E5E5E5]">
                    <div className="flex items-center gap-3 pb-3 border-b border-[#E5E5E5]">
                      <div className="w-10 h-10 rounded-full bg-[#FEF7E0] flex items-center justify-center text-[#B06000]">
                        <Ban className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-[#0F0F0F]">
                          Revoke Credential
                        </h4>
                        <p className="text-xs font-mono text-[#606060]">
                          {revokingCertId}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-[#606060] leading-relaxed">
                      Revocation permanently invalidates this academic degree on
                      the public ledger. Employers and verification portals will
                      immediately be warned of its revoked status.
                    </p>

                    <div>
                      <label className="block text-xs font-semibold text-[#0F0F0F] mb-1">
                        Official Senate Reference & Disciplinary Reason *
                      </label>
                      <textarea
                        rows={3}
                        value={revokeReason}
                        onChange={(e) => setRevokeReason(e.target.value)}
                        placeholder="e.g. Senate Order #SO-2026/89 — Plagiarism in final year thesis"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#CCCCCC] text-[#0F0F0F] text-xs focus:border-[#065FD4] focus:bg-white outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRevokingCertId(null);
                          setRevokeReason("");
                        }}
                        className="px-4 py-2 rounded-full bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#0F0F0F] text-xs font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteRevoke}
                        disabled={isRevoking}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#B06000] hover:bg-[#924f00] text-white text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
                      >
                        {isRevoking ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Broadcasting Revocation...</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5" />
                            <span>Confirm Official Revocation</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
