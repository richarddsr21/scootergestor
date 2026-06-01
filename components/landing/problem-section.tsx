import { FileX, TrendingDown, MessageCircle, DollarSign, Package, ShieldAlert, ArrowDown } from "lucide-react"

const pains = [
  {
    icon: FileX,
    title: "OS no papel ou caderno",
    desc: "Ordem de serviço manual, difícil de achar, fácil de perder. Cliente liga, você procura na pilha — e ainda assim não encontra. Profissionalismo zero.",
    stat: "73%",
    statLabel: "das lojas",
    statDesc: "ainda operam sem sistema de OS",
  },
  {
    icon: Package,
    title: "Estoque invisível",
    desc: "Peça some, venda não é registrada. Você jura que tinha o produto, o cliente esperou, você virou a loja e não encontrou. Peça perdida = cliente perdido.",
    stat: "R$800+",
    statLabel: "por mês",
    statDesc: "perdidos em estoque não registrado",
  },
  {
    icon: MessageCircle,
    title: "Cliente cobrando no WhatsApp",
    desc: "Sem atualização de status, o cliente manda mensagem de hora em hora. Você responde no improviso porque a OS está no caderno e não está na sua frente.",
    stat: "4+",
    statLabel: "mensagens",
    statDesc: "por OS aberta, em média",
  },
  {
    icon: DollarSign,
    title: "Financeiro no escuro",
    desc: "Quanto a loja faturou esse mês? Qual é o lucro bruto? Quais serviços são mais rentáveis? Sem sistema, essas perguntas vivem sem resposta.",
    stat: "9/10",
    statLabel: "donos",
    statDesc: "não sabem o lucro real do mês",
  },
  {
    icon: TrendingDown,
    title: "Histórico zero das peças",
    desc: "Qual peça foi usada em qual scooter? Quando foi a última troca de bateria desse cliente? Sem rastreabilidade, você trabalha no escuro — e erra no orçamento.",
    stat: "0",
    statLabel: "histórico",
    statDesc: "impossível rastrear peças por scooter",
  },
  {
    icon: ShieldAlert,
    title: "Garantias sem controle",
    desc: "A garantia venceu e você não sabia. Cliente voltou com problema, você não tem registro. Conflito, retrabalho e custo extra — tudo evitável com um alerta simples.",
    stat: "Sem",
    statLabel: "alerta",
    statDesc: "garantia vence sem nenhum aviso",
  },
]

export function ProblemSection() {
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "oklch(0.07 0.028 255)" }}>
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(circle, oklch(1 0 0) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-red-900/10 blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-red-900/40 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 mb-4">
            <span className="size-1.5 rounded-full bg-red-400" />
            O diagnóstico que você evita fazer
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Isso acontece na sua loja todo dia?
          </h2>
          <p className="mt-4 text-zinc-400 leading-relaxed text-lg">
            Não é azar, não é culpa da equipe. É falta de sistema. Lojas sem controle
            perdem dinheiro de formas que nunca aparecem no caixa — mas aparecem no final do mês.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {pains.map((pain, i) => {
            const Icon = pain.icon
            return (
              <div
                key={pain.title}
                className="group relative rounded-2xl border border-red-950/50 p-6 flex flex-col gap-4 hover:border-red-800/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-950/30"
                style={{ background: "oklch(0.10 0.032 260)" }}
              >
                {/* Index number */}
                <span
                  className="absolute top-4 right-5 font-display text-5xl font-extrabold leading-none pointer-events-none select-none"
                  style={{ color: "oklch(0.60 0.22 25 / 0.07)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="flex size-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
                  <Icon className="size-5 text-red-400" />
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-1.5">{pain.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{pain.desc}</p>
                </div>

                <div className="mt-auto pt-3 border-t border-white/[0.06] flex items-baseline gap-2 flex-wrap">
                  <span className="font-display text-xl font-bold text-red-400">{pain.stat}</span>
                  <span className="text-xs font-semibold text-red-400/70">{pain.statLabel}</span>
                  <span className="text-xs text-zinc-600">{pain.statDesc}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-14 text-center flex flex-col items-center gap-5">
          <div className="max-w-xl">
            <p className="text-lg font-semibold text-white">
              Cada problema acima representa dinheiro saindo da sua loja sem rastreamento.
            </p>
            <p className="mt-2 text-zinc-400 leading-relaxed">
              O ScooterGestor foi criado para eliminar cada um desses gargalos — sem
              planilha, sem papel e sem curva de aprendizado longa.
            </p>
          </div>
          <a
            href="#solucao"
            className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-brand-blue/10 hover:bg-brand-blue/20 border border-brand-blue/30 text-sm font-medium text-brand-blue transition-all duration-200 hover:-translate-y-px"
          >
            Ver como cada um é resolvido
            <ArrowDown className="size-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
