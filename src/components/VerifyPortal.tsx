"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileSearch,
  UploadCloud,
  QrCode,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Hash,
  Download,
  Copy,
  ExternalLink,
  RefreshCw,
  Camera,
  StopCircle,
  ShieldCheck,
  FileText,
  FileCheck2,
} from "lucide-react";
import { Certificate, VerificationResult, ExecutionMode } from "@/types";
import { verifyDocument } from "@/lib/registry";
import { hashFile, extractCertMetadataFromText } from "@/lib/crypto";
import {
  generateCertificatePDF,
  generateHRClearanceReportPDF,
} from "@/lib/pdfGenerator";

interface VerifyPortalProps {
  initialCertId?: string;
  initialHash?: string;
  initialProof?: string;
  initialRedacted?: string;
  mode?: ExecutionMode;
  onNavigateToTamperLab?: () => void;
}

export const VerifyPortal: React.FC<VerifyPortalProps> = ({
  initialCertId,
  initialHash,
  initialProof,
  initialRedacted,
  mode = "DEMO",
  onNavigateToTamperLab,
}) => {
  const [activeMethod, setActiveMethod] = useState<"file" | "camera" | "search">(
    "file"
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingHR, setDownloadingHR] = useState(false);
  const [lastCalculatedFileHash, setLastCalculatedFileHash] = useState<
    string | null
  >(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerContainerId = "html5qr-code-scanner";
  const scannerRef = useRef<unknown>(null);

  useEffect(() => {
    if (initialCertId) {
      setSearchQuery(initialCertId);
      setActiveMethod("search");
      handleExecuteVerification({ id: initialCertId });
    } else if (initialHash) {
      setSearchQuery(initialHash);
      setActiveMethod("search");
      handleExecuteVerification({ hash: initialHash });
    }
  }, [initialCertId, initialHash]);

  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const handleExecuteVerification = async (query: {
    id?: string;
    hash?: string;
    fileHash?: string;
    extractedText?: string;
  }) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const result = await verifyDocument(query);
      setVerificationResult(result);
    } catch (err) {
      console.error("Verification error:", err);
      setVerificationResult({
        status: "NOT_FOUND",
        message: "An error occurred while querying the official registry.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (searchQuery.startsWith("0x")) {
      handleExecuteVerification({ hash: searchQuery.trim() });
    } else {
      handleExecuteVerification({ id: searchQuery.trim() });
    }
  };

  const handleFileProcess = async (file: File) => {
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    setIsVerifying(true);

    try {
      const digitalFingerprint = await hashFile(file);
      setLastCalculatedFileHash(digitalFingerprint);

      const extracted = extractCertMetadataFromText(file.name);
      let embeddedId = extracted.id;
      let embeddedHash = extracted.hash;

      try {
        const textSlice = await file.slice(0, 15000).text();
        const detected = extractCertMetadataFromText(textSlice);
        if (detected.id) embeddedId = detected.id;
        if (detected.hash) embeddedHash = detected.hash;
      } catch {
        // Continue
      }

      await handleExecuteVerification({
        id: embeddedId,
        hash: embeddedHash,
        fileHash: digitalFingerprint,
      });
    } catch (err) {
      console.error(err);
      setVerificationResult({
        status: "NOT_FOUND",
        message: "Failed to read digital fingerprint from the uploaded file.",
      });
      setIsVerifying(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const startCameraScanner = async () => {
    setScannerActive(true);
    setVerificationResult(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopCameraScanner();
          const meta = extractCertMetadataFromText(decodedText);
          if (meta.id) {
            setSearchQuery(meta.id);
            handleExecuteVerification({ id: meta.id });
          } else if (meta.hash) {
            setSearchQuery(meta.hash);
            handleExecuteVerification({ hash: meta.hash });
          } else {
            setSearchQuery(decodedText);
            handleExecuteVerification({ id: decodedText });
          }
        },
        () => {}
      );
    } catch (err) {
      console.error("Camera scanner error:", err);
      setScannerActive(false);
      alert(
        "Could not access camera. Please check camera permissions or use file upload."
      );
    }
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        const scanner = scannerRef.current as {
          stop: () => Promise<void>;
          clear: () => void;
        };
        await scanner.stop();
        scanner.clear();
      } catch {
        // Ignore
      }
      scannerRef.current = null;
    }
    setScannerActive(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadOfficialPDF = async (cert: Certificate) => {
    setDownloadingPdf(true);
    try {
      await generateCertificatePDF(cert, { download: true });
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadHRReport = async (cert: Certificate) => {
    setDownloadingHR(true);
    try {
      await generateHRClearanceReportPDF(cert, { download: true });
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingHR(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Friendly Header Hero */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F0F0F] tracking-tight">
          Verify Academic Credentials
        </h1>
        <p className="text-sm text-[#606060] max-w-xl mx-auto">
          Fast, effortless verification for recruiters, employers, and students.
          Upload a degree PDF, scan a physical QR code, or search by ID.
        </p>
      </div>

      {/* Input Method Switcher (YouTube Category Style Pills) */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-full bg-[#F2F2F2] border border-[#E5E5E5] gap-1 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              stopCameraScanner();
              setActiveMethod("file");
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 active:scale-95 ${
              activeMethod === "file"
                ? "bg-[#0F0F0F] text-white shadow-xs"
                : "text-[#0F0F0F] hover:bg-[#E5E5E5]"
            }`}
          >
            <UploadCloud className="w-4 h-4 text-blue-500" />
            <span>Drop Degree PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMethod("camera");
              startCameraScanner();
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 active:scale-95 ${
              activeMethod === "camera"
                ? "bg-[#0F0F0F] text-white shadow-xs"
                : "text-[#0F0F0F] hover:bg-[#E5E5E5]"
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-500" />
            <span>Camera QR Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCameraScanner();
              setActiveMethod("search");
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 active:scale-95 ${
              activeMethod === "search"
                ? "bg-[#0F0F0F] text-white shadow-xs"
                : "text-[#0F0F0F] hover:bg-[#E5E5E5]"
            }`}
          >
            <Search className="w-4 h-4 text-indigo-500" />
            <span>Search by ID</span>
          </button>
        </div>
      </div>

      {/* Method 1: Dropzone */}
      {activeMethod === "file" && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 bg-[#F8F9FA] ${
            dragActive
              ? "border-[#065FD4] bg-blue-50/50 scale-[1.01] ring-4 ring-[#065FD4]/10 shadow-sm"
              : "border-[#CCCCCC] hover:border-[#0F0F0F] hover:bg-[#F2F2F2] hover:shadow-xs"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileProcess(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E5E5] flex items-center justify-center text-[#065FD4] shadow-xs group-hover:scale-105 transition-transform duration-200">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div>
              <p className="text-base font-bold text-[#0F0F0F]">
                Drag and drop your degree PDF here
              </p>
              <p className="text-xs text-[#606060] mt-1">
                Supports official PDF credentials and certificate scans (SHA-256
                Web Crypto hashing runs privately in your browser)
              </p>
            </div>

            {fileName && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#CEEAD6] text-xs text-[#0F0F0F] shadow-2xs">
                <FileText className="w-3.5 h-3.5 text-[#065FD4]" />
                <span className="font-semibold">{fileName}</span>
                <span className="text-[#606060]">({fileSize})</span>
              </div>
            )}

            <button
              type="button"
              className="px-5 py-2 rounded-full bg-[#0F0F0F] hover:bg-[#272727] active:scale-95 text-white text-xs sm:text-sm font-medium transition-all duration-150 shadow-xs hover:shadow-sm"
            >
              Select File from Device
            </button>
          </div>
        </div>
      )}

      {/* Method 2: Camera QR Scanner */}
      {activeMethod === "camera" && (
        <div className="p-6 rounded-2xl bg-white border border-[#E5E5E5] text-center space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0F0F0F]">
              <Camera className="w-4 h-4 text-[#065FD4]" />
              <span>Camera QR Scanner</span>
            </div>
            {scannerActive ? (
              <button
                type="button"
                onClick={stopCameraScanner}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FCE8E6] text-[#C5221F] text-xs font-medium hover:bg-rose-100"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startCameraScanner}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#0F0F0F] text-xs font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </button>
            )}
          </div>

          <div
            id={scannerContainerId}
            className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl border border-[#E5E5E5] bg-[#F8F9FA] min-h-[260px] flex items-center justify-center"
          >
            {!scannerActive && (
              <div className="p-6 text-[#606060] text-xs">
                Camera is off. Click &quot;Restart&quot; to begin scanning.
              </div>
            )}
          </div>
          <p className="text-xs text-[#606060]">
            Point your camera at the QR code on any printed degree certificate.
          </p>
        </div>
      )}

      {/* Method 3: Search by ID */}
      {activeMethod === "search" && (
        <form onSubmit={handleManualSearch} className="space-y-3">
          <div className="flex items-center rounded-full border border-[#CCCCCC] bg-[#F8F9FA] focus-within:border-[#065FD4] focus-within:bg-white pl-4 pr-1 py-1 transition-all shadow-inner">
            <Search className="w-4 h-4 text-[#606060] shrink-0 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. CERT-HSTU-2026-0482 or Digital Fingerprint (0x...)"
              className="w-full bg-transparent text-sm text-[#0F0F0F] placeholder-[#606060] outline-none"
            />
            <button
              type="submit"
              disabled={isVerifying || !searchQuery.trim()}
              className="px-5 py-2 rounded-full bg-[#0F0F0F] hover:bg-[#272727] text-white text-xs sm:text-sm font-medium transition-colors shrink-0 disabled:opacity-50"
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </button>
          </div>

          {/* Quick-fill Sample Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#606060]">
            <span>Try quick samples:</span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("CERT-HSTU-2026-0482");
                handleExecuteVerification({ id: "CERT-HSTU-2026-0482" });
              }}
              className="px-3 py-1 rounded-full bg-[#E6F4EA] text-[#137333] font-medium border border-[#CEEAD6] hover:bg-emerald-100 hover:scale-[1.02] active:scale-95 transition-all duration-150 shadow-2xs"
            >
              Rahul Sharma (Valid)
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("CERT-NIT-2025-0314");
                handleExecuteVerification({ id: "CERT-NIT-2025-0314" });
              }}
              className="px-3 py-1 rounded-full bg-[#FEF7E0] text-[#B06000] font-medium border border-[#FEEFC3] hover:bg-amber-100 hover:scale-[1.02] active:scale-95 transition-all duration-150 shadow-2xs"
            >
              Amit Verma (Revoked)
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery(
                  "0x9999999999999999999999999999999999999999999999999999999999999999"
                );
                handleExecuteVerification({
                  hash: "0x9999999999999999999999999999999999999999999999999999999999999999",
                });
              }}
              className="px-3 py-1 rounded-full bg-[#FCE8E6] text-[#C5221F] font-medium border border-[#FAD2CF] hover:bg-rose-100 hover:scale-[1.02] active:scale-95 transition-all duration-150 shadow-2xs"
            >
              Altered Hash (Fail)
            </button>
          </div>
        </form>
      )}

      {/* Loading State Spinner */}
      {isVerifying && (
        <div className="p-8 rounded-2xl bg-[#F8F9FA] border border-[#E5E5E5] text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#0F0F0F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#0F0F0F]">
            Querying Official University Registry...
          </p>
          <p className="text-xs text-[#606060]">
            Comparing SHA-256 digital fingerprint against immutable ledger
            anchors
          </p>
        </div>
      )}

      {/* VERIFICATION RESULT CARD */}
      {verificationResult && !isVerifying && (
        <div className="space-y-4">
          {/* 1. AUTHENTIC (GREEN - #E6F4EA / #137333) */}
          {verificationResult.status === "AUTHENTIC" &&
            verificationResult.certificate && (
              <div className="rounded-2xl border border-[#CEEAD6] bg-white p-6 sm:p-8 shadow-xs hover:shadow-sm transition-all duration-200 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E5E5E5] gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#137333] shadow-xs">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333]">
                          Officially Verified
                        </span>
                        <span className="text-xs text-[#606060]">
                          Active & Valid
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#0F0F0F] mt-0.5">
                        Authentic Academic Degree
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadHRReport(
                          verificationResult.certificate!
                        )
                      }
                      disabled={downloadingHR}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#065FD4] hover:bg-[#0553ba] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 text-white text-xs sm:text-sm font-semibold transition-all duration-150 shadow-xs hover:shadow-sm"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      <span>
                        {downloadingHR
                          ? "Generating..."
                          : "HR Clearance Report (PDF)"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadOfficialPDF(
                          verificationResult.certificate!
                        )
                      }
                      disabled={downloadingPdf}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#0F0F0F] hover:bg-[#272727] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 text-white text-xs sm:text-sm font-semibold transition-all duration-150 shadow-xs hover:shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {downloadingPdf
                          ? "Generating..."
                          : "Certified Degree PDF"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Graduate & Degree Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-2">
                  <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5] hover:border-[#D0D0D0] hover:shadow-2xs transition-all duration-150">
                    <span className="text-xs text-[#606060] font-medium">
                      Student Full Name
                    </span>
                    <p className="text-lg font-bold text-[#0F0F0F] mt-0.5">
                      {verificationResult.certificate.studentName}
                    </p>
                    <span className="text-xs font-mono font-medium text-[#065FD4]">
                      Roll: {verificationResult.certificate.studentRoll}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5] hover:border-[#D0D0D0] hover:shadow-2xs transition-all duration-150">
                    <span className="text-xs text-[#606060] font-medium">
                      Degree / Program
                    </span>
                    <p className="text-sm font-bold text-[#0F0F0F] mt-0.5">
                      {verificationResult.certificate.degree}
                    </p>
                    <span className="text-xs text-[#137333] font-medium">
                      Class of {verificationResult.certificate.graduationYear}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5] hover:border-[#D0D0D0] hover:shadow-2xs transition-all duration-150">
                    <span className="text-xs text-[#606060] font-medium">
                      Grade & Standing
                    </span>
                    <p className="text-lg font-bold text-[#0F0F0F] mt-0.5">
                      CGPA:{" "}
                      {verificationResult.certificate.cgpa.toFixed(2)} / 10.00
                    </p>
                    <span className="text-xs text-[#606060]">
                      {verificationResult.certificate.honors}
                    </span>
                  </div>

                  <div className="sm:col-span-2 p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5] hover:border-[#D0D0D0] hover:shadow-2xs transition-all duration-150">
                    <span className="text-xs text-[#606060] font-medium">
                      Issuing University
                    </span>
                    <p className="text-base font-bold text-[#0F0F0F] mt-0.5">
                      {verificationResult.certificate.universityName}
                    </p>
                    <span className="text-xs text-[#606060]">
                      Registry Code: {verificationResult.certificate.universityCode}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5] hover:border-[#D0D0D0] hover:shadow-2xs transition-all duration-150">
                    <span className="text-xs text-[#606060] font-medium">
                      Certificate Identifier
                    </span>
                    <p className="text-sm font-mono font-bold text-[#0F0F0F] mt-0.5">
                      {verificationResult.certificate.id}
                    </p>
                  </div>
                </div>

                {/* Dual-Hashing Verification Engine Breakdown */}
                <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5] hover:border-[#CEEAD6] transition-colors space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F0F0F] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#137333]" />
                      <span>Dual-Hashing Cryptographic Reconciler</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] font-medium">
                      100% Bitwise Match
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-white border border-[#E5E5E5] hover:border-[#CEEAD6] transition-colors space-y-1">
                      <span className="text-[11px] font-semibold text-[#0F0F0F] block">
                        Layer 1: Canonical Data Payload Hash
                      </span>
                      <p className="text-[10px] text-[#606060]">
                        Deterministic SHA-256 over: Name + Roll + Course + CGPA
                        + Year
                      </p>
                      <p className="font-mono text-[#137333] text-[11px] truncate">
                        {verificationResult.certificate.digitalFingerprint}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-[#E5E5E5] hover:border-blue-200 transition-colors space-y-1">
                      <span className="text-[11px] font-semibold text-[#0F0F0F] block">
                        Layer 2: File Binary Hash (Strict PDF SHA-256)
                      </span>
                      <p className="text-[10px] text-[#606060]">
                        Client-side SubtleCrypto SHA-256 byte digest
                      </p>
                      <p className="font-mono text-[#065FD4] text-[11px] truncate">
                        {lastCalculatedFileHash ||
                          verificationResult.certificate.digitalFingerprint}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cryptographic Ledger Record */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#606060] font-medium">
                    <span className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" />
                      <span>Ledger Anchoring Record</span>
                    </span>
                    <span className="font-mono">
                      Block #{verificationResult.certificate.blockNumber}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5] space-y-1.5 font-mono text-[11px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-[#606060]">Digital Fingerprint:</span>
                      <div className="flex items-center gap-1.5 text-[#0F0F0F] break-all">
                        <span>
                          {verificationResult.certificate.digitalFingerprint}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              verificationResult.certificate!.digitalFingerprint
                            )
                          }
                          className="text-[#606060] hover:text-[#0F0F0F]"
                          title="Copy"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-[#606060]">Institutional Signer:</span>
                      <span className="text-[#0F0F0F] break-all">
                        {verificationResult.certificate.institutionalSigner}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-[#606060]">Anchoring Date:</span>
                      <span className="text-[#0F0F0F]">
                        {new Date(
                          verificationResult.certificate.issuanceDate
                        ).toUTCString()}
                      </span>
                    </div>
                  </div>

                  {copied && (
                    <p className="text-xs text-[#137333] text-right font-medium">
                      Copied to clipboard!
                    </p>
                  )}
                </div>
              </div>
            )}

          {/* 2. TAMPERED / INVALID (RED - #FCE8E6 / #C5221F) */}
          {verificationResult.status === "TAMPERED" && (
            <div className="rounded-2xl border border-[#FAD2CF] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FCE8E6] flex items-center justify-center text-[#C5221F] shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FCE8E6] text-[#C5221F]">
                    Verification Failed
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0F0F0F]">
                    Digital Fingerprint Mismatch
                  </h2>
                  <p className="text-sm text-[#606060] leading-relaxed">
                    The cryptographic digital fingerprint of this document does{" "}
                    <strong className="text-[#C5221F]">not match</strong> any
                    official record in the university registry. This indicates
                    the credential has been altered (e.g. CGPA, student name, or
                    graduation year modified) or was issued by an unauthorized
                    source.
                  </p>
                </div>
              </div>

              {verificationResult.calculatedHash && (
                <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E5E5] space-y-1">
                  <span className="text-xs font-semibold text-[#C5221F]">
                    Computed Document Fingerprint (Unregistered / Altered):
                  </span>
                  <p className="text-xs font-mono text-[#0F0F0F] break-all">
                    {verificationResult.calculatedHash}
                  </p>
                </div>
              )}

              {onNavigateToTamperLab && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={onNavigateToTamperLab}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F2F2F2] hover:bg-[#E5E5E5] text-[#0F0F0F] text-xs sm:text-sm font-semibold transition-colors"
                  >
                    <span>Inspect In Tamper Lab Explainer</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. REVOKED (AMBER - #FEF7E0 / #B06000) */}
          {verificationResult.status === "REVOKED" &&
            verificationResult.certificate && (
              <div className="rounded-2xl border border-[#FEEFC3] bg-white p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FEF7E0] flex items-center justify-center text-[#B06000] shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FEF7E0] text-[#B06000]">
                      Credential Revoked
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#0F0F0F]">
                      Official Revocation Notice
                    </h2>
                    <p className="text-sm text-[#606060] leading-relaxed">
                      This academic degree was previously anchored on the
                      registry, but has been{" "}
                      <strong className="text-[#B06000]">
                        officially invalidated
                      </strong>{" "}
                      by the issuing university authorities.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#FEF7E0]/60 border border-[#FEEFC3] space-y-1 text-xs text-[#0F0F0F]">
                  <span className="font-semibold text-[#B06000] block">
                    Official Disciplinary Senate Reason:
                  </span>
                  <p className="font-medium text-sm">
                    &quot;{verificationResult.certificate.revocationReason}&quot;
                  </p>
                  {verificationResult.certificate.revocationDate && (
                    <p className="text-[#606060] pt-1">
                      Revocation Date:{" "}
                      {new Date(
                        verificationResult.certificate.revocationDate
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#606060]">
                  <div>
                    Student: {verificationResult.certificate.studentName} (Roll:{" "}
                    {verificationResult.certificate.studentRoll})
                  </div>
                  <div>
                    Issuing Authority:{" "}
                    {verificationResult.certificate.universityName}
                  </div>
                </div>
              </div>
            )}

          {/* 4. NOT FOUND */}
          {verificationResult.status === "NOT_FOUND" && (
            <div className="rounded-2xl border border-[#E5E5E5] bg-[#F8F9FA] p-8 text-center space-y-2">
              <FileSearch className="w-8 h-8 text-[#606060] mx-auto" />
              <h3 className="text-base font-bold text-[#0F0F0F]">
                No Record Found
              </h3>
              <p className="text-xs text-[#606060] max-w-sm mx-auto">
                {verificationResult.message}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
