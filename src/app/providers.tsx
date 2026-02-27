"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AcceslyProvider, ConnectButton, SwapModal } from "accesly";
import { WalletProvider, useWallet } from "@/contexts/WalletContext";

function AppNav() {
  const [showSwap, setShowSwap] = useState(false);
  const { refreshBalance } = useWallet(); // SSR-safe — never calls useAccesly directly
  const pathname = usePathname();

  if (pathname === "/comenzar") return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <button
        onClick={() => setShowSwap(true)}
        className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg backdrop-blur border border-white/20 transition-colors"
      >
        Swap
      </button>
      <ConnectButton />
      {showSwap && (
        <SwapModal
          onClose={() => setShowSwap(false)}
          onSuccess={() => {
            setShowSwap(false);
            refreshBalance();
          }}
        />
      )}
    </div>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AcceslyProvider
      appId={process.env.NEXT_PUBLIC_ACCESLY_APP_ID!}
      network="testnet"
    >
      <WalletProvider>
        <AppNav />
        {children}
      </WalletProvider>
    </AcceslyProvider>
  );
}
