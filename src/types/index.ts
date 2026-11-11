export interface University {
  code: number;
  aisheCode: string; // e.g. "C-1042" or "U-0097"
  name: string;
  shortName: string;
  campus: string;
  authorizedSigner: `0x${string}`;
  established: number;
  accreditation: string;
  sealColor: string;
}

export interface Certificate {
  id: string; // e.g. "CERT-HSTU-2026-0482"
  digitalFingerprint: string; // 0x... 64-char hex hash
  studentName: string;
  studentRoll: string; // e.g. "2022-CSE-0482"
  degree: string;
  graduationYear: number;
  cgpa: number;
  honors: string;
  universityCode: number;
  universityName: string;
  issuanceDate: string; // ISO
  blockTimestamp: number;
  blockNumber: number;
  institutionalSigner: `0x${string}`;
  transactionId: `0x${string}`;
  isValid: boolean;
  revocationReason?: string;
  revocationDate?: string;
}

export type VerificationStatus = "AUTHENTIC" | "TAMPERED" | "REVOKED" | "NOT_FOUND";

export interface VerificationResult {
  status: VerificationStatus;
  certificate?: Certificate;
  calculatedHash?: string;
  targetId?: string;
  message: string;
  details?: {
    tamperedField?: string;
    originalValue?: string;
    tamperedValue?: string;
  };
}

export type ExecutionMode = "DEMO" | "TESTNET";

export type TabType = "verify" | "student" | "university" | "tamper";
