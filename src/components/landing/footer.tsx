import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-neutral-400">
      <div className="max-w-7xl mx-auto px-6 py-20">

        {/* GRID */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-14 mb-16">

          {/* BRAND */}
          <div className="space-y-6 max-w-sm">
            <Image
              src="/images/logo-enterprise.png"
              alt="Brújula"
              width={160}
              height={40}
              className="opacity-90"
            />

            <p className="text-sm leading-relaxed text-neutral-500">
              Infraestructura de confianza verificable para profesionales
              independientes que trabajan sin margen para el riesgo.
            </p>
          </div>

          {/* PRODUCTO */}
          <div>
            <h4 className="text-xs tracking-widest uppercase text-neutral-500 mb-6">
              Producto
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#como-funciona" className="hover:text-white transition-colors">
                  Cómo funciona
                </a>
              </li>
              <li>
                <a href="#por-que-brujula" className="hover:text-white transition-colors">
                  Por qué Brújula
                </a>
              </li>
              <li>
                <a href="#modelo" className="hover:text-white transition-colors">
                  Precios
                </a>
              </li>
            </ul>
          </div>

          {/* RECURSOS */}
          <div>
            <h4 className="text-xs tracking-widest uppercase text-neutral-500 mb-6">
              Recursos
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="cursor-default hover:text-neutral-300 transition-colors">
                Blog
              </li>
              <li className="cursor-default hover:text-neutral-300 transition-colors">
                Documentación
              </li>
              <li className="cursor-default hover:text-neutral-300 transition-colors">
                FAQ
              </li>
            </ul>
          </div>

          {/* LEGAL */}
          <div>
            <h4 className="text-xs tracking-widest uppercase text-neutral-500 mb-6">
              Legal
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="cursor-default hover:text-neutral-300 transition-colors">
                Términos
              </li>
              <li className="cursor-default hover:text-neutral-300 transition-colors">
                Privacidad
              </li>
              <li className="cursor-default hover:text-neutral-300 transition-colors">
                Compliance
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM */}
        <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-600">
          <p>© 2026 Brújula. Todos los derechos reservados.</p>

          <p className="mt-4 md:mt-0">
            Hecho para profesionales que trabajan sin margen para el error.
          </p>
        </div>
      </div>
    </footer>
  );
}