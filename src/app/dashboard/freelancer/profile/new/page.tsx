"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    const wallet = sessionStorage.getItem("brujula_wallet");
    const role = sessionStorage.getItem("brujula_role");

    if (!wallet || !role) {
      router.push("/comenzar");
      return;
    }

    router.push("/dashboard/freelancer/profile/edit");
  }, [router]);

  return null;
}