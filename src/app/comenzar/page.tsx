"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import BrujulaLogo from "@/components/landing/brujula-logo";
import Link from "next/link";

type Role = "employer" | "freelancer" | null;

export default function ComenzarPage() {
  const router = useRouter();
  const { address, isConnected, isConnecting, connect } = useWallet();
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      let walletAddress: string | null | undefined = address;
      if (!isConnected || !walletAddress) {
        walletAddress = await connect();
        if (!walletAddress) {
          setIsLoading(false);
          return;
        }
      }

      sessionStorage.setItem("brujula_role", selectedRole);
      sessionStorage.setItem("brujula_wallet", walletAddress);

      router.push(
        selectedRole === "employer"
          ? "/dashboard/employer"
          : "/dashboard/freelancer"
      );
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="p-5 sm:p-7 border-b border-white/5">
        <Link href="/" className="inline-flex items-center gap-2 opacity-90 hover:opacity-100 transition cursor-pointer">
          <BrujulaLogo size={28} />
          <span className="font-[family-name:var(--font-heading)] text-lg tracking-wide font-semibold">
            BRUJULA
          </span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-xl">

          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight mb-3">
              ¿Cómo vas a operar en Brújula?
            </h1>
            <p className="text-neutral-400">
              Selecciona tu rol para configurar tu entorno profesional
            </p>
          </div>

          {/* Role cards */}
          <div className="space-y-4 mb-10">

            {/* Employer */}
            <button
              onClick={() => setSelectedRole("employer")}
              className={`w-full text-left p-6 rounded-xl border transition-all duration-200 cursor-pointer
              ${
                selectedRole === "employer"
                  ? "border-[#2F4E79] bg-[#1F2A44]/40 shadow-[0_0_0_1px_rgba(47,78,121,0.4)]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] active:bg-white/[0.08]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-colors
                  ${selectedRole === "employer"
                    ? "bg-[#2F4E79]"
                    : "bg-white/5"}`}>
                  
                  {/* work_outline */}
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 7h18M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2m-9 0h10v12H6V7z" />
                  </svg>
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Soy Empleador</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Publicar trabajos, contratar talento y pagar con seguridad mediante escrow en USDC.
                  </p>
                </div>

                {selectedRole === "employer" && (
                  <svg className="w-6 h-6 text-[#9BB8D3]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>

            {/* Freelancer */}
            <button
              onClick={() => setSelectedRole("freelancer")}
              className={`w-full text-left p-6 rounded-xl border transition-all duration-200 cursor-pointer
              ${
                selectedRole === "freelancer"
                  ? "border-[#2F4E79] bg-[#1F2A44]/40 shadow-[0_0_0_1px_rgba(47,78,121,0.4)]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] active:bg-white/[0.08]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-colors
                  ${selectedRole === "freelancer"
                    ? "bg-[#2F4E79]"
                    : "bg-white/5"}`}>

                  {/* person_outline */}
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0H5z" />
                  </svg>
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Soy Freelancer</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Encontrar trabajos, postularme y cobrar de forma segura e inmediata en USDC.
                  </p>
                </div>

                {selectedRole === "freelancer" && (
                  <svg className="w-6 h-6 text-[#9BB8D3]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          </div>

          {/* Wallet status */}
          {isConnected && address && (
            <div className="flex items-center gap-2 justify-center mb-6 text-sm text-neutral-400">
              <div className="w-2 h-2 rounded-full bg-[#5F88B3]" />
              Wallet conectada:
              <span className="font-mono text-neutral-200">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleContinue}
            disabled={!selectedRole || isLoading || isConnecting}
            className="w-full py-3.5 rounded-xl font-semibold tracking-wide cursor-pointer
            bg-[#2F4E79] hover:bg-[#1F2A44] active:bg-[#0F1A34]
            transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading || isConnecting
              ? "Conectando wallet..."
              : !isConnected
              ? "Conectar wallet y continuar"
              : "Continuar"}
          </button>

          <p className="text-center text-xs text-neutral-500 mt-4">
            Necesitas la extensión{" "}
            <a
              href="https://www.freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#9BB8D3] hover:underline cursor-pointer"
            >
              Freighter
            </a>{" "}
            para conectar tu wallet Stellar
          </p>
        </div>
      </main>
    </div>
  );
}