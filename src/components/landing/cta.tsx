import Link from "next/link";
import Image from "next/image";

export default function CTASection() {
  return (
    <section className="py-32 bg-white border-t border-neutral-200">
      <div className="max-w-4xl mx-auto px-6 text-center">

        {/* logo */}
        <div className="flex justify-center mb-12">
          <Image
            src="/images/logo-enterprise.png"
            alt="Brújula Enterprise"
            width={180}
            height={60}
            priority
            className="opacity-90"
          />
        </div>

        {/* headline */}
        <h2 className="font-[family-name:var(--font-heading)] text-4xl sm:text-5xl font-bold text-neutral-900 leading-tight mb-6">
          ¿Todavía aceptas trabajos sin garantía?
        </h2>

        {/* texto */}
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed mb-12">
          Empieza a cobrar con seguridad real.
          Sin esperar semanas.
          Sin comisiones abusivas.
          Sin depender de la buena voluntad del cliente.
        </p>

        {/* botón */}
        <Link
          href="/comenzar"
          className="
            inline-flex
            items-center
            justify-center
            px-12
            py-4
            rounded-md
            text-lg
            font-semibold
            bg-neutral-900
            text-white
            hover:bg-neutral-800
            active:scale-[0.98]
            transition
            duration-200
            shadow-sm
            cursor-pointer
          "
        >
          Crear cuenta gratis
        </Link>

        {/* confianza */}
        <p className="text-sm text-neutral-500 mt-6">
          Sin tarjeta requerida · Sin compromisos · Configuración en menos de 2 minutos
        </p>

      </div>
    </section>
  );
}