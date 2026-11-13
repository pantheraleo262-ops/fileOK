"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { VerifyPortal } from "@/components/VerifyPortal";
import { ExecutionMode, TabType } from "@/types";
import { connectBrowserWallet } from "@/lib/web3";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || undefined;
  const initialHash = searchParams.get("hash") || undefined;
  const initialProof = searchParams.get("proof") || undefined;
  const initialRedacted = searchParams.get("redacted") || undefined;

  const [mode, setMode] = useState<ExecutionMode>("DEMO");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | undefined>(undefined);

  const handleConnectWallet = async () => {
    try {
      const { address } = await connectBrowserWallet();
      setWalletConnected(true);
      setWalletAddress(address);
    } catch {
      alert(
        "Could not connect Web3 wallet. If you do not have MetaMask installed, you can freely use Demo Mode with zero setup!"
      );
    }
  };

  const handleSelectTab = (tab: TabType) => {
    router.push(`/?tab=${tab}`);
  };

  const handleGlobalSearch = (query: string) => {
    if (query.startsWith("0x")) {
      router.push(`/?tab=verify&hash=${encodeURIComponent(query)}`);
    } else {
      router.push(`/?tab=verify&id=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0F0F0F] flex flex-col font-sans selection:bg-[#065FD4] selection:text-white">
      {/* Top Header */}
      <Header
        currentTab="verify"
        onSelectTab={handleSelectTab}
        mode={mode}
        onToggleMode={setMode}
        walletConnected={walletConnected}
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
        onGlobalSearch={handleGlobalSearch}
      />

      {/* Main View Port */}
      <div className="relative flex-1 flex flex-col">
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-emerald-50/50 pointer-events-none opacity-80 blur-xl" />

        <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <VerifyPortal
            initialCertId={initialId}
            initialHash={initialHash}
            initialProof={initialProof}
            initialRedacted={initialRedacted}
            mode={mode}
            onNavigateToTamperLab={() => router.push("/?tab=tamper")}
          />
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E5] bg-[#F8F9FA] py-10 mt-16 text-xs text-[#606060]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#0F0F0F] text-white">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-bold text-[#0F0F0F]">
                  FileOk // Academic Trust Network
                </span>
              </div>
              <p className="text-xs text-[#606060] max-w-md leading-relaxed">
                Next-generation academic credential authenticity infrastructure.
                Empowering universities to anchor verifiable graduates on-chain,
                and enabling employers to verify diplomas in milliseconds with
                zero technical friction.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#0F0F0F] uppercase tracking-wider block">
                Verification Standard
              </span>
              <ul className="space-y-1.5 text-xs text-[#606060]">
                <li>
                  <strong className="text-[#0F0F0F]">Digital Fingerprint:</strong>{" "}
                  Cryptographic SHA-256 hash
                </li>
                <li>
                  <strong className="text-[#0F0F0F]">Official Registry:</strong>{" "}
                  Smart Contract Ledger
                </li>
                <li>
                  <strong className="text-[#0F0F0F]">Cross-Device Proof:</strong>{" "}
                  Self-Contained Portable Proof
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#0F0F0F] uppercase tracking-wider block">
                Ledger Specifications
              </span>
              <div className="space-y-1 text-xs text-[#606060] font-mono">
                <div>Contract: 0x35Fa...009e</div>
                <div>Network: Arbitrum Sepolia</div>
                <div>Hash Standard: SHA-256 / Keccak</div>
                <div className="flex items-center gap-1 text-[#137333] pt-1 font-sans font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Dual Execution Mode Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E5E5E5] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#606060]">
            <div>
              © {new Date().getFullYear()} FileOk Academic Trust Network. All
              rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>NAAC / AICTE Accredited Standards</span>
              <span>•</span>
              <span>ISO 27001 Cryptographic Alignment</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-[#606060] text-sm">
          Loading FileOk Verifier...
        </div>
      }
    >
      <VerifyPageContent />
    </Suspense>
  );
}
