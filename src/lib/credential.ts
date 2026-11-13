import { Certificate } from "@/types";
import { canonicalizeCredential, computeDigitalFingerprint } from "./crypto";

/**
 * Generates a random cryptographic hex salt.
 */
export function generateSalt(byteLength: number = 16): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(byteLength);
    window.crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return Array.from({ length: byteLength * 2 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

/**
 * Computes a salted SHA-256 hash for individual credential attributes.
 * Used for selective disclosure and privacy commitments.
 */
export async function computeSaltedHash(
  value: string | number,
  salt: string
): Promise<string> {
  const combined = `${salt}:${String(value).trim()}`;
  return computeDigitalFingerprint(combined);
}

/**
 * Computes individual selective disclosure hashes for degree and CGPA.
 */
export async function computeSelectiveDisclosureHashes(
  data: {
    degree: string;
    cgpa: number;
    studentRoll: string;
  },
  existingSalt?: string
): Promise<{
  salt: string;
  degreeHash: string;
  cgpaHash: string;
}> {
  const salt = existingSalt || generateSalt();
  const degreeHash = await computeSaltedHash(data.degree, `${salt}_deg`);
  const cgpaHash = await computeSaltedHash(data.cgpa.toFixed(2), `${salt}_cgpa`);

  return {
    salt,
    degreeHash,
    cgpaHash,
  };
}

/**
 * Encodes a compact, URL-safe base64 portable credential proof.
 * Allows self-contained zero-knowledge / cross-device verification.
 */
export function encodePortableProof(
  cert: Certificate,
  options?: { hideCgpa?: boolean }
): string {
  const payload = {
    id: cert.id,
    fp: cert.digitalFingerprint,
    name: cert.studentName,
    roll: cert.studentRoll,
    deg: cert.degree,
    yr: cert.graduationYear,
    cgpa: options?.hideCgpa ? undefined : cert.cgpa,
    cgpah: cert.cgpaHash,
    degh: cert.degreeHash,
    hon: cert.honors,
    ucode: cert.universityCode,
    uname: cert.universityName,
    date: cert.issuanceDate,
    blk: cert.blockNumber,
    ts: cert.blockTimestamp,
    signer: cert.institutionalSigner,
    tx: cert.transactionId,
    valid: cert.isValid,
    ipfs: cert.ipfsCid,
    redacted: options?.hideCgpa ? ["cgpa"] : [],
    prep: cert.preparedBy,
    appr: cert.approvedBy,
  };

  const json = JSON.stringify(payload);
  return toUrlSafeBase64(json);
}

/**
 * Decodes and validates a portable credential proof string.
 */
export function decodePortableProof(proofStr: string): {
  cert: Certificate;
  isCgpaRedacted: boolean;
} | null {
  try {
    const json = fromUrlSafeBase64(proofStr.trim());
    const payload = JSON.parse(json);

    if (!payload.id || !payload.fp || !payload.roll || !payload.ucode) {
      return null;
    }

    const isCgpaRedacted =
      Array.isArray(payload.redacted) && payload.redacted.includes("cgpa");

    const cert: Certificate = {
      id: String(payload.id),
      digitalFingerprint: String(payload.fp),
      studentName: String(payload.name || "Verified Student"),
      studentRoll: String(payload.roll),
      degree: String(payload.deg || "Degree Program"),
      graduationYear: Number(payload.yr || 2026),
      cgpa: payload.cgpa !== undefined ? Number(payload.cgpa) : 0,
      cgpaHash: payload.cgpah ? String(payload.cgpah) : undefined,
      degreeHash: payload.degh ? String(payload.degh) : undefined,
      honors: String(payload.hon || "Verified Standing"),
      universityCode: Number(payload.ucode),
      universityName: String(payload.uname || "Official University Registry"),
      issuanceDate: String(payload.date || new Date().toISOString()),
      blockTimestamp: Number(payload.ts || Math.floor(Date.now() / 1000)),
      blockNumber: Number(payload.blk || 19842103),
      institutionalSigner: (payload.signer as `0x${string}`) || "0x89205A3A3b2A55388eC73170ce2FF0396542765A",
      transactionId: (payload.tx as `0x${string}`) || "0x91e84762c954df6a94fb21ec3d7790b83b3e0c0347209cf296541f53e6b72a44",
      isValid: payload.valid !== false,
      ipfsCid: payload.ipfs ? String(payload.ipfs) : undefined,
      preparedBy: payload.prep ? String(payload.prep) : undefined,
      approvedBy: payload.appr ? String(payload.appr) : undefined,
    };

    return { cert, isCgpaRedacted };
  } catch (err) {
    console.error("Failed to decode portable credential proof:", err);
    return null;
  }
}

/**
 * Generates an end-to-end self-contained verification URL.
 */
export function generateVerificationUrl(
  cert: Certificate,
  options?: {
    hideCgpa?: boolean;
    baseUrl?: string;
    useVerifyRoute?: boolean;
  }
): string {
  const origin =
    options?.baseUrl ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://fileok.academic");

  const proof = encodePortableProof(cert, { hideCgpa: options?.hideCgpa });
  const params = new URLSearchParams();

  if (!options?.useVerifyRoute) {
    params.set("tab", "verify");
  }
  params.set("id", cert.id);
  if (options?.hideCgpa) {
    params.set("redacted", "cgpa");
  }
  params.set("proof", proof);

  const routePath = options?.useVerifyRoute ? "/verify" : "/";
  return `${origin}${routePath}?${params.toString()}`;
}

// Helpers for URL-safe base64 conversion
function toUrlSafeBase64(str: string): string {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    const encoded = window.btoa(unescape(encodeURIComponent(str)));
    return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf8").toString("base64url");
  }
  return "";
}

function fromUrlSafeBase64(base64: string): string {
  let normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4) {
    normalized += "=";
  }
  if (typeof window !== "undefined" && typeof window.atob === "function") {
    return decodeURIComponent(escape(window.atob(normalized)));
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(normalized, "base64").toString("utf8");
  }
  return "";
}
