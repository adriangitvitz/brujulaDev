const features = [
  {
    number: "01",
    title: "Escrow programable",
    description:
      "Smart contracts sobre Stellar. Sin intermediacion humana. Sin wallets complejas.",
  },
  {
    number: "02",
    title: "Red de confianza",
    description:
      "Cada freelancer que usa Brujula incorpora a sus clientes. El estandar se expande solo.",
  },
  {
    number: "03",
    title: "Historial portable",
    description:
      "Tu reputacion verificable te pertenece. Pagos cumplidos, tiempos de entrega, relaciones.",
  },
  {
    number: "04",
    title: "Infraestructura invisible",
    description:
      "Sin seeds, sin wallets, sin fricción técnica. Solo depositas y cobras.",
  },
  {
    number: "05",
    title: "Escala sin fricción",
    description:
      "Costo directo <0.1%. Escalamos sin multiplicar estructura operativa.",
  },
  {
    number: "06",
    title: "Compliance first",
    description:
      "Diseñado para regulación desde el inicio. Infraestructura lista para el futuro.",
  },
];

export default function WhyBrujula() {
  return (
    <section id="por-que-brujula" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        {/* HEADER */}
        <div className="border-b border-neutral-200 pb-14 mb-20">
          <p className="text-xs tracking-[0.25em] text-neutral-500 font-semibold mb-6 uppercase">
            Por qué Brújula
          </p>

          <h2 className="font-[family-name:var(--font-heading)] text-4xl sm:text-5xl font-bold text-neutral-900 max-w-3xl leading-tight mb-6">
            Infraestructura de confianza antes del trabajo.
          </h2>

          <p className="text-lg text-neutral-600 max-w-2xl leading-relaxed">
            No facilitamos pagos. Eliminamos el riesgo.
            Garantizamos el cobro antes de empezar.
          </p>
        </div>

        {/* GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
          {features.map((f, index) => (
            <div
              key={f.number}
              className="
                group
                relative
                p-10
                hover:bg-neutral-50
                transition-colors
                duration-200
                cursor-pointer
              "
            >
              {/* NUMBER */}
              <div className="text-5xl font-bold text-[#5F88B3] mb-8 tracking-tight">
                {f.number}
              </div>

              {/* TITLE */}
              <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-neutral-900 mb-3">
                {f.title}
              </h3>

              {/* DESCRIPTION */}
              <p className="text-neutral-600 leading-relaxed text-sm max-w-sm">
                {f.description}
              </p>

              {/* subtle hover accent */}
              <div className="absolute left-10 bottom-8 w-10 h-[2px] bg-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}