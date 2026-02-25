const steps = [
  {
    number: "01",
    title: "El cliente deposita",
    description:
      "El monto del acuerdo se deposita antes de comenzar. Sin anticipos informales ni riesgos.",
  },
  {
    number: "02",
    title: "Fondos protegidos",
    description:
      "El dinero queda resguardado en escrow mediante infraestructura blockchain sobre Stellar.",
  },
  {
    number: "03",
    title: "Entrega y cobro inmediato",
    description:
      "Cuando el trabajo es aprobado, los fondos se liberan automáticamente y sin demoras.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="relative py-36 bg-black text-white overflow-hidden"
    >
      {/* iluminación sutil */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_65%)]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">

        {/* HEADER */}
        <div className="text-center mb-28">
          <p className="text-xs tracking-[0.35em] uppercase text-white/40 mb-4">
            Cómo funciona
          </p>

          <h2 className="text-4xl sm:text-5xl font-light tracking-tight">
            Simple. Seguro. <span className="font-semibold">Inevitable.</span>
          </h2>
        </div>

        {/* STEPS */}
        <div className="space-y-28">

          {steps.map((step, index) => (
            <div
              key={step.number}
              className="grid md:grid-cols-[140px_1fr] gap-10 items-start"
            >
              {/* NUMBER */}
              <div className="text-7xl md:text-8xl font-bold text-[#5F88B3] select-none leading-none">
                {step.number}
              </div>

              {/* CONTENT */}
              <div className="max-w-xl">
                <h3 className="text-2xl font-semibold mb-4 tracking-wide">
                  {step.title}
                </h3>

                <p className="text-white/60 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* línea divisoria elegante */}
              {index !== steps.length - 1 && (
                <div className="md:col-span-2 h-px bg-white/10 mt-16"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}