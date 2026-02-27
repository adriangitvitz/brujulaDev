"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FreelancerHeader from "@/components/dashboard/FreelancerHeader";
import { getProfile, Profile } from "@/lib/profile";
import { Footer } from "@creit-tech/stellar-wallets-kit";

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
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

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

        if (jobList.length > 0) {
          setSelectedJob(jobList[0]);
        }
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

  const getSkillsArray = (skills: string) => {
    if (!skills) return [];
    return skills.split(",").map((s) => s.trim()).filter(Boolean);
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "jobs", label: "Trabajos disponibles", count: jobs.length },
    { id: "applications", label: "Mis postulaciones", count: applications.length },
    { id: "agreements", label: "Mis acuerdos", count: agreements.length },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FreelancerHeader />

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">

        {/* PROFILE */}
        {profile && (
          <div className="mb-8 bg-card rounded-xl p-6">
            <div className="flex justify-between items-start">
              <div />
              <Link
                href="/profile"
                className="text-sm font-medium text-primary hover:underline"
              >
                Editar perfil
              </Link>
            </div>
          </div>
        )}

        {/* TABS */}
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
          activeTab === "jobs" && (
            <div className="grid md:grid-cols-3 gap-6">

              {/* LISTA (1/3) */}
              <div className="md:col-span-1 space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`cursor-pointer border rounded-xl p-4 transition ${
                      selectedJob?.id === job.id
                        ? "bg-card border-primary"
                        : "bg-card border-border hover:border-primary/40"
                    }`}
                  >
                    <h3 className="font-semibold text-sm text-foreground">
                      {job.title}
                    </h3>

                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {job.description}
                    </p>

                    <div className="mt-3 text-xs font-medium text-foreground">
                      ${job.amount} USDC
                    </div>
                  </div>
                ))}
              </div>

              {/* DETALLE (2/3) */}
              <div className="md:col-span-2">
                {selectedJob ? (
                  <div className="bg-card border border-border rounded-xl p-8 sticky top-24">
                    <h2 className="text-2xl font-semibold text-foreground mb-4">
                      {selectedJob.title}
                    </h2>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                      <span>${selectedJob.amount} USDC</span>
                      <span>•</span>
                      <span>{selectedJob.estimatedDays} días estimados</span>
                    </div>

                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {selectedJob.description}
                    </p>

                    {selectedJob.skills && (
                      <div className="flex flex-wrap gap-2 mb-6">
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

                    <Link
                      href={`/dashboard/freelancer/jobs/${selectedJob.id}`}
                      className="inline-block px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
                    >
                      Ver detalles completos
                    </Link>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-xl p-8 text-muted-foreground">
                    Selecciona un trabajo para ver los detalles.
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </main>

    </div>
  );
}