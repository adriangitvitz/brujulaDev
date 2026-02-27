"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import NotificationBell from "@/components/notifications/bell";
import { truncateAddress } from "@/lib/utils";
import { getProfile, Profile } from "@/lib/profile";

export default function FreelancerHeader() {
  const router = useRouter();
  const [wallet, setWallet] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedWallet = sessionStorage.getItem("brujula_wallet");
    if (!storedWallet) {
      router.push("/comenzar");
      return;
    }

    setWallet(storedWallet);
    setProfile(getProfile());

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users?stellarAddress=${storedWallet}`);
        if (res.ok) {
          const data = await res.json();
          if (data.userId) setUserId(data.userId);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, [router]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const logout = () => {
    sessionStorage.clear();
    router.push("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* LOGO */}
          <Link href="/dashboard/freelancer" className="flex items-center gap-4">
            <Image
              src="/images/logo-enterprise.png"
              alt="Brújula"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
            <span className="text-white tracking-[0.25em] text-sm uppercase font-light">
              BRÚJULA
            </span>
          </Link>

          {/* RIGHT */}
          <div className="flex items-center gap-6">

            <NotificationBell userId={userId} />

            {wallet && (
              <span className="hidden md:block text-xs text-white/40 font-mono">
                {truncateAddress(wallet)}
              </span>
            )}

            {/* PROFILE */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    className="w-9 h-9 rounded-full object-cover border border-white/10 group-hover:border-[#5F88B3] transition"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#5F88B3]/10 flex items-center justify-center text-[#5F88B3] font-semibold">
                    {profile?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {/* DROPDOWN */}
              <div
                className={`absolute right-0 mt-4 w-72 rounded-xl border border-white/10 bg-[#121821] shadow-xl transition-all duration-200 ${
                  open
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2 pointer-events-none"
                }`}
              >
                {profile && (
                  <>
                    <div className="p-5 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        {profile.avatar ? (
                          <img
                            src={profile.avatar}
                            className="w-12 h-12 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[#5F88B3]/10 flex items-center justify-center text-[#5F88B3] font-semibold">
                            {profile.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <p className="text-white text-sm font-medium">
                            {profile.name}
                          </p>
                          <p className="text-white/40 text-xs">
                            @{profile.username}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="py-2 text-sm">
                      <Link
                        href="/dashboard/freelancer/profile"
                        className="block px-5 py-2 text-white/70 hover:text-white hover:bg-white/5 transition"
                      >
                        Ver perfil
                      </Link>

                      <Link
                        href="/dashboard/freelancer/profile/edit"
                        className="block px-5 py-2 text-white/70 hover:text-white hover:bg-white/5 transition"
                      >
                        Editar perfil
                      </Link>

                      <button
                        onClick={logout}
                        className="w-full text-left px-5 py-2 text-white/50 hover:text-white hover:bg-white/5 transition"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}