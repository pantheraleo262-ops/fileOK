# VeriDoc // Academic Trust Network
### Decentralized Multi-University Academic Credential Registry & Verification Ledger

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)](https://soliditylang.org/)
[![Viem](https://img.shields.io/badge/Viem-2.5-orange)](https://viem.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.txt)

---

## Executive Summary

**VeriDoc** is an enterprise-grade, decentralized academic credential registry built to eradicate diploma fraud, streamline international recruitment, and eliminate single points of failure in centralized educational repositories.

By translating complex Web3 cryptography into a consumer-grade, zero-jargon **YouTube Light Mode** interface, VeriDoc allows employers, recruiters, and students to authenticate university credentials in milliseconds without requiring cryptocurrency wallets, gas fees, or third-party API keys.

---

## System Architecture: Hybrid Web2-Web3 Infrastructure

VeriDoc combines client-side cryptographic hashing with distributed ledger immutability and institutional sovereignty:

```
                                  ┌──────────────────────────────────────────────┐
                                  │      VeriDoc // Academic Trust Network       │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                ┌───────────────────────────┬────────────┴────────────┬───────────────────────────┐
                ▼                           ▼                         ▼                           ▼
      ┌───────────────────┐       ┌───────────────────┐     ┌───────────────────┐       ┌───────────────────┐
      │ 1. Public Verifier│       │  2. Student Hub   │     │ 3. Admin Portal   │       │   4. Tamper Lab   │
      │   (Zero-Login)    │       │ (Roll No. Login)  │     │   (AISHE-Gated)   │       │   (Playground)    │
      └─────────┬─────────┘       └─────────┬─────────┘     └─────────┬─────────┘       └─────────┬─────────┘
                │                           │                         │                           │
                ▼                           ▼                         ▼                           ▼
      ┌───────────────────┐       ┌───────────────────┐     ┌───────────────────┐       ┌───────────────────┐
      │ • Dual-Hash Engine│       │ • Official Degree │     │ • Single Issuance │       │ • Rahul Sharma    │
      │ • Drag & Drop PDF │       │   Seal & Watermark│     │ • Bulk CSV Batch  │       │   (8.85 CGPA)     │
      │ • Camera QR Scan  │       │ • Stamped PDF DL  │     │ • Merkle/Batch Root       │ • Grade Tampering │
      │ • HR Clearance    │       │ • Verifiable Link │     │ • Senate Order    │       │   (8.85 -> 9.85)  │
      │   Report (PDF)    │       │ • Add to LinkedIn │     │   Revocation      │       │ • Avalanche Diff  │
      │ • 3 Result States │       │ • 1-Click Demo    │     │ • Sample CSV DL   │       │ • DigiLocker Comp │
      └───────────────────┘       └───────────────────┘     └───────────────────┘       └───────────────────┘
                                                         │
                                ┌────────────────────────┴────────────────────────┐
                                ▼                                                 ▼
                      [Demo Mode - Default]                              [Testnet Mode]
              Client-side LocalStorage & Web Crypto               Viem Injected Provider / EIP-1193
             1-sec confirmation delay simulation                Arbitrum Sepolia (Chain ID: 421614)
```

### Zero-Jargon Translation Matrix

| Technical Cryptographic Term | VeriDoc User-Facing Term | Plain English Purpose |
| :--- | :--- | :--- |
| **SHA-256 / Keccak256** | **Digital Fingerprint** | Unique 256-bit mathematical summary of degree attributes |
| **Smart Contract** | **Official University Registry** | Multi-tenant immutable ledger governing authorized signers |
| **Issuer Wallet Address** | **Institutional Signer** | Authorized public cryptographic key of the university |
| **Tenant ID** | **University AISHE Code** | Official government educational institution identifier |

---

## Core Roles & Features

### 1. Tier 1: University Admin Portal (AISHE Gated)
- **Institutional Access Gate**: Gated by 4-digit University AISHE codes (`1042 - Haryana State Tech Univ`, `2091 - Delhi Tech Univ`, `3054 - NIT Kurukshetra`, `4108 - IIST Bengaluru`).
- **Single Degree Issuance**: Interactive form with real-time preview and 1-second simulated confirmation delay.
- **Bulk Batch Issuance (CSV)**: Drag-and-drop CSV parser powered by `PapaParse`. Computes deterministic digital fingerprints for all graduates and anchors them in a single batch operation. Includes a **"Download Sample CSV Template"** button.
- **Transparent Revocation Engine**: Authorized staff can revoke degrees citing official **Senate References** (e.g., *Senate Order #SO-2026/89 — Academic Misconduct*).

### 2. Tier 2: Student Self-Service Hub (Private Access)
- **Login Gate**: University Code + Student Roll Number (pre-seeded with `2022-CSE-0482` for Rahul Sharma).
- **Official Diploma Preview**: High-resolution degree card with guilloché security borders, gold seal, and university crest.
- **Download Certified PDF**: Generates an A4 landscape PDF with embedded QR verification code and cryptographic audit footer via `jsPDF`.
- **One-Click LinkedIn Integration**: Directly adds the verified certification to the student's LinkedIn profile with verifiable URL.
- **Copy Public Verification Link**: Shareable link (`/?tab=verify&id=CERT-HSTU-2026-0482`) for resumes and portfolios.

### 3. Tier 3: Public Verification Portal (100% Zero-Login for HR)
- **Universal Access**: Recruiters and background-check agencies can verify credentials with zero login.
- **3 Verification Pathways**:
  1. **File Dropzone**: Drag-and-drop degree PDF or image; browser computes SHA-256 via Web Crypto API.
  2. **Camera QR Scanner**: Real-time webcam scanning via `html5-qrcode`.
  3. **Certificate ID / Fingerprint Search**: Direct lookup with quick-fill sample presets.
- **Dual-Hashing Engine**:
  - *Layer 1 (Canonical Data Payload)*: Deterministic SHA-256 over `Name + Roll + Degree + CGPA + Year`.
  - *Layer 2 (File Binary Hash)*: SHA-256 digest over the raw PDF byte stream.
- **3 Visual Result States**:
  - **AUTHENTIC (Green)**: Verified credentials, blockchain anchoring timestamp, block number, institutional signer address, and a dedicated **"Download HR Clearance Report (PDF)"** button generating a formal 1-page recruiter background check audit certificate.
  - **TAMPERED / UNREGISTERED (Red)**: Instant alert showing cryptographic mismatch, protecting employers against forged grades.
  - **REVOKED (Amber/Orange)**: Displays the exact revocation date and official Senate Order reference.

### 4. Tier 4: Interactive Tamper Lab & DigiLocker Comparison
- **Live Hands-on Playground**: Loads authentic sample for Rahul Sharma (CGPA: 8.85).
- **Simulate Grade Tampering**: One-click alteration of CGPA from `8.85` to `9.85`, illustrating the **Cryptographic Avalanche Effect** with character-by-character mismatch highlights.
- **Architecture Deep-Dive**: Explains how on-chain hash anchoring complements centralized repositories (like DigiLocker and the National Academic Depository) by eliminating single points of failure and enabling friction-free global verification for international employers.

---

## Dual Execution Modes

| Feature | Demo Mode (Default) | Testnet Mode |
| :--- | :--- | :--- |
| **Prerequisites** | None (Zero Setup) | Browser Wallet (MetaMask / Rabby) |
| **Gas Fees** | Free (0 Gas) | Arbitrum Sepolia Testnet ETH |
| **Storage Layer** | LocalStorage + In-Memory State | EVM Smart Contract (`0x35Fa...009e`) |
| **Confirmation Delay** | Realistic 1.0s Simulation | On-Chain Block Confirmation |
| **Ideal For** | Hackathon Demos, Recruiters, Offline Testing | Production & On-Chain Auditing |

---

## Smart Contract: `CertificateRegistry.sol`

Located in [`contracts/CertificateRegistry.sol`](contracts/CertificateRegistry.sol):
- Multi-tenant mapping: `universityCode => University` and `certHash => CertificateRecord`.
- Functions:
  - `registerUniversity(uint256 universityCode, string name, address signer)`
  - `issueCertificate(bytes32 certHash, uint256 universityCode, string certId, string studentRoll)`
  - `issueBatch(bytes32[] certHashes, uint256 universityCode, string[] certIds, string[] studentRolls)`
  - `verifyCertificate(bytes32 certHash)`
  - `revokeCertificate(bytes32 certHash, string reason)`

---

## Quickstart & Local Installation

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm, pnpm, or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/pantheraleo262-ops/fileOK.git
cd fileOK
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 (YouTube Light Mode design system)
- **Icons**: Lucide React
- **Web3 & Cryptography**: Viem, Web Crypto API (`SubtleCrypto` SHA-256)
- **Document Generation**: jsPDF (A4 degree certificates and 1-page HR clearance reports)
- **Data & QR Handling**: PapaParse, QRCode, HTML5-QRCode
- **Smart Contract**: Solidity 0.8.20

---

## Team & Credits

- **Shaurya** (1st Year)
- **Shruti** (3rd Year)
- **Misha** (1st Year)

*Licensed under the [MIT License](LICENSE.txt).*
