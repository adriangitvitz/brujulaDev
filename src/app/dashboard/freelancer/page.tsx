"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FreelancerHeader from "@/components/dashboard/FreelancerHeader";
import { getProfile, Profile } from "@/lib/profile";
import { truncateAddress } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  category: string;
  description: string;
  amount: number;
  estimatedDays: number;
  status: string;
  skills: string;
  createdAt: string;
}

interface JobDetail {
  id: string;
  title: string;
  description: string;
  deliverables: string | null;
  requirements: string | null;
  amount: number;
  estimatedDays: number;
  deadline: string | null;
  status: string;
  employerAddress: string;
  category: string;
  skills: string;
  createdAt: string;
}

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  jobAmount: number;
  status: string;
  appliedAt: string;
}

interface Agreement {
  id: string;
  jobId: string;
  jobTitle: string;
  jobAmount: number;
  status: string;
  createdAt: string;
}

type Tab = "jobs" | "applications" | "agreements";

export default function FreelancerDashboard() {
  const router = useRouter();
  const [wallet, setWallet] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Split-panel state
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedJobApplication, setSelectedJobApplication] = useState<Application | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const storedWallet = sessionStorage.getItem("brujula_wallet");
    const storedRole = sessionStorage.getItem("brujula_role");

    if (!storedWallet || storedRole !== "freelancer") {
      router.push("/comenzar");
      return;
    }

    setWallet(storedWallet);
    setProfile(getProfile());
    fetchAllData(storedWallet);
  }, [router]);

  const fetchAllData = async (address: string) => {
    try {
      const [jobsRes, appsRes, agreementsRes] = await Promise.all([
        fetch("/api/jobs?status=OPEN"),
        fetch(`/api/applications?freelancerAddress=${address}`),
        fetch(`/api/agreements?freelancerAddress=${address}`),
      ]);

      if (jobsRes.ok) {
        const data = await jobsRes.json();
        const jobList = data.jobs || [];
        setJobs(jobList);
      }

      if (appsRes.ok) {
        const data = await appsRes.json();
        setApplications(data.applications || []);
      }

      if (agreementsRes.ok) {
        const data = await agreementsRes.json();
        setAgreements(data.agreements || []);
      }

      const userRes = await fetch(`/api/users?stellarAddress=${address}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.userId) setUserId(userData.userId);
      }
    } catch (error) {
      console.error("Error fetching freelancer dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJob = useCallback(async (jobId: string) => {
    // Cancel any in-flight fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setSelectedJobId(jobId);
    setDetailLoading(true);
    setSelectedJob(null);
    setSelectedJobApplication(null);

    try {
      const fetchPromises: [Promise<Response>, Promise<Response> | null] = [
        fetch(`/api/jobs/${jobId}`, { signal: controller.signal }),
        wallet
          ? fetch(`/api/applications?jobId=${jobId}&freelancerAddress=${wallet}`, { signal: controller.signal })
          : null as unknown as Promise<Response>,
      ];

      const [jobRes, appRes] = await Promise.all(
        fetchPromises.filter((p): p is Promise<Response> => p !== null)
      );

      if (controller.signal.aborted) return;

      if (jobRes.ok) {
        const jobData = await jobRes.json();
        setSelectedJob(jobData);
      }

      if (appRes?.ok) {
        const appData = await appRes.json();
        const apps = appData.applications || [];
        setSelectedJobApplication(apps.length > 0 ? apps[0] : null);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    } finally {
      if (!controller.signal.aborted) {
        setDetailLoading(false);
      }
    }
  }, [wallet]);

  // Auto-select first job when jobs load
  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      handleSelectJob(jobs[0].id);
    }
  }, [jobs, selectedJobId, handleSelectJob]);

  const handleLogout = () => {
    sessionStorage.removeItem("brujula_wallet");
    sessionStorage.removeItem("brujula_role");
    router.push("/");
  };

  const getSkillsArray = (skills: string) => {
    if (!skills) return [];
    return skills.split(",").map((s: string) => s.trim()).filter(Boolean);
  };

  const getDeliverablesArray = (deliverables: string | null) => {
    if (!deliverables) return [];
    return deliverables.split(",").map((d: string) => d.trim()).filter(Boolean);
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} dias`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  };

  const getAppStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
      ACCEPTED: { label: "Aceptada", className: "bg-green-100 text-green-700" },
      REJECTED: { label: "Rechazada", className: "bg-red-100 text-red-700" },
    };
    return map[status] || { label: status, className: "bg-gray-100 text-gray-700" };
  };

  const getAgreementAction = (agreement: Agreement) => {
    switch (agreement.status) {
      case "ACTIVE":
        return { label: "Entregar trabajo", href: `/dashboard/freelancer/agreements/${agreement.id}/deliver` };
      case "WORK_DELIVERED":
        return { label: "Esperando revision...", href: null };
      case "EMPLOYER_APPROVED":
        return { label: "Confirmar y cobrar", href: `/dashboard/freelancer/agreements/${agreement.id}/confirm` };
      case "COMPLETED":
        return { label: "Completado", href: null };
      default:
        return { label: agreement.status, href: null };
    }
  };

  const getAgreementStatusColor = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: "bg-blue-100 text-blue-700",
      WORK_DELIVERED: "bg-yellow-100 text-yellow-700",
      EMPLOYER_APPROVED: "bg-green-100 text-green-700",
      COMPLETED: "bg-green-100 text-green-700",
      DISPUTED: "bg-red-100 text-red-700",
    };
    return map[status] || "bg-gray-100 text-gray-700";
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "jobs", label: "Trabajos disponibles", count: jobs.length },
    { id: "applications", label: "Mis postulaciones", count: applications.length },
    { id: "agreements", label: "Mis acuerdos", count: agreements.length },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FreelancerHeader />

      <main className={`${activeTab === "jobs" ? "max-w-7xl" : "max-w-6xl"} mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all flex-1`}>
        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-muted">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : (
          <>
            {/* Tab: Available Jobs */}
            {activeTab === "jobs" && (
              <>
                {/* Desktop: Split-panel layout */}
                <div className="hidden lg:flex gap-6">
                  {/* Left panel: Job list */}
                  <div className="w-[40%] shrink-0">
                    <div className="border border-border rounded-xl bg-card overflow-hidden">
                      <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
                        {jobs.map((job, index) => {
                          const skills = getSkillsArray(job.skills);
                          const isSelected = selectedJobId === job.id;
                          return (
                            <button
                              key={job.id}
                              onClick={() => handleSelectJob(job.id)}
                              className={`w-full text-left p-4 transition-colors ${
                                isSelected
                                  ? "bg-primary/5 border-l-2 border-l-primary"
                                  : "border-l-2 border-l-transparent hover:bg-muted/50"
                              } ${index > 0 ? "border-t border-border" : ""}`}
                            >
                              <h3
                                className={`font-[family-name:var(--font-heading)] font-semibold text-sm leading-snug mb-1 ${
                                  isSelected ? "text-primary" : "text-foreground"
                                }`}
                              >
                                {job.title}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                                {job.description}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <span className="font-semibold text-foreground">{"$"}{job.amount} USDC</span>
                                <span>·</span>
                                <span>{job.estimatedDays} dias</span>
                                {job.category && (
                                  <>
                                    <span>·</span>
                                    <span className="capitalize">{job.category}</span>
                                  </>
                                )}
                              </div>
                              {skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {skills.slice(0, 3).map((skill) => (
                                    <span
                                      key={skill}
                                      className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {skills.length > 3 && (
                                    <span className="text-[10px] text-muted-foreground">+{skills.length - 3}</span>
                                  )}
                                </div>
                              )}
                              <p className="text-[10px] text-muted-foreground">
                                {formatTimeAgo(job.createdAt)}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right panel: Job detail */}
                  <div className="w-[60%]">
                    <div className="sticky top-4 border border-border rounded-xl bg-card overflow-hidden max-h-[calc(100vh-220px)] overflow-y-auto">
                      {detailLoading ? (
                        <div className="flex items-center justify-center py-24">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-primary border-r-transparent" />
                        </div>
                      ) : selectedJob ? (
                        <div className="p-6">
                          {/* Header */}
                          <div className="mb-6">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold text-foreground leading-snug">
                                {selectedJob.title}
                              </h2>
                              <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 shrink-0">
                                Abierto
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {selectedJob.category && (
                                <span className="capitalize">{selectedJob.category}</span>
                              )}
                              {selectedJob.category && <span>·</span>}
                              <span className="font-mono">{truncateAddress(selectedJob.employerAddress)}</span>
                              <span>·</span>
                              <span>{formatTimeAgo(selectedJob.createdAt)}</span>
                            </div>
                          </div>

                          {/* Budget/timeline strip */}
                          <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg mb-6">
                            <div>
                              <p className="text-xs text-muted-foreground">Presupuesto</p>
                              <p className="text-lg font-bold text-foreground">{"$"}{selectedJob.amount} <span className="text-sm font-normal text-muted-foreground">USDC</span></p>
                            </div>
                            <div className="w-px h-8 bg-border" />
                            <div>
                              <p className="text-xs text-muted-foreground">Plazo estimado</p>
                              <p className="text-lg font-bold text-foreground">{selectedJob.estimatedDays} <span className="text-sm font-normal text-muted-foreground">dias</span></p>
                            </div>
                            {selectedJob.deadline && (
                              <>
                                <div className="w-px h-8 bg-border" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Fecha limite</p>
                                  <p className="text-sm font-semibold text-foreground">{new Date(selectedJob.deadline).toLocaleDateString("es")}</p>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-3 mb-6">
                            {selectedJobApplication ? (
                              <span className={`inline-flex px-4 py-2 rounded-lg text-sm font-medium ${getAppStatusBadge(selectedJobApplication.status).className}`}>
                                Ya postulado — {getAppStatusBadge(selectedJobApplication.status).label}
                              </span>
                            ) : (
                              <Link
                                href={`/dashboard/freelancer/jobs/${selectedJob.id}/apply`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                                Postularme
                              </Link>
                            )}
                          </div>

                          {/* Description */}
                          <div className="mb-6">
                            <h3 className="font-[family-name:var(--font-heading)] font-semibold text-foreground mb-2">Descripcion</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                              {selectedJob.description}
                            </p>
                          </div>

                          {/* Deliverables */}
                          {selectedJob.deliverables && (
                            <div className="mb-6">
                              <h3 className="font-[family-name:var(--font-heading)] font-semibold text-foreground mb-2">Entregables</h3>
                              <ul className="space-y-1.5">
                                {getDeliverablesArray(selectedJob.deliverables).map((d, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    {d}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Requirements */}
                          {selectedJob.requirements && (
                            <div className="mb-6">
                              <h3 className="font-[family-name:var(--font-heading)] font-semibold text-foreground mb-2">Requisitos</h3>
                              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                                {selectedJob.requirements}
                              </p>
                            </div>
                          )}

                          {/* Skills */}
                          {selectedJob.skills && getSkillsArray(selectedJob.skills).length > 0 && (
                            <div>
                              <h3 className="font-[family-name:var(--font-heading)] font-semibold text-foreground mb-2">Habilidades</h3>
                              <div className="flex flex-wrap gap-1.5">
                                {getSkillsArray(selectedJob.skills).map((skill) => (
                                  <span
                                    key={skill}
                                    className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                          <svg className="w-12 h-12 text-muted-foreground/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          <p className="text-sm text-muted-foreground">
                            Selecciona un trabajo para ver los detalles
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile: Card layout */}
                <div className="lg:hidden grid gap-4 md:grid-cols-2">
                  {jobs.map((job) => {
                    const skills = getSkillsArray(job.skills);
                    return (
                      <div
                        key={job.id}
                        className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="font-[family-name:var(--font-heading)] font-semibold text-foreground text-lg leading-snug">
                            {job.title}
                          </h3>
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 shrink-0">
                            Abierto
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {job.description}
                        </p>

                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {skills.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className="text-xs bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                            {skills.length > 4 && (
                              <span className="text-xs text-muted-foreground">+{skills.length - 4}</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{"$"}{job.amount} USDC</span>
                            <span>{job.estimatedDays} dias</span>
                            {job.category && <span className="capitalize">{job.category}</span>}
                          </div>
                          <Link
                            href={`/dashboard/freelancer/jobs/${job.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Ver detalles
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Tab: My Applications */}
            {activeTab === "applications" && (
              <>
                {applications.length === 0 ? (
                  <div className="text-center py-16 bg-card border border-border rounded-xl">
                    <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-foreground mb-2">
                      No tienes postulaciones
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Explora los trabajos disponibles y postulate.
                    </p>

                    {selectedJob?.skills && (
                      <div className="flex flex-wrap gap-2 mb-6 justify-center">
                        {getSkillsArray(selectedJob.skills).map((skill, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 text-xs rounded-full bg-muted"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {selectedJob?.id && (
                      <Link
                        href={`/dashboard/freelancer/jobs/${selectedJob.id}`}
                        className="inline-block px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
                      >
                        Ver detalles completos
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => {
                      const badge = getAppStatusBadge(app.status);
                      return (
                        <div key={app.id} className="bg-card border border-border rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-[family-name:var(--font-heading)] font-semibold text-foreground">
                                {app.jobTitle}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {"$"}{app.jobAmount} USDC · {formatTimeAgo(app.appliedAt)}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Tab: My Agreements */}
            {activeTab === "agreements" && (
              <>
                {agreements.length === 0 ? (
                  <div className="text-center py-16 bg-card border border-border rounded-xl">
                    <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-foreground mb-2">
                      No tienes acuerdos
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Los acuerdos aparecen cuando un empleador acepta tu postulacion.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agreements.map((agreement) => {
                      const action = getAgreementAction(agreement);
                      return (
                        <div key={agreement.id} className="bg-card border border-border rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-[family-name:var(--font-heading)] font-semibold text-foreground">
                                {agreement.jobTitle}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {"$"}{agreement.jobAmount} USDC · {formatTimeAgo(agreement.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAgreementStatusColor(agreement.status)}`}>
                                {action.label}
                              </span>
                              {action.href && (
                                <Link
                                  href={action.href}
                                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                >
                                  {action.label}
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
