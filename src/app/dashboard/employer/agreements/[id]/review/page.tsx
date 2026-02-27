"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import BrujulaLogo from "@/components/landing/brujula-logo";
import { useWallet } from "@/hooks/useWallet";
import { truncateAddress } from "@/lib/utils";

interface Agreement {
  id: string;
  jobTitle: string;
  jobAmount: number;
  jobDeliverables: string;
  freelancerAddress: string;
  deliveryUrl: string;
  deliveryNote: string;
  deliveredAt: string;
  escrowContractId: string;
  status: string;
}

type Step = "ready" | "feedback" | "approving" | "signing" | "sending" | "success" | "error";

export default function ReviewDeliveryPage() {
  const router = useRouter();
  const params = useParams();
  const agreementId = params.id as string;
  const { address, signTransaction } = useWallet();

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("ready");
  const [feedback, setFeedback] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const storedWallet = sessionStorage.getItem("brujula_wallet");
    const storedRole = sessionStorage.getItem("brujula_role");

    if (!storedWallet || storedRole !== "employer") {
      router.push("/comenzar");
      return;
    }

    fetchAgreement(storedWallet);
  }, [router, agreementId]);

  const fetchAgreement = async (walletAddress: string) => {
    try {
      const res = await fetch(`/api/agreements?employerAddress=${walletAddress}`);
      if (res.ok) {
        const data = await res.json();
        const found = data.agreements?.find((a: Agreement) => a.id === agreementId);
        if (found) setAgreement(found);
      }
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!feedback.trim()) return;

    try {
      const res = await fetch(`/api/agreements/${agreementId}/request-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: feedback.trim() }),
      });

      if (res.ok) {
        router.push("/dashboard/employer");
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Error al solicitar cambios");
        setStep("error");
      }
    } catch {
      setErrorMsg("Error de conexion");
      setStep("error");
    }
  };

  const handleApprove = async () => {
    if (!agreement?.escrowContractId || !address) return;

    setStep("approving");
    setErrorMsg("");

    try {
      // Step 1: Get unsigned XDR
      const approveRes = await fetch("/api/escrow/approve-milestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: agreement.escrowContractId,
          approver: address,
        }),
      });

      const approveData = await approveRes.json();
      if (!approveRes.ok || !approveData.success) {
        throw new Error(approveData.error || "Error al preparar aprobacion");
      }

      // If already approved on-chain, skip signing and just update DB
      if (approveData.alreadyApproved) {
        setStep("sending");
        const sendRes = await fetch("/api/escrow/send-approval", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signedXdr: null, agreementId, alreadyApproved: true }),
        });

        const sendData = await sendRes.json();
        if (!sendRes.ok || !sendData.success) {
          throw new Error(sendData.error || "Error al actualizar estado");
        }

        setStep("success");
        return;
      }

      // Step 2: Sign with wallet
      setStep("signing");
      const signedXdr = await signTransaction(approveData.unsignedXdr, {
        networkPassphrase: "Test SDF Network ; September 2015",
      });

      if (!signedXdr) throw new Error("La firma fue cancelada");

      // Step 3: Send signed transaction
      setStep("sending");
      const sendRes = await fetch("/api/escrow/send-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedXdr, agreementId }),
      });

      const sendData = await sendRes.json();
      if (!sendRes.ok || !sendData.success) {
        throw new Error(sendData.error || "Error al enviar aprobacion");
      }

      setStep("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
      setStep("error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Trabajo aprobado</h2>
          <p className="text-muted-foreground mb-6">
            El freelancer puede confirmar para recibir el pago de {"$"}{agreement?.jobAmount} USDC.
          </p>
          <button
            onClick={() => router.push("/dashboard/employer")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    );
  }

  // Signing/sending overlay
  if (step === "approving" || step === "signing" || step === "sending") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-sm mx-auto p-8 text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-r-transparent mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {step === "approving" && "Preparando aprobacion..."}
            {step === "signing" && "Firmando con tu wallet..."}
            {step === "sending" && "Enviando a Stellar..."}
          </h3>
          <p className="text-sm text-muted-foreground">
            {step === "signing" && "Revisa y aprueba en tu wallet"}
          </p>
        </div>
      </div>
    );
  }

  const deliverables = agreement?.jobDeliverables
    ? agreement.jobDeliverables.split(",").map((d: string) => d.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link href="/dashboard/employer" className="flex items-center gap-2">
            <BrujulaLogo size={28} />
            <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-foreground">
              BRUJULA
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard/employer"
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </Link>

        {!agreement ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Acuerdo no encontrado</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 mt-4">
            <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-foreground mb-1">
              Revisar entrega
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              {agreement.jobTitle} - {"$"}{agreement.jobAmount} USDC - Freelancer: {truncateAddress(agreement.freelancerAddress)}
            </p>

            {/* Delivery info */}
            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">Link al trabajo</p>
              <a
                href={agreement.deliveryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all"
              >
                {agreement.deliveryUrl}
              </a>
            </div>

            {agreement.deliveryNote && (
              <div className="mb-6">
                <p className="text-xs font-medium text-muted-foreground mb-1">Nota del freelancer</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{agreement.deliveryNote}</p>
              </div>
            )}

            {/* Deliverables */}
            {deliverables.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-medium text-muted-foreground mb-2">Entregables acordados</p>
                <ul className="space-y-1.5">
                  {deliverables.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <svg className="w-4 h-4 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error */}
            {step === "error" && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {errorMsg}
                <button
                  onClick={() => setStep("ready")}
                  className="ml-2 font-medium hover:underline"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Feedback form */}
            {step === "feedback" && (
              <div className="mb-6 p-4 border border-border rounded-lg">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Que necesita ser ajustado?
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
                  placeholder="Describe los cambios necesarios..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep("ready")}
                    className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRequestChanges}
                    disabled={!feedback.trim()}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    Enviar feedback
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {step === "ready" && (
              <div className="flex items-center gap-3 pt-6 border-t border-border">
                <button
                  onClick={() => setStep("feedback")}
                  className="px-6 py-3 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Solicitar cambios
                </button>
                <button
                  onClick={handleApprove}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Aprobar trabajo
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
