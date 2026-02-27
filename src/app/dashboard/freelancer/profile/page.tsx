"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Profile } from "@/lib/profile";
import FreelancerHeader from "@/components/dashboard/FreelancerHeader"

export default function ProfileViewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const wallet = sessionStorage.getItem("brujula_wallet");
    const role = sessionStorage.getItem("brujula_role");

    if (!wallet || !role) {
      router.push("/comenzar");
      return;
    }

    const stored = localStorage.getItem("brujula_profile");

    if (!stored) {
      router.push("/dashboard/freelancer/profile/new");
      return;
    }

    setProfile(JSON.parse(stored));
  }, [router]);

  if (!profile) return null;

  return (
    <>
      <FreelancerHeader/>
      <div className="min-h-screen bg-[#0B0F14] flex justify-center px-6 py-20">
        <div className="w-full max-w-2xl bg-[#121821] border border-white/6 rounded-2xl p-12">

          {/* HEADER */}
          <div className="flex justify-between items-start mb-12">
            <div className="flex items-center gap-6">

              {/* AVATAR */}
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  className="w-20 h-20 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#5F88B3]/10 flex items-center justify-center text-2xl font-semibold text-[#5F88B3]">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  {profile.name}
                </h1>

                <p className="text-white/50 text-sm mt-1">
                  @{profile.username}
                </p>

                <p className="text-white/40 text-sm">
                  {profile.country}
                </p>

                <p className="text-sm font-medium text-[#5F88B3] mt-2">
                  {profile.occupation}
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/freelancer/profile/edit"
              className="text-sm text-[#5F88B3] font-medium tracking-wide hover:opacity-70 transition"
            >
              Editar
            </Link>
          </div>

          {/* DIVIDER */}
          <div className="h-px bg-white/5 mb-10" />

          {/* BIO */}
          <section className="mb-10">
            <h2 className="text-xs tracking-widest text-white/40 uppercase mb-3">
              Sobre mí
            </h2>
            <p className="text-white/70 leading-relaxed">
              {profile.bio}
            </p>
          </section>

          {/* SKILLS */}
          {profile.skills?.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xs tracking-widest text-white/40 uppercase mb-4">
                Especialidades
              </h2>

              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 text-sm rounded-md bg-[#5F88B3]/10 text-[#5F88B3]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* EXPERIENCIA */}
          <section className="mb-10">
            <h2 className="text-xs tracking-widest text-white/40 uppercase mb-3">
              Experiencia
            </h2>
            <p className="text-white/70">
              {profile.experienceYears} años de experiencia profesional
            </p>
          </section>

          {/* EDUCACION */}
          {profile.education && (
            <section className="mb-10">
              <h2 className="text-xs tracking-widest text-white/40 uppercase mb-3">
                Educación
              </h2>
              <p className="text-white/70">
                {profile.education}
              </p>
            </section>
          )}

          {/* DISPONIBILIDAD */}
          {profile.availability?.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xs tracking-widest text-white/40 uppercase mb-3">
                Disponibilidad
              </h2>
              <p className="text-white/70">
                {profile.availability.join(" • ")}
              </p>
            </section>
          )}

          {/* IDIOMAS */}
          {profile.languages?.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xs tracking-widest text-white/40 uppercase mb-3">
                Idiomas
              </h2>

              <div className="space-y-1">
                {profile.languages.map((lang, i) => (
                  <p key={i} className="text-white/70">
                    {lang.name} — {lang.level}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* CONTACTO */}
          <section className="mb-10">
            <h2 className="text-xs tracking-widest text-white/40 uppercase mb-3">
              Contacto
            </h2>
            <p className="text-white/70">{profile.email}</p>
          </section>

          {/* CV */}
          {profile.cvFile && (
            <>
              <div className="h-px bg-white/5 mb-8" />

              <section className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50">Documento</p>
                  <p className="text-white/80 font-medium">
                    Curriculum Vitae
                  </p>
                </div>

                <span className="text-sm text-[#5F88B3] font-medium">
                  Cargado
                </span>
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}