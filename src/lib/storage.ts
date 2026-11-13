import { Certificate, PendingApproval } from "@/types";

export const STORAGE_KEY = "fileok_registry_certificates_v2";
export const LEGACY_STORAGE_KEY = "veridoc_registry_certificates_v2";
export const PENDING_QUEUE_STORAGE_KEY = "fileok_pending_approvals_v1";

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
    ipfsCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    cgpaHash: "0x39a1c8b742e9b14f8280f128bc24d99f0e4b7890123456789abcdef012345678",
    degreeHash: "0x7b23588a91c10927e1f4094a6401928374a5927392a837461938592019482736",
    preparedBy: "Exam Clerk (Academic Section)",
    approvedBy: "Prof. S. K. Bansal (Registrar)",
    approvalTimestamp: 1781520600,
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
    ipfsCid: "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx",
    cgpaHash: "0x89f1d2e3b4a5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1",
    degreeHash: "0x12a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3",
    preparedBy: "Exam Clerk (Academic Section)",
    approvedBy: "Dr. Arvind Rao (Registrar)",
    approvalTimestamp: 1781966100,
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
    ipfsCid: "QmPZ9gcCEpqKTo6aq61g2nXGUhM49wbdukSeaTGDvKnWax",
    revocationReason:
      "Senate Order #SO-2025/44 — Disciplinary action: Academic misconduct & prerequisite course falsification confirmed by Academic Senate.",
    revocationDate: "2025-09-18T09:30:00Z",
    preparedBy: "Exam Clerk (Academic Section)",
    approvedBy: "Prof. M. K. Sharma (Registrar)",
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
    ipfsCid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    preparedBy: "Exam Clerk (Academic Section)",
    approvedBy: "Prof. S. K. Bansal (Registrar)",
    approvalTimestamp: 1781522400,
  },
];

// Seed pending approvals for the Two-Person Governance Flow
export const SEED_PENDING_APPROVALS: PendingApproval[] = [
  {
    id: "REQ-HSTU-2026-0914",
    type: "SINGLE",
    preparedBy: "Exam Clerk (Academic Section)",
    submittedAt: "2026-11-13T09:30:00Z",
    universityCode: 1042,
    universityName: "Haryana State Tech University",
    status: "PENDING",
    singleRecord: {
      studentName: "Vikram Malhotra",
      studentRoll: "2022-CSE-0914",
      degree: "Bachelor of Technology in Computer Science & Engineering",
      graduationYear: 2026,
      cgpa: 9.15,
      honors: "First Class with Distinction",
      ipfsCid: "QmRazDog1ndsp965eD5S6g8fePjR7aLgQe9XjX5k285hT2",
    },
  },
  {
    id: "REQ-DTU-2026-BATCH1",
    type: "BATCH",
    preparedBy: "Exam Clerk (Academic Section)",
    submittedAt: "2026-11-13T11:15:00Z",
    universityCode: 2091,
    universityName: "Delhi Technological University",
    status: "PENDING",
    batchRecords: [
      {
        studentName: "Rohan Kapoor",
        studentRoll: "2022-ECE-1105",
        degree: "Bachelor of Technology in Electronics & Communications",
        graduationYear: 2026,
        cgpa: 8.92,
        honors: "First Class with Distinction",
        ipfsCid: "QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
      },
      {
        studentName: "Meera Nair",
        studentRoll: "2022-ECE-1106",
        degree: "Bachelor of Technology in Electronics & Communications",
        graduationYear: 2026,
        cgpa: 9.4,
        honors: "Chancellor's Gold Medalist",
        ipfsCid: "QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn",
      },
    ],
  },
];

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
    console.error("Failed to save certificates to localStorage", e);
  }
}

export function getPendingApprovals(): PendingApproval[] {
  if (typeof window === "undefined") {
    return SEED_PENDING_APPROVALS;
  }
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        PENDING_QUEUE_STORAGE_KEY,
        JSON.stringify(SEED_PENDING_APPROVALS)
      );
      return SEED_PENDING_APPROVALS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_PENDING_APPROVALS;
  }
}

export function savePendingApprovals(items: PendingApproval[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PENDING_QUEUE_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save pending approvals to localStorage", e);
  }
}

export function addPendingApproval(item: PendingApproval): void {
  const existing = getPendingApprovals();
  savePendingApprovals([item, ...existing.filter((q) => q.id !== item.id)]);
}

export function updatePendingApprovalStatus(
  id: string,
  status: "APPROVED" | "REJECTED",
  meta?: { reason?: string; approvedBy?: string }
): PendingApproval | undefined {
  const items = getPendingApprovals();
  const target = items.find((q) => q.id === id);
  if (target) {
    target.status = status;
    if (status === "APPROVED") {
      target.approvedAt = new Date().toISOString();
      target.approvedBy = meta?.approvedBy || "Registrar / Dean";
    } else {
      target.rejectionReason = meta?.reason || "Rejected by Registrar";
    }
    savePendingApprovals(items);
  }
  return target;
}
