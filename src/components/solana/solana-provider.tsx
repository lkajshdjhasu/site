"use client";

import { WalletError } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { ReactNode, useCallback, useMemo, useEffect } from "react";

import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";

require("@solana/wallet-adapter-react-ui/styles.css");

export const WalletButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  {
    ssr: false,
  }
);

function WalletManager() {
  const { connected, publicKey } = useWallet();
  const { data: session } = useSession();
  const { handleSignIn, handleSignOut } = useWalletAuth();

  useEffect(() => {
    console.log("WalletManager state:", {
      connected,
      publicKey: publicKey?.toBase58(),
      sessionExists: !!session,
    });

    if (!connected && session) {
      console.log("Wallet disconnected, ending session...");
      handleSignOut();
    }
  }, [connected, session, handleSignOut, publicKey]);

  return null;
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(
    () =>
      "https://mainnet.helius-rpc.com/?api-key=30d6933d-9bed-49ce-96c7-6ec975d805bc",
    []
  );

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  const onError = useCallback((error: WalletError) => {
    console.error("Wallet error:", error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalProvider>
          <WalletManager />
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
