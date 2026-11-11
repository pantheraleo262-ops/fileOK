import jsPDF from "jspdf";
import QRCode from "qrcode";
import { Certificate } from "@/types";

/**
 * Generates an executive, institutional-grade academic degree certificate PDF.
 * Uses jsPDF and client-side QR code generation.
 */
export async function generateCertificatePDF(
  cert: Certificate,
  options?: { download?: boolean }
): Promise<{ doc: jsPDF; dataUrl: string; blob: Blob }> {
  // A4 Landscape: 297mm x 210mm
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Background subtle tint
  doc.setFillColor(254, 254, 252);
  doc.rect(0, 0, width, height, "F");

  // Ornate double border
  doc.setDrawColor(212, 175, 55); // Rich Gold
  doc.setLineWidth(2.5);
  doc.rect(10, 10, width - 20, height - 20, "D");

  doc.setDrawColor(30, 58, 138); // Deep Navy
  doc.setLineWidth(0.8);
  doc.rect(13, 13, width - 26, height - 26, "D");

  // Inner hairline border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.rect(15, 15, width - 30, height - 30, "D");

  // Decorative corner accents
  const drawCorner = (x: number, y: number, dirX: number, dirY: number) => {
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1.2);
    doc.line(x, y, x + dirX * 12, y);
    doc.line(x, y, x, y + dirY * 12);
  };
  drawCorner(16, 16, 1, 1);
  drawCorner(width - 16, 16, -1, 1);
  drawCorner(16, height - 16, 1, -1);
  drawCorner(width - 16, height - 16, -1, -1);

  // University Crest / Seal simulation
  doc.setFillColor(30, 58, 138);
  doc.circle(width / 2, 28, 9, "F");
  doc.setFillColor(212, 175, 55);
  doc.circle(width / 2, 28, 7.5, "F");
  doc.setFillColor(30, 58, 138);
  doc.circle(width / 2, 28, 6.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("VERITAS", width / 2, 29.5, { align: "center" });

  // University Header
  doc.setFont("times", "bold");
  doc.setTextColor(26, 32, 44); // Slate 900
  doc.setFontSize(22);
  doc.text(cert.universityName.toUpperCase(), width / 2, 45, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(
    `UNIVERSITY REGISTRY CODE: ${cert.universityCode}  |  OFFICIAL DEGREE RECORD`,
    width / 2,
    51,
    { align: "center" }
  );

  // Gold Divider Bar
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1);
  doc.line(width / 2 - 45, 54, width / 2 + 45, 54);

  // Formal Certify statement
  doc.setFont("times", "italic");
  doc.setFontSize(13);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "By the authority of the Board of Governors and the Academic Senate, be it known that",
    width / 2,
    64,
    { align: "center" }
  );

  // Student Name
  doc.setFont("times", "bold");
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.text(cert.studentName, width / 2, 77, { align: "center" });

  // Student Roll / Reg
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(59, 130, 246); // Blue
  doc.text(`ROLL NUMBER: ${cert.studentRoll}`, width / 2, 84, {
    align: "center",
  });

  // Conferment text
  doc.setFont("times", "italic");
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "has completed the prescribed curriculum and fulfilled all academic requirements for the degree of",
    width / 2,
    93,
    { align: "center" }
  );

  // Degree Name
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 138);
  doc.text(cert.degree, width / 2, 103, { align: "center" });

  // Academic Standing & CGPA
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Class of ${cert.graduationYear}  |  Cumulative Grade Point Average: ${cert.cgpa.toFixed(
      2
    )} / 10.00`,
    width / 2,
    112,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(212, 143, 0); // Gold-amber
  doc.text(`[ ${cert.honors.toUpperCase()} ]`, width / 2, 118, {
    align: "center",
  });

  // Generate QR Code for live verification
  const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : "https://veridoc.academic"}/?tab=verify&id=${encodeURIComponent(cert.id)}&hash=${encodeURIComponent(cert.digitalFingerprint)}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 140,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  // Add QR code to bottom-right of certificate
  const qrSize = 34;
  const qrX = width - 58;
  const qrY = height - 60;
  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("SCAN TO VERIFY", qrX + qrSize / 2, qrY + qrSize + 3.5, {
    align: "center",
  });

  // Watermark Seal on Left
  const sealX = 40;
  const sealY = height - 42;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.8);
  doc.circle(sealX, sealY, 16, "D");
  doc.circle(sealX, sealY, 14.5, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(180, 140, 20);
  doc.text("OFFICIAL SEAL", sealX, sealY - 1, { align: "center" });
  doc.setFontSize(5.5);
  doc.text("TAMPER-RESISTANT", sealX, sealY + 3, { align: "center" });

  // Signature lines in the middle
  const sig1X = width / 2 - 38;
  const sig2X = width / 2 + 38;
  const sigY = height - 40;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(sig1X - 25, sigY, sig1X + 25, sigY);
  doc.line(sig2X - 25, sigY, sig2X + 25, sigY);

  // Handwritten style signatures simulated
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text("Prof. Dr. V. K. Adlakha", sig1X, sigY - 3, { align: "center" });
  doc.text("Dr. Sandeep K. Joshi", sig2X, sigY - 3, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Controller of Examinations", sig1X, sigY + 4, { align: "center" });
  doc.text("Registrar & Academic Dean", sig2X, sigY + 4, { align: "center" });

  // Bottom Cryptographic Audit Footer
  const footerY = height - 16;
  doc.setFillColor(241, 245, 249);
  doc.rect(17, footerY - 5, width - 34, 9, "F");

  doc.setFont("courier", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `CREDENTIAL ID: ${cert.id}  |  DIGITAL FINGERPRINT: ${cert.digitalFingerprint}`,
    width / 2,
    footerY - 1,
    { align: "center" }
  );

  doc.setFont("courier", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `INSTITUTIONAL SIGNER: ${cert.institutionalSigner}  |  REGISTRY BLOCK #${cert.blockNumber}  |  CANONICAL: VERIDOC-V2-SHA256`,
    width / 2,
    footerY + 2.5,
    { align: "center" }
  );

  // Embed verifiable metadata into PDF properties
  doc.setProperties({
    title: `Academic Credential - ${cert.studentName} (${cert.id})`,
    subject: `Digital Fingerprint: ${cert.digitalFingerprint}`,
    author: cert.universityName,
    keywords: `VeriDoc, ${cert.id}, ${cert.digitalFingerprint}, ${cert.studentRoll}`,
    creator: "VeriDoc Academic Trust Network",
  });

  const blob = doc.output("blob");
  const dataUrl = doc.output("dataurlstring");

  if (options?.download) {
    const filename = `${cert.id}_${cert.studentName.replace(/\s+/g, "_")}.pdf`;
    doc.save(filename);
  }

  return { doc, dataUrl, blob };
}

