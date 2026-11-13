import { University, Certificate, VerificationResult } from "@/types";
import {
  canonicalizeCredential,
  computeDigitalFingerprint,
} from "./crypto";
import {
  computeSelectiveDisclosureHashes,
  decodePortableProof,
} from "./credential";
import {
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  PENDING_QUEUE_STORAGE_KEY,
  SEED_CERTIFICATES,
  SEED_PENDING_APPROVALS,
  getAllCertificates,
  saveCertificates,
  getPendingApprovals,
  savePendingApprovals,
  addPendingApproval,
  updatePendingApprovalStatus,
} from "./storage";

export {
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  PENDING_QUEUE_STORAGE_KEY,
  SEED_CERTIFICATES,
  SEED_PENDING_APPROVALS,
  getAllCertificates,
  saveCertificates,
  getPendingApprovals,
  savePendingApprovals,
  addPendingApproval,
  updatePendingApprovalStatus,
};

export const SUPPORTED_UNIVERSITIES: University[] = [
  {
    code: 1042,
    aisheCode: "AISHE C-1042",
    name: "Haryana State Tech University",
    shortName: "HSTU",
    campus: "Gurugram Tech City Campus, Haryana",
    authorizedSigner: "0x89205A3A3b2A55388eC73170ce2FF0396542765A",
    established: 1987,
    accreditation: "NAAC A++ Grade // AICTE Certified",
    sealColor: "#1e3a8a",
  },
  {
    code: 2091,
    aisheCode: "AISHE U-0097",
    name: "Delhi Technological University",
    shortName: "DTU",
    campus: "Shahbad Daulatpur, Bawana Road, Delhi",
    authorizedSigner: "0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB",
    established: 1941,
    accreditation: "Autonomous State University // NBA Accredited",
    sealColor: "#831843",
  },
  {
    code: 3054,
    aisheCode: "AISHE U-0192",
    name: "National Institute of Technology",
    shortName: "NIT",
    campus: "Kurukshetra, Haryana",
    authorizedSigner: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    established: 1963,
    accreditation: "Institute of National Importance // MoE Approved",
    sealColor: "#065f46",
  },
  {
    code: 4108,
    aisheCode: "AISHE U-0511",
    name: "Indian Institute of Science & Technology",
    shortName: "IIST",
    campus: "Electronic City Campus, Bengaluru",
    authorizedSigner: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
    established: 2007,
    accreditation: "Deemed University // NIRF Top 20",
    sealColor: "#581c87",
  },
];

export const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "_certHash", type: "bytes32" },
      { internalType: "uint256", name: "_universityCode", type: "uint256" },
      { internalType: "string", name: "_certId", type: "string" },
      { internalType: "string", name: "_studentRoll", type: "string" },
    ],
    name: "issueCertificate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "_certHash", type: "bytes32" }],
    name: "verifyCertificate",
    outputs: [
      { internalType: "bool", name: "exists", type: "bool" },
      { internalType: "bool", name: "isValid", type: "bool" },
      { internalType: "uint256", name: "universityCode", type: "uint256" },
      { internalType: "string", name: "universityName", type: "string" },
      { internalType: "string", name: "certId", type: "string" },
      { internalType: "string", name: "studentRoll", type: "string" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "address", name: "signer", type: "address" },
      { internalType: "string", name: "revocationReason", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "_certHash", type: "bytes32" },
      { internalType: "string", name: "_reason", type: "string" },
    ],
    name: "revokeCertificate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const CONTRACT_ADDRESS_ARBITRUM_SEPOLIA =
  "0x35Fa2DbBeA215E9110B6e80b2A6dE58f5C01009e" as `0x${string}`;

export function getUniversityByCode(code: number): University | undefined {
  return SUPPORTED_UNIVERSITIES.find((u) => u.code === code);
}

export function getCertificateById(id: string): Certificate | undefined {
  const certs = getAllCertificates();
  return certs.find((c) => c.id.toLowerCase() === id.trim().toLowerCase());
}

export function getCertificateByRoll(
  universityCode: number,
  studentRoll: string
): Certificate | undefined {
  const certs = getAllCertificates();
  return certs.find(
    (c) =>
      c.universityCode === universityCode &&
      c.studentRoll.toLowerCase() === studentRoll.trim().toLowerCase()
  );
}

export function getCertificateByHash(hash: string): Certificate | undefined {
  const certs = getAllCertificates();
  const normalized = hash.trim().toLowerCase();
  return certs.find(
    (c) =>
      c.digitalFingerprint.toLowerCase() === normalized ||
      c.digitalFingerprint.toLowerCase().replace(/^0x/, "") ===
        normalized.replace(/^0x/, "")
  );
}

