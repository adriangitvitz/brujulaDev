"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import BrujulaLogo from "@/components/landing/brujula-logo";
import { useWallet } from "@/hooks/useWallet";
import { truncateAddress } from "@/lib/utils";

interface Application {
  id: string;
  freelancerAddress: string;
  coverLetter: string;
  portfolioUrl: string | null;
  proposedDeliveryDate: string;
  status: string;
  appliedAt: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: string;
}

type AcceptStep =
  | "idle"
  | "deploying"
  | "signing-deploy"
  | "sending-deploy"
  | "funding"
  | "signing-fund"
  | "sending-fund"
  | "finalizing"
  | "success"
  | "error";

export default function EmployerApplicationsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const { address, isConnected, connect, signTransaction } = useWallet();

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Accept flow state
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptStep, setAcceptStep] = useState<AcceptStep>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const storedWallet = sessionStorage.getItem("brujula_wallet");
    const storedRole = sessionStorage.getItem("brujula_role");

    if (!storedWallet || storedRole !== "employer") {
      router.push("/comenzar");
      return;
    }

    fetchData();
  }, [router, jobId]);

  const fetchData = async () => {
    try {
      const [jobRes, appsRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}`),
        fetch(`/api/applications?jobId=${jobId}`),
      ]);

      if (jobRes.ok) setJob(await jobRes.json());
      if (appsRes.ok) {
        const data = await appsRes.json();
        setApplications(data.applications || []);
      }
    } catch {
      // Error loading
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (appId: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });

      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: "REJECTED" } : a))
        );
      }
    } catch {
      // Error rejecting
    }
  };

  const handleAccept = async (app: Application) => {
    if (!job || !address) return;

    // Ensure wallet is connected
    let walletAddress: string | null | undefined = address;
    if (!isConnected || !walletAddress) {
      walletAddress = await connect();
      if (!walletAddress) {
        setErrorMsg("No se pudo conectar la wallet. Intenta de nuevo.");
        setAcceptStep("error");
        return;
      }
    }

    setAcceptingId(app.id);
    setAcceptStep("deploying");
    setErrorMsg("");

    try {
      // === STEP 1: Deploy escrow with correct roles ===
      // Platform roles (platformAddress, releaseSigner, disputeResolver) are set server-side
      const deployRes = await fetch("/api/escrow/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signer: walletAddress,
          title: job.title || "Trabajo Brujula",
          description: job.description || "",
          amount: job.amount || 0,
          platformFee: Math.round((job.amount || 0) * 0.02 * 100) / 100,
          milestones: [{ description: "Entrega completa del trabajo" }],
          roles: {
            approver: walletAddress,
            serviceProvider: app.freelancerAddress,
            receiver: app.freelancerAddress,
          },
        }),
      });

      const deployData = await deployRes.json();
      if (!deployRes.ok || !deployData.success) {
        throw new Error(deployData.error || "Error al desplegar el escrow");
      }

      // === STEP 2: Sign deploy with Freighter ===
      setAcceptStep("signing-deploy");
      const signedDeployXdr = await signTransaction(deployData.unsignedXdr, {
        networkPassphrase: "Test SDF Network ; September 2015",
      });

      if (!signedDeployXdr) {
        throw new Error("La firma del deploy fue cancelada");
      }

      // === STEP 3: Send deploy transaction ===
      setAcceptStep("sending-deploy");
      const sendDeployRes = await fetch("/api/escrow/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signedXdr: signedDeployXdr,
          jobId,
        }),
      });

      const sendDeployData = await sendDeployRes.json();
      if (!sendDeployRes.ok || !sendDeployData.success) {
        throw new Error(sendDeployData.error || "Error al enviar el deploy");
      }

      const contractId = sendDeployData.contractId;

      // === STEP 4: Fund escrow ===
      setAcceptStep("funding");
      const fundRes = await fetch("/api/escrow/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          amount: job.amount || 0,
          signer: walletAddress,
        }),
      });

      const fundData = await fundRes.json();
      if (!fundRes.ok || !fundData.success) {
        throw new Error(fundData.error || "Error al preparar el fondeo");
      }

      // === STEP 5: Sign fund with Freighter ===
      setAcceptStep("signing-fund");
      const signedFundXdr = await signTransaction(fundData.unsignedXdr, {
        networkPassphrase: "Test SDF Network ; September 2015",
      });

      if (!signedFundXdr) {
        throw new Error("La firma del fondeo fue cancelada");
      }

      // === STEP 6: Send fund transaction ===
      setAcceptStep("sending-fund");
      const sendFundRes = await fetch("/api/escrow/send-fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signedXdr: signedFundXdr,
          jobId,
        }),
      });

      const sendFundData = await sendFundRes.json();
      if (!sendFundRes.ok || !sendFundData.success) {
        throw new Error(sendFundData.error || "Error al enviar el fondeo");
      }

      // === STEP 7: Finalize accept (server-side: create agreement + update DB) ===
      setAcceptStep("finalizing");
      const finalizeRes = await fetch("/api/escrow/finalize-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          applicationId: app.id,
          freelancerAddress: app.freelancerAddress,
          contractId,
        }),
      });

      const finalizeData = await finalizeRes.json();
      if (!finalizeRes.ok || !finalizeData.success) {
        throw new Error(finalizeData.error || "Error al finalizar la aceptacion");
      }

      setAcceptStep("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
      setAcceptStep("error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  // Success state
  if (acceptStep === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Freelancer asignado</h2>
          <p className="text-muted-foreground mb-6">
            El escrow fue creado y fondeado en la blockchain. El freelancer ya puede empezar a trabajar.
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

  const pendingApps = applications.filter((a) => a.status === "PENDING");

  // Step messages for the processing overlay
  const stepMessages: Record<string, { title: string; desc: string }> = {
    "deploying": { title: "Creando contrato escrow...", desc: "Conectando con Trustless Work" },
    "signing-deploy": { title: "Firma 1/2: Crear escrow", desc: "Revisa y aprueba en tu wallet" },
    "sending-deploy": { title: "Enviando deploy a Stellar...", desc: "Creando el contrato en la blockchain" },
    "funding": { title: "Preparando deposito...", desc: "Generando transaccion de fondeo" },
    "signing-fund": { title: "Firma 2/2: Depositar USDC", desc: "Revisa y aprueba en tu wallet" },
    "sending-fund": { title: "Depositando USDC...", desc: "Enviando fondos al escrow" },
    "finalizing": { title: "Finalizando...", desc: "Creando acuerdo y notificando al freelancer" },
  };

  const isProcessing = acceptStep !== "idle" && acceptStep !== "error";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
          Volver al dashboard
        </Link>

        <div className="mt-4 mb-8">
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground">
            Postulaciones
          </h1>
          {job && (
            <p className="text-muted-foreground text-sm mt-1">
              Para: {job.title} - {"$"}{job.amount} USDC
            </p>
          )}
        </div>

        {/* Processing overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-xl p-8 max-w-sm text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-r-transparent mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {stepMessages[acceptStep]?.title || "Procesando..."}
              </h3>
              <p className="text-sm text-muted-foreground">
                {stepMessages[acceptStep]?.desc || ""}
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {acceptStep === "error" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700 mb-2">{errorMsg}</p>
            <button
              onClick={() => {
                setAcceptStep("idle");
                setAcceptingId(null);
                setErrorMsg("");
              }}
              className="text-sm font-medium text-red-700 hover:underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {pendingApps.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-foreground mb-2">
              No hay postulaciones pendientes
            </h3>
            <p className="text-muted-foreground text-sm">
              Los freelancers aun no se han postulado a este trabajo.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingApps.map((app) => (
              <div
                key={app.id}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-medium text-foreground font-mono text-sm">
                      {truncateAddress(app.freelancerAddress)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Postulado el {new Date(app.appliedAt).toLocaleDateString("es")}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Entrega: {new Date(app.proposedDeliveryDate).toLocaleDateString("es")}
                  </p>
                </div>

                {/* Cover letter */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Cover letter</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{app.coverLetter}</p>
                </div>

                {/* Portfolio */}
                {app.portfolioUrl && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Portfolio</p>
                    <a
                      href={app.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {app.portfolioUrl}
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <button
                    onClick={() => handleReject(app.id)}
                    disabled={acceptingId !== null}
                    className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleAccept(app)}
                    disabled={acceptingId !== null}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    Aceptar y asignar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
