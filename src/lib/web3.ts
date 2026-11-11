import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
  type WalletClient,
  type PublicClient,
} from "viem";
import { arbitrumSepolia } from "viem/chains";
import { CONTRACT_ABI, CONTRACT_ADDRESS_ARBITRUM_SEPOLIA } from "./registry";

export interface WalletState {
  isConnected: boolean;
  address?: Address;
  chainId?: number;
  isCorrectNetwork: boolean;
  error?: string;
}

export function getPublicClient(): PublicClient {
  return createPublicClient({
    chain: arbitrumSepolia,
    transport: http("https://sepolia-rollup.arbitrum.io/rpc"),
  });
}

export async function connectBrowserWallet(): Promise<{
  walletClient: WalletClient;
  address: Address;
  chainId: number;
}> {
  if (typeof window === "undefined" || !("ethereum" in window)) {
    throw new Error(
      "No Web3 browser wallet detected. Please install MetaMask or Rabby."
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ethereum = (window as unknown as { ethereum: any }).ethereum;
  const walletClient = createWalletClient({
    chain: arbitrumSepolia,
    transport: custom(ethereum),
  });

  const [address] = await walletClient.requestAddresses();
  const chainId = await walletClient.getChainId();

  // Prompt chain switch if not Arbitrum Sepolia
  if (chainId !== arbitrumSepolia.id) {
    try {
      await walletClient.switchChain({ id: arbitrumSepolia.id });
    } catch {
      // Let it proceed or notify user
    }
  }

  return { walletClient, address, chainId };
}

export async function anchorCertificateOnChain(
  walletClient: WalletClient,
  account: Address,
  certHash: `0x${string}`,
  universityCode: bigint,
  certId: string,
  studentRoll: string
): Promise<`0x${string}`> {
  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS_ARBITRUM_SEPOLIA,
    abi: CONTRACT_ABI,
    functionName: "issueCertificate",
    args: [certHash, universityCode, certId, studentRoll],
    account,
    chain: arbitrumSepolia,
  });

  return hash;
}
