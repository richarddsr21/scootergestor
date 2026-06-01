"use client"

import * as React from "react"
import { ChevronDown, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const WA_LINK = `https://wa.me/5521999999999?text=${encodeURIComponent("Olá! Tenho uma dúvida sobre o ScooterGestor.")}`

const faqs = [
  {
    q: "Por que pagar por isso se a planilha do Google é gratuita?",
    a: "Planilha não avisa quando o estoque está baixo. Não gera OS com checklist. Não registra garantia. Não mostra o faturamento do dia no celular. E exige que alguém atualize manualmente — o que ninguém faz. O ScooterGestor automatiza o que a planilha exige de esforço manual, e entrega informação que a planilha nunca conseguirá dar.",
  },
  {
    q: "Meus funcionários vão conseguir usar?",
    a: "Sim. O sistema foi pensado para ser usado por técnico, vendedor e caixa — não só pelo dono. A interface é direta: abre OS, preenche checklist, atualiza status. Sem treinamento longo. Na implantação, fazemos um treinamento inicial completo com sua equipe.",
  },
  {
    q: "Funciona no celular?",
    a: "Sim. O ScooterGestor é 100% web-responsivo. Funciona no navegador do celular, tablet, notebook ou computador. Não precisa instalar nenhum aplicativo. O técnico pode atualizar o status da OS diretamente pelo celular enquanto está na bancada.",
  },
  {
    q: "Quanto tempo leva para colocar no ar?",
    a: "Da criação da conta à operação completa, menos de 1 semana. Os dados padrão (status de OS, checklist, categorias, serviços, formas de pagamento) já vêm configurados. Você cadastra seus produtos e clientes, e já começa a operar.",
  },
  {
    q: "Como funciona a demonstração?",
    a: "Você entra em contato pelo WhatsApp, agendamos um horário e mostramos o sistema funcionando ao vivo — com os módulos que fazem sentido para a sua loja. Gratuito, sem compromisso e sem necessidade de cartão.",
  },
  {
    q: "Consigo migrar meu estoque de uma planilha?",
    a: "Sim. Na implantação ajudamos você a importar produtos, clientes e estoque inicial. O suporte acompanha os primeiros passos para garantir que tudo comece certo.",
  },
  {
    q: "O sistema funciona com mais de um funcionário?",
    a: "Sim. Cada plano tem um limite de usuários. O Start suporta 2, o Pro até 5 e o Premium até 10. Cada usuário tem login próprio e permissões por cargo — o técnico acessa só o que precisa, o dono vê tudo.",
  },
  {
    q: "Os dados da minha loja ficam separados de outras lojas?",
    a: "Sim, com isolamento total. Nenhum dado da sua loja é visível para outras lojas. Usamos Row Level Security no banco de dados para garantir isso em nível de infraestrutura.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Não há fidelidade obrigatória. Cancele a qualquer momento. Seus dados ficam disponíveis para exportação por 30 dias após o cancelamento.",
  },
  {
    q: "Vocês integram com WhatsApp automaticamente?",
    a: "Não no momento. O sistema gera mensagens prontas para você copiar e enviar com um clique. Integração automática via API oficial do WhatsApp Business está no roadmap.",
  },
  {
    q: "A taxa de implantação é obrigatória?",
    a: "Sim. A taxa cobre a configuração inicial do sistema, treinamento básico e migração de dados. É cobrada uma única vez na contratação.",
  },
]

export function FAQSection() {
  const [open, setOpen] = React.useState<number | null>(0)

  return (
    <section id="faq" className="py-24 bg-brand-navy scroll-mt-16 relative overflow-hidden">
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <div className="inline-flex items-center rounded-full border border-zinc-700 bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-400 mb-4">
            Perguntas frequentes
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ficou com dúvida?
          </h2>
          <p className="mt-4 text-zinc-400 text-lg">
            Respondemos as objeções mais comuns de quem ainda está avaliando. Se não encontrar a sua, fale pelo WhatsApp.
          </p>
        </div>

        <div className="max-w-2xl mx-auto flex flex-col gap-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl border overflow-hidden transition-all duration-200",
                open === i
                  ? "border-brand-blue/30"
                  : "border-white/[0.06] hover:border-white/[0.12]"
              )}
              style={
                open === i
                  ? { background: "oklch(0.11 0.038 262)" }
                  : { background: "oklch(0.09 0.025 262)" }
              }
            >
              {/* Accent top line when open */}
              {open === i && (
                <div
                  className="h-px w-full"
                  style={{
                    background: "linear-gradient(90deg, transparent, oklch(0.645 0.176 216 / 0.6) 30%, oklch(0.720 0.185 143 / 0.4) 70%, transparent)",
                  }}
                />
              )}

              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-white hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="font-mono text-[10px] font-bold shrink-0 mt-0.5 tabular-nums"
                    style={{ color: open === i ? "oklch(0.645 0.176 216)" : "oklch(0.35 0.02 255)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-snug">{faq.q}</span>
                </div>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-zinc-600 transition-all duration-200",
                    open === i ? "rotate-180 text-brand-blue" : ""
                  )}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-zinc-400 border-t border-white/[0.06] pt-4 leading-relaxed pl-14">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium text-zinc-300 transition-all duration-200 hover:-translate-y-px"
          >
            <MessageCircle className="size-4 text-brand-green" />
            Tenho outra dúvida — falar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
