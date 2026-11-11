import { keccak256, toHex } from "viem";

/**
 * Creates a deterministic, canonical JSON representation of degree credential attributes.
 * This guarantees that key order does not affect the digital fingerprint.
 */
export function canonicalizeCredential(data: {
  studentName: string;
  studentRoll: string;
  degree: string;
  graduationYear: number;
  cgpa: number;
  honors: string;
  universityCode: number;
}): string {
  return JSON.stringify({
    cgpa: Number(data.cgpa).toFixed(2),
    degree: data.degree.trim(),
    graduationYear: Number(data.graduationYear),
    honors: data.honors.trim(),
    studentName: data.studentName.trim(),
    studentRoll: data.studentRoll.trim().toUpperCase(),
    universityCode: Number(data.universityCode),
  });
}

/**
 * Computes a standardized 256-bit Digital Fingerprint using the browser Web Crypto API (SHA-256).
 * Returns lowercase hex prefixed with 0x.
 */
export async function computeDigitalFingerprint(
  input: string | object
): Promise<string> {
  const text = typeof input === "string" ? input : JSON.stringify(input);
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `0x${hashHex}`;
  }

  // Fallback to viem keccak256 if subtleCrypto is unavailable
  return keccak256(toHex(text));
}

/**
 * Computes a Digital Fingerprint from raw ArrayBuffer (e.g. uploaded file/PDF)
 */
export async function hashArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `0x${hashHex}`;
  }
  return keccak256(new Uint8Array(buffer));
}

/**
 * Reads a File as ArrayBuffer and computes its digital fingerprint
 */
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return hashArrayBuffer(buffer);
}

/**
 * Extracts embedded FileOk credential ID or fingerprint from text or file content
 */
export function extractCertMetadataFromText(text: string): {
  id?: string;
  hash?: string;
} {
  const idMatch = text.match(/(?:CERT|FILEOK)-[A-Z0-9]+-\d{4}-[A-Z0-9]+/i);
  const hashMatch = text.match(/0x[a-fA-F0-9]{64}/);

  return {
    id: idMatch ? idMatch[0].toUpperCase() : undefined,
    hash: hashMatch ? hashMatch[0].toLowerCase() : undefined,
  };
}
