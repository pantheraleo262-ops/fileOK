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
  // Privacy & Selective Disclosure commitments
  cgpaHash?: string;
  degreeHash?: string;
  salt?: string;
  // Decentralized Storage
  ipfsCid?: string;
  // Governance & Two-Person Approval audit trail
  preparedBy?: string;
  approvedBy?: string;
  approvalTimestamp?: number;
}

export type StaffRole = "CLERK" | "REGISTRAR";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type SubmissionType = "SINGLE" | "BATCH";

export interface PendingApproval {
  id: string; // e.g. "REQ-HSTU-2026-0482"
  type: SubmissionType;
  preparedBy: string; // e.g. "Exam Clerk (Academic Section)"
  submittedAt: string;
  universityCode: number;
  universityName: string;
  status: ApprovalStatus;
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  singleRecord?: {
    studentName: string;
    studentRoll: string;
    degree: string;
    graduationYear: number;
    cgpa: number;
    honors: string;
    ipfsCid?: string;
  };
  batchRecords?: Array<{
    studentName: string;
    studentRoll: string;
    degree: string;
    graduationYear: number;
    cgpa: number;
    honors: string;
    ipfsCid?: string;
  }>;
}

export type VerificationStatus = "AUTHENTIC" | "TAMPERED" | "REVOKED" | "NOT_FOUND";

export interface VerificationResult {
  status: VerificationStatus;
  certificate?: Certificate;
  calculatedHash?: string;
  targetId?: string;
  message: string;
  isPortableProof?: boolean;
  isCgpaRedacted?: boolean;
  details?: {
    tamperedField?: string;
    originalValue?: string;
    tamperedValue?: string;
  };
}

export type ExecutionMode = "DEMO" | "TESTNET";

export type TabType = "verify" | "student" | "university" | "tamper";
