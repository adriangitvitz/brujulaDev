"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAccesly } from "accesly";

interface WalletContextValue {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<string | undefined>;
  signTransaction: (xdr: string, opts?: { networkPassphrase?: string }) => Promise<string>;
  refreshBalance: () => Promise<void>;
}

const defaultValue: WalletContextValue = {
  address: null,
  isConnected: false,
  isConnecting: false,
  connect: async () => undefined,
  signTransaction: async () => {
    throw new Error("Wallet not ready");
  },
  refreshBalance: async () => {},
};

const WalletCtx = createContext<WalletContextValue>(defaultValue);

/**
 * Inner component — only rendered on the client after mount.
 * Calls useAccesly() safely inside AcceslyProvider context.
 */
function WalletProviderInner({ children }: { children: React.ReactNode }) {
  const {
    wallet,
    loading,
    creating,
    connect: acceslyConnect,
    signTransaction: acceslySign,
    refreshBalance,
  } = useAccesly();

  // Keep sessionStorage in sync with the Accesly wallet.
  // This clears stale addresses from old Freighter sessions and keeps
  // dashboard pages (which read sessionStorage directly) consistent.
  useEffect(() => {
    if (wallet?.stellarAddress) {
      sessionStorage.setItem("brujula_wallet", wallet.stellarAddress);
    } else {
      sessionStorage.removeItem("brujula_wallet");
      sessionStorage.removeItem("brujula_role");
    }
  }, [wallet?.stellarAddress]);

  // Ref so connect() can read the latest wallet after the popup closes
  const walletRef = useRef(wallet);
  walletRef.current = wallet;

  const value: WalletContextValue = {
    address: wallet?.stellarAddress ?? null,
    isConnected: wallet !== null,
    isConnecting: loading || creating,
    connect: async () => {
      await acceslyConnect();
      return walletRef.current?.stellarAddress ?? undefined;
    },
    // opts.networkPassphrase ignored — Accesly handles network internally
    signTransaction: async (xdr, _opts) => {
      const { signedXdr } = await acceslySign(xdr);
      return signedXdr;
    },
    refreshBalance,
  };

  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>;
}

/**
 * WalletProvider — wraps the app.
 * During SSR and first render: provides safe stub values (no useAccesly call).
 * After client mount: renders WalletProviderInner which bridges to useAccesly.
 */
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <WalletCtx.Provider value={defaultValue}>{children}</WalletCtx.Provider>
    );
  }

  return <WalletProviderInner>{children}</WalletProviderInner>;
}

export function useWallet() {
  return useContext(WalletCtx);
}