export async function issueCertificateRecord(data: {
  studentName: string;
  studentRoll: string;
  degree: string;
  graduationYear: number;
  cgpa: number;
  honors: string;
  universityCode: number;
  ipfsCid?: string;
  preparedBy?: string;
  approvedBy?: string;
}): Promise<Certificate> {
  // Simulate 1s ledger confirmation delay
  await new Promise((r) => setTimeout(r, 1000));

  const uni = getUniversityByCode(data.universityCode);
  if (!uni) throw new Error("Invalid University Code");

  const canonicalPayload = canonicalizeCredential(data);
  const fingerprint = await computeDigitalFingerprint(canonicalPayload);

  // Compute individual selective disclosure salted hashes
  const { salt, degreeHash, cgpaHash } = await computeSelectiveDisclosureHashes({
    degree: data.degree,
    cgpa: Number(data.cgpa),
    studentRoll: data.studentRoll,
  });

  // Generate ID: CERT-{UNI_SHORT}-{YEAR}-{LAST4ROLL}
  const cleanRoll = data.studentRoll.replace(/[^a-zA-Z0-9]/g, "");
  const rollSuffix = cleanRoll.slice(-4) || "0001";
  const id = `CERT-${uni.shortName}-${data.graduationYear}-${rollSuffix.toUpperCase()}`;

  const now = new Date();
  const randomHex = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");

  const newCert: Certificate = {
    id,
    digitalFingerprint: fingerprint,
    studentName: data.studentName.trim(),
    studentRoll: data.studentRoll.trim().toUpperCase(),
    degree: data.degree.trim(),
    graduationYear: Number(data.graduationYear),
    cgpa: Number(data.cgpa),
    honors: data.honors.trim() || "Pass Division",
    universityCode: uni.code,
    universityName: uni.name,
    issuanceDate: now.toISOString(),
    blockTimestamp: Math.floor(now.getTime() / 1000),
    blockNumber: 19842000 + Math.floor(Math.random() * 10000),
    institutionalSigner: uni.authorizedSigner,
    transactionId: `0x${randomHex}` as `0x${string}`,
    isValid: true,
    ipfsCid: data.ipfsCid?.trim() || `Qm${randomHex.slice(0, 44)}`,
    salt,
    degreeHash,
    cgpaHash,
    preparedBy: data.preparedBy || "Exam Clerk (Academic Section)",
    approvedBy: data.approvedBy || "Prof. S. K. Bansal (Registrar)",
    approvalTimestamp: Math.floor(now.getTime() / 1000),
  };

  const existing = getAllCertificates();
  const updated = [
    newCert,
    ...existing.filter(
      (c) =>
        c.id !== newCert.id && c.digitalFingerprint !== newCert.digitalFingerprint
    ),
  ];
  saveCertificates(updated);

  return newCert;
}

export async function issueBatchCertificates(
  rows: Array<{
    studentName: string;
    studentRoll: string;
    degree: string;
    graduationYear: number;
    cgpa: number;
    honors: string;
    universityCode: number;
    ipfsCid?: string;
  }>,
  meta?: {
    preparedBy?: string;
    approvedBy?: string;
  }
): Promise<Certificate[]> {
  await new Promise((r) => setTimeout(r, 1200));

  const results: Certificate[] = [];
  const existing = getAllCertificates();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const uni =
      getUniversityByCode(row.universityCode) || SUPPORTED_UNIVERSITIES[0];
    const canonicalPayload = canonicalizeCredential({
      ...row,
      universityCode: uni.code,
    });
    const fingerprint = await computeDigitalFingerprint(canonicalPayload);

    const { salt, degreeHash, cgpaHash } =
      await computeSelectiveDisclosureHashes({
        degree: row.degree,
        cgpa: Number(row.cgpa),
        studentRoll: row.studentRoll,
      });

    const cleanRoll = row.studentRoll.replace(/[^a-zA-Z0-9]/g, "");
    const rollSuffix = cleanRoll.slice(-4) || `${1000 + i}`;
    const id = `CERT-${uni.shortName}-${row.graduationYear}-${rollSuffix.toUpperCase()}`;

    const now = new Date();
    const randomHex = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");

    const cert: Certificate = {
      id,
      digitalFingerprint: fingerprint,
      studentName: row.studentName.trim(),
      studentRoll: row.studentRoll.trim().toUpperCase(),
      degree: row.degree.trim(),
      graduationYear: Number(row.graduationYear),
      cgpa: Number(row.cgpa),
      honors: row.honors?.trim() || "First Class",
      universityCode: uni.code,
      universityName: uni.name,
      issuanceDate: now.toISOString(),
      blockTimestamp: Math.floor(now.getTime() / 1000),
      blockNumber: 19842500 + i,
      institutionalSigner: uni.authorizedSigner,
      transactionId: `0x${randomHex}` as `0x${string}`,
      isValid: true,
      ipfsCid: row.ipfsCid?.trim() || `Qm${randomHex.slice(0, 44)}`,
      salt,
      degreeHash,
      cgpaHash,
      preparedBy: meta?.preparedBy || "Exam Clerk (Academic Section)",
      approvedBy: meta?.approvedBy || "Registrar / Dean",
      approvalTimestamp: Math.floor(now.getTime() / 1000),
    };
    results.push(cert);
  }

  // Combine and de-duplicate by ID
  const map = new Map<string, Certificate>();
  for (const c of existing) map.set(c.id, c);
  for (const c of results) map.set(c.id, c);

  saveCertificates(Array.from(map.values()));
  return results;
}

