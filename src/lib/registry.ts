import { University, Certificate, VerificationResult } from "@/types";
import {
  canonicalizeCredential,
  computeDigitalFingerprint,
} from "./crypto";

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

const STORAGE_KEY = "fileok_registry_certificates_v2";
const LEGACY_STORAGE_KEY = "veridoc_registry_certificates_v2";

// Deterministic seed records
export const SEED_CERTIFICATES: Certificate[] = [
  {
    id: "CERT-HSTU-2026-0482",
    digitalFingerprint:
      "0x4b785e783427187123bf04505f9f60cb57c91ad9fec0e3c5a61066c878931a22",
    studentName: "Rahul Sharma",
    studentRoll: "2022-CSE-0482",
    degree: "Bachelor of Technology in Computer Science & Engineering",
    graduationYear: 2026,
    cgpa: 8.85,
    honors: "First Class with Distinction",
    universityCode: 1042,
    universityName: "Haryana State Tech University",
    issuanceDate: "2026-06-15T10:30:00Z",
    blockTimestamp: 1781520600,
    blockNumber: 19842103,
    institutionalSigner: "0x89205A3A3b2A55388eC73170ce2FF0396542765A",
    transactionId:
      "0x91e84762c954df6a94fb21ec3d7790b83b3e0c0347209cf296541f53e6b72a44",
    isValid: true,
  },
  {
    id: "CERT-DTU-2026-1092",
    digitalFingerprint:
      "0xa72f5d94719b35e26b1a7741d476839441ec96307137b7fa84cbffef8720aa01",
    studentName: "Priya Patel",
    studentRoll: "2022-ECE-1092",
    degree: "Bachelor of Technology in Electronics & Communications",
    graduationYear: 2026,
    cgpa: 9.2,
    honors: "First Class with Distinction",
    universityCode: 2091,
    universityName: "Delhi Technological University",
    issuanceDate: "2026-06-20T14:15:00Z",
    blockTimestamp: 1781966100,
    blockNumber: 19845920,
    institutionalSigner: "0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB",
    transactionId:
      "0x42cbf1064eeecbd0176840d25687cf65adfc01c10714c6e9ff9d618d7ef20491",
    isValid: true,
  },
  {
    id: "CERT-NIT-2025-0314",
    digitalFingerprint:
      "0x89b6dc0835f8e53995f32b8aa844df0e7ca1bf8703a9f022ef7c0502157a9120",
    studentName: "Amit Verma",
    studentRoll: "2021-MECH-0314",
    degree: "Bachelor of Technology in Mechanical Engineering",
    graduationYear: 2025,
    cgpa: 7.6,
    honors: "Second Class Division",
    universityCode: 3054,
    universityName: "National Institute of Technology",
    issuanceDate: "2025-07-10T11:00:00Z",
    blockTimestamp: 1752145200,
    blockNumber: 18210412,
    institutionalSigner: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    transactionId:
      "0xdc439f0714b26715f3ecab4458f310f846e91cb345a90d4538965f7c358f2882",
    isValid: false,
    revocationReason:
      "Senate Order #SO-2025/44 — Disciplinary action: Academic misconduct & prerequisite course falsification confirmed by Academic Senate.",
    revocationDate: "2025-09-18T09:30:00Z",
  },
  {
    id: "CERT-HSTU-2026-0771",
    digitalFingerprint:
      "0x3f5108b34007119e7ca85651c6c5ad35b75f82ce6a84eb1a646c21e64908bd18",
    studentName: "Ananya Iyer",
    studentRoll: "2022-CSE-0771",
    degree: "Bachelor of Technology in Computer Science & Engineering",
    graduationYear: 2026,
    cgpa: 9.65,
    honors: "Chancellor's Gold Medalist",
    universityCode: 1042,
    universityName: "Haryana State Tech University",
    issuanceDate: "2026-06-15T11:00:00Z",
    blockTimestamp: 1781522400,
    blockNumber: 19842210,
    institutionalSigner: "0x89205A3A3b2A55388eC73170ce2FF0396542765A",
    transactionId:
      "0xfe0843ca2058e0a16c35fb1925b6e4e5b3ec0fa508ffb8c5697274da51139e72",
    isValid: true,
  },
];

// Helper to get all certificates from storage
export function getAllCertificates(): Certificate[] {
  if (typeof window === "undefined") {
    return SEED_CERTIFICATES;
  }
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        raw = legacyRaw;
        localStorage.setItem(STORAGE_KEY, legacyRaw);
      }
    }
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CERTIFICATES));
      return SEED_CERTIFICATES;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_CERTIFICATES;
  }
}

export function saveCertificates(certs: Certificate[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(certs));
  } catch (e) {
    console.error("Failed to save to localStorage", e);
  }
}

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
}): Promise<Certificate> {
  // Simulate 1s ledger confirmation delay
  await new Promise((r) => setTimeout(r, 1000));

  const uni = getUniversityByCode(data.universityCode);
  if (!uni) throw new Error("Invalid University Code");

  const canonicalPayload = canonicalizeCredential(data);
  const fingerprint = await computeDigitalFingerprint(canonicalPayload);

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
  };

  const existing = getAllCertificates();
  // Filter out duplicate if same ID or roll existed
  const updated = [
    newCert,
    ...existing.filter((c) => c.id !== newCert.id && c.digitalFingerprint !== newCert.digitalFingerprint),
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
  }>
): Promise<Certificate[]> {
  await new Promise((r) => setTimeout(r, 1200));

  const results: Certificate[] = [];
  const existing = getAllCertificates();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const uni = getUniversityByCode(row.universityCode) || SUPPORTED_UNIVERSITIES[0];
    const canonicalPayload = canonicalizeCredential({
      ...row,
      universityCode: uni.code,
    });
    const fingerprint = await computeDigitalFingerprint(canonicalPayload);

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
  const target = certs.find((c) => c.id.toLowerCase() === id.trim().toLowerCase());
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
}): Promise<VerificationResult> {
  // Simulate cryptographic verification delay
  await new Promise((r) => setTimeout(r, 600));

  const allCerts = getAllCertificates();

  // 1. Direct Certificate ID lookup
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
        };
      }
      return {
        status: "AUTHENTIC",
        certificate: cert,
        calculatedHash: cert.digitalFingerprint,
        message:
          "Official academic credential verified with university registry ledger.",
      };
    }
  }

  // 2. Direct Hash / Digital Fingerprint lookup
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
          message:
            "Certificate identified on registry, but status is currently REVOKED by the institution.",
        };
      }
      return {
        status: "AUTHENTIC",
        certificate: cert,
        calculatedHash: targetHash,
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
