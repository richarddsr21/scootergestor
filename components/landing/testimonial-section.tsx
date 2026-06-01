import { Star, Quote } from "lucide-react"

export function TestimonialSection() {
  return (
    <section className="py-20 bg-white dark:bg-zinc-950">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-12">
          <div className="inline-flex items-center rounded-full border bg-zinc-50 dark:bg-zinc-900 px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
            Quem usa, aprova
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            O que donos de loja falam
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              name: "Carlos Mendes",
              role: "Dono — Scooters Mendes",
              city: "Rio de Janeiro, RJ",
              text: "Antes eu tinha tudo no caderno e a OS sumia com frequência. Com o ScooterGestor, cada scooter tem um histórico completo e o cliente para de ligar perguntando status.",
            },
            {
              name: "Rafael Costa",
              role: "Dono — Moto Elétrica RJ",
              city: "Niterói, RJ",
              text: "O controle de estoque mudou tudo. Agora eu sei exatamente quantas peças tenho, quais estão no limite mínimo e o sistema baixa automaticamente quando uso em uma OS.",
            },
            {
              name: "Diego Faria",
              role: "Dono — Scooter Shop",
              city: "São Paulo, SP",
              text: "O módulo de garantia me salvou várias vezes. Agora eu sei exatamente quais scooters estão na garantia e evito brigas com clientes por falta de controle.",
            },
          ].map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border bg-zinc-50 dark:bg-zinc-900 p-6 flex flex-col gap-4"
            >
              <Quote className="size-8 text-primary/30" />
              <p className="text-sm text-foreground leading-relaxed flex-1">{t.text}</p>
              <div className="flex items-center gap-3 border-t pt-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                  <div className="text-xs text-muted-foreground">{t.city}</div>
                </div>
                <div className="ml-auto flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          * Depoimentos ilustrativos. Resultados reais podem variar.
        </p>
      </div>
    </section>
  )
}