export async function revokeCertificateRecord(
  id: string,
  reason: string
): Promise<Certificate> {
  await new Promise((r) => setTimeout(r, 800));
  const certs = getAllCertificates();
  const target = certs.find(
    (c) => c.id.toLowerCase() === id.trim().toLowerCase()
  );
  if (!target) {
    throw new Error("Certificate ID not found on registry");
  }

  target.isValid = false;
  target.revocationReason = reason;
  target.revocationDate = new Date().toISOString();

  saveCertificates(certs);
  return target;
}

export async function verifyDocument(query: {
  id?: string;
  hash?: string;
  fileHash?: string;
  extractedText?: string;
  proof?: string;
  redacted?: string;
}): Promise<VerificationResult> {
  // Simulate cryptographic verification delay
  await new Promise((r) => setTimeout(r, 600));

  const allCerts = getAllCertificates();
  const isCgpaRedacted = query.redacted === "cgpa";

  // 1. Check if self-contained portable proof is provided
  if (query.proof) {
    const decoded = decodePortableProof(query.proof);
    if (decoded) {
      const { cert, isCgpaRedacted: proofRedacted } = decoded;
      // If not present in local storage, cache this authentic record locally for subsequent interactions
      const existingMatch = allCerts.find(
        (c) => c.id.toLowerCase() === cert.id.toLowerCase()
      );
      if (!existingMatch && cert.isValid) {
        saveCertificates([cert, ...allCerts]);
      }

      if (!cert.isValid) {
        return {
          status: "REVOKED",
          certificate: cert,
          message:
            "This academic credential was officially revoked by the issuing university authority.",
          isPortableProof: true,
          isCgpaRedacted: isCgpaRedacted || proofRedacted,
        };
      }

      return {
        status: "AUTHENTIC",
        certificate: cert,
        calculatedHash: cert.digitalFingerprint,
        isPortableProof: true,
        isCgpaRedacted: isCgpaRedacted || proofRedacted,
        message:
          "Official academic credential verified via portable cryptographic proof.",
      };
    }
  }

  // 2. Direct Certificate ID lookup
  if (query.id) {
    const cert = allCerts.find(
      (c) => c.id.toLowerCase() === query.id?.trim().toLowerCase()
    );
    if (cert) {
      if (!cert.isValid) {
        return {
          status: "REVOKED",
          certificate: cert,
          message:
            "This academic credential was officially revoked by the issuing university authority.",
          isCgpaRedacted,
        };
      }
      return {
        status: "AUTHENTIC",
        certificate: cert,
        calculatedHash: cert.digitalFingerprint,
        isCgpaRedacted,
        message:
          "Official academic credential verified with university registry ledger.",
      };
    }
  }

  // 3. Direct Hash / Digital Fingerprint lookup
  const targetHash = (query.hash || query.fileHash)?.trim().toLowerCase();
  if (targetHash) {
    const cert = allCerts.find(
      (c) =>
        c.digitalFingerprint.toLowerCase() === targetHash ||
        c.digitalFingerprint.toLowerCase().replace(/^0x/, "") ===
          targetHash.replace(/^0x/, "")
    );

    if (cert) {
      if (!cert.isValid) {
        return {
          status: "REVOKED",
          certificate: cert,
          calculatedHash: targetHash,
          isCgpaRedacted,
          message:
            "Certificate identified on registry, but status is currently REVOKED by the institution.",
        };
      }
      return {
        status: "AUTHENTIC",
        certificate: cert,
        calculatedHash: targetHash,
        isCgpaRedacted,
        message:
          "Digital fingerprint mathematically matches the immutable university registry entry.",
      };
    }

    // Hash not found -> Could be tampered or unregistered document
    return {
      status: "TAMPERED",
      calculatedHash: targetHash,
      targetId: query.id,
      message:
        "Digital fingerprint verification failed: The cryptographic fingerprint of this document does not match any official record in the registry. This indicates potential grade modification or an unauthorized document.",
    };
  }

  return {
    status: "NOT_FOUND",
    message: "No credential record matches the provided identifier or file.",
  };
}
