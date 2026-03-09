export default function SocialProofSection() {
  const stats = [
    { number: "S/ 1,000", label: "Ahorro promedio en el primer mes" },
    { number: "1 min", label: "Para configurar tu plan" },
    { number: "0", label: "Transacciones que categorizar manualmente" },
  ];

  return (
    <section className="bg-foreground text-background py-20 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        {stats.map((stat) => (
          <div key={stat.number}>
            <p className="text-4xl md:text-5xl font-semibold">{stat.number}</p>
            <p className="mt-2 text-background/70">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
