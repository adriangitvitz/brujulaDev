import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen pt-32 pb-32 overflow-hidden bg-black text-white">

      {/* Fondos decorativos (no bloquean clicks) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_60%)]" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-black/40 to-black" />

      {/* CONTENIDO */}
      <div className="relative z-10 max-w-[90rem] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-24 items-center">

          {/* LEFT */}
          <div className="space-y-10">

            <div className="inline-flex items-center gap-2 border border-white/15 text-white/70 px-4 py-1.5 text-xs tracking-widest uppercase">
              Infraestructura financiera para talento global
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-6xl font-light leading-tight tracking-tight">
              Trabaja independiente. <br />
              <span className="font-semibold text-[#5F88B3]">
                Cobra con garantía.
              </span>
            </h1>

            <p className="text-white/60 text-lg max-w-xl leading-relaxed">
              Brújula protege acuerdos, asegura pagos y permite operar en el
              mercado global con infraestructura profesional.
            </p>

            <div className="flex flex-wrap gap-6 pt-6">

              <Link
                href="/comenzar"
                className="cursor-pointer border border-white/20 px-8 py-3 uppercase tracking-wider text-sm hover:bg-white hover:text-black transition-all duration-300"
              >
                Solicitar acceso
              </Link>


            </div>
          </div>

          {/* RIGHT */}
          <div className="relative">

            <div className="grid grid-cols-3 gap-5">

              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src="/images/portrait-1.jpg"
                  alt=""
                  fill
                  className="object-cover grayscale hover:grayscale-0 transition duration-700"
                />
              </div>

              <div className="border border-white/10 p-6 flex flex-col justify-center bg-white/5 backdrop-blur-sm">
                <h3 className="text-xs tracking-widest text-white/60 mb-2">
                  MERCADO GLOBAL
                </h3>
                <p className="text-sm text-white/70">
                  Talento LATAM operando sin fricción en economías internacionales.
                </p>
              </div>

              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src="/images/portrait-4.jpg"
                  alt=""
                  fill
                  className="object-cover grayscale hover:grayscale-0 transition duration-700"
                />
              </div>

              <div className="border border-white/10 p-6 flex flex-col justify-center bg-white/5 backdrop-blur-sm">
                <h3 className="text-xs tracking-widest text-white/60 mb-2">
                  PAGOS GARANTIZADOS
                </h3>
                <p className="text-sm text-white/70">
                  Infraestructura que protege tu trabajo y asegura tu ingreso.
                </p>
              </div>

              <div className="relative aspect-[3/4] overflow-hidden scale-105 border border-white/20">
                <Image
                  src="/images/portrait-10.jpg"
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>

              <div className="border border-white/10 p-6 flex flex-col justify-center bg-white/5 backdrop-blur-sm">
                <h3 className="text-xs tracking-widest text-white/60 mb-2">
                  REPUTACIÓN VERIFICABLE
                </h3>
                <p className="text-sm text-white/70">
                  Historial profesional que abre puertas globales.
                </p>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
}