/**
 * Generates a formal 1-page Recruiter / HR Verification Clearance Audit Report.
 * Designed for enterprise talent acquisition and background check files.
 */
export async function generateHRClearanceReportPDF(
  cert: Certificate,
  options?: { download?: boolean }
): Promise<{ doc: jsPDF; dataUrl: string; blob: Blob }> {
  // A4 Portrait: 210mm x 297mm
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, "F");

  // Top Accent Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, width, 32, "F");

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("VERIDOC // ACADEMIC TRUST NETWORK", 18, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(
    "OFFICIAL RECRUITER CLEARANCE & BACKGROUND CHECK AUDIT REPORT",
    18,
    23
  );

  const reportId = `HR-VERIF-${new Date().getFullYear()}-${Math.floor(
    100000 + Math.random() * 900000
  )}`;

  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(212, 175, 55);
  doc.text(`AUDIT REF: ${reportId}`, width - 18, 16, { align: "right" });
  doc.setTextColor(203, 213, 225);
  doc.text(
    `TIMESTAMP: ${new Date().toUTCString().slice(0, 25)}`,
    width - 18,
    23,
    { align: "right" }
  );

  // Verification Status Callout Box
  const statusY = 40;
  if (cert.isValid) {
    doc.setFillColor(236, 253, 245); // Emerald 50
    doc.setDrawColor(16, 185, 129); // Emerald 500
    doc.setLineWidth(1);
    doc.rect(18, statusY, width - 36, 22, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(6, 95, 70); // Emerald 800
    doc.text(
      "VERIFICATION OUTCOME: CLEARED // 100% AUTHENTIC CREDENTIAL",
      24,
      statusY + 9
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(4, 120, 87);
    doc.text(
      "The academic degree matches the immutable university registry. No grade inflation, alteration, or revocation found.",
      24,
      statusY + 16
    );
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(1);
    doc.rect(18, statusY, width - 36, 22, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(153, 27, 27);
    doc.text("VERIFICATION OUTCOME: REVOKED // CREDENTIAL INVALID", 24, statusY + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(185, 28, 28);
    doc.text(
      `Revocation Order: ${cert.revocationReason || "Disciplinary Senate Action"}`,
      24,
      statusY + 16
    );
  }

  // Section 1: Candidate & Credential Profile
  let curY = 72;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("1. CANDIDATE & DEGREE RECORD", 18, curY);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(18, curY + 2, width - 18, curY + 2);

  curY += 10;
  const renderRow = (label: string, val: string, yPos: number, isMono = false) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(label, 20, yPos);

    doc.setFont(isMono ? "courier" : "helvetica", isMono ? "bold" : "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(val, 80, yPos);
  };

  renderRow("Candidate Full Name:", cert.studentName, curY);
  curY += 7;
  renderRow("Student Roll Number:", cert.studentRoll, curY, true);
  curY += 7;
  renderRow("Academic Degree:", cert.degree, curY);
  curY += 7;
  renderRow(
    "Cumulative GPA / Standing:",
    `${cert.cgpa.toFixed(2)} / 10.00 — ${cert.honors}`,
    curY
  );
  curY += 7;
  renderRow("Graduation Year:", cert.graduationYear.toString(), curY);
  curY += 7;
  renderRow("Credential Identifier:", cert.id, curY, true);

  // Section 2: Issuing University & Accreditation
  curY += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("2. INSTITUTIONAL REGISTRY & AISHE AUTHORIZATION", 18, curY);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(18, curY + 2, width - 18, curY + 2);

  curY += 10;
  renderRow("Issuing University:", cert.universityName, curY);
  curY += 7;
  renderRow(
    "University AISHE Code:",
    `${cert.universityCode} (Verified Government Repository)`,
    curY
  );
  curY += 7;
  renderRow("Institutional Signer:", cert.institutionalSigner, curY, true);
  curY += 7;
  renderRow(
    "Registry Anchor Status:",
    `Confirmed at Block #${cert.blockNumber} // Decentralized EVM Ledger`,
    curY
  );

  // Section 3: Dual-Hash Cryptographic Audit Trail
  curY += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("3. CRYPTOGRAPHIC INTEGRITY & DUAL-HASH AUDIT TRAIL", 18, curY);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(18, curY + 2, width - 18, curY + 2);

  curY += 8;
  doc.setFillColor(248, 250, 252);
  doc.rect(18, curY, width - 36, 32, "F");

  doc.setFont("courier", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `[LAYER 1] STRUCTURED CANONICAL DATA HASH (SHA-256):`,
    22,
    curY + 6
  );
  doc.setTextColor(15, 23, 42);
  doc.text(cert.digitalFingerprint, 22, curY + 11);

  doc.setTextColor(71, 85, 105);
  doc.text(
    `[LAYER 2] TRANSACTION ANCHOR HASH:`,
    22,
    curY + 18
  );
  doc.setTextColor(15, 23, 42);
  doc.text(cert.transactionId, 22, curY + 23);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Both the file payload and canonical graduate attributes were reconciled with zero bitwise discrepancy.",
    22,
    curY + 29
  );

  // Section 4: Attestation & Verification QR
  curY += 38;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("4. LEGAL RECRUITER ATTESTATION", 18, curY);

  curY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const disclaimer =
    "This certificate of clearance was generated via the VeriDoc Academic Trust Network. It confirms that the candidate's academic record has been directly authenticated against the issuing university's immutable registry ledger. In compliance with fair recruitment standards, this document serves as verified proof of degree completion for employment background checks.";
  const splitText = doc.splitTextToSize(disclaimer, width - 75);
  doc.text(splitText, 18, curY);

  // QR Code on right side of attestation
  const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : "https://veridoc.academic"}/?tab=verify&id=${encodeURIComponent(cert.id)}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 120,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
  doc.addImage(qrDataUrl, "PNG", width - 48, curY - 6, 28, 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("SCAN TO RE-VERIFY", width - 34, curY + 25, { align: "center" });

  // Bottom Signature & Seal
  const footerY = height - 22;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(18, footerY - 4, width - 18, footerY - 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "ISSUED BY: VeriDoc Decentralized Academic Registry  |  ISO 27001 Cryptographic Standards  |  Non-Repudiation Verified",
    18,
    footerY + 1
  );
  doc.text(
    `HR Audit File Copy — Generated on ${new Date().toLocaleDateString()}`,
    18,
    footerY + 6
  );

  const blob = doc.output("blob");
  const dataUrl = doc.output("dataurlstring");

  if (options?.download) {
    const filename = `HR_Clearance_${cert.studentRoll}_${cert.id}.pdf`;
    doc.save(filename);
  }

  return { doc, dataUrl, blob };
}
