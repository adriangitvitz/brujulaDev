"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 border-b border-white/10 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo + Marca */}
          <Link href="/" className="flex items-center gap-4">
            <Image
              src="/images/logo-enterprise.png"
              alt="Brújula Enterprise"
              width={38}
              height={38}
              className="object-contain"
              priority
            />
            <span className="text-white text-lg tracking-[0.25em] font-light uppercase">
              BRÚJULA
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-12">
            <a href="#como-funciona" className="text-sm text-white/70 hover:text-white tracking-wide transition-colors">
              Cómo funciona
            </a>
            <a href="#por-que-brujula" className="text-sm text-white/70 hover:text-white tracking-wide transition-colors">
              Por qué Brújula
            </a>
            <a href="#mercado" className="text-sm text-white/70 hover:text-white tracking-wide transition-colors">
              Mercado
            </a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/comenzar"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/comenzar"
              className="border border-white/20 px-6 py-2 text-sm uppercase tracking-wider text-white hover:bg-[#5F88B3] hover:text-black transition-all duration-300"
            >
              Solicitar acceso
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden text-white"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            open ? "max-h-96 opacity-100 py-6" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-6 text-white">
            <a href="#como-funciona" onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              Cómo funciona
            </a>
            <a href="#por-que-brujula" onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              Por qué Brújula
            </a>
            <a href="#mercado" onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              Mercado
            </a>
            <a href="#modelo" onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              Modelo
            </a>

            <div className="pt-4 border-t border-white/10">
              <Link
                href="/comenzar"
                className="block text-center border border-white/20 py-3 uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-300"
              >
                Solicitar acceso
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}