import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Zap, CheckCircle2, Circle, Clock } from "lucide-react"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Acompanhar OS | ScooterGestor",
    description: "Acompanhe o status da sua ordem de serviço em tempo real.",
  }
}

const PROGRESS_SLUGS = [
  { slug: "aberta", label: "OS aberta" },
  { slug: "aguardando-diagnostico", label: "Aguardando diagnóstico" },
  { slug: "aguardando-aprovacao", label: "Aguardando aprovação" },
  { slug: "aprovada", label: "Aprovada" },
  { slug: "em-manutencao", label: "Em manutenção" },
  { slug: "aguardando-peca", label: "Aguardando peça" },
  { slug: "concluida", label: "Concluída" },
  { slug: "entregue", label: "Entregue" },
]

function fmtDate(d: string | null | undefined) {
  if (!d) return null
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

interface OsTrackingData {
  order_number: string
  reported_problem: string | null
  expected_delivery_at: string | null
  created_at: string
  updated_at: string
  status_name: string | null
  status_slug: string | null
  status_color: string | null
  customer_first_name: string | null
  vehicle_label: string | null
  store_name: string | null
  store_whatsapp: string | null
}

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc("get_os_tracking", { p_token: token })

  if (error || !data) notFound()

  const os = data as unknown as OsTrackingData
  if (!os.order_number) notFound()

  const currentSlugIndex = PROGRESS_SLUGS.findIndex(s => s.slug === os.status_slug)
  const isCanceled = os.status_slug === "cancelada"
  const storeName = os.store_name ?? "ScooterGestor"

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Zap className="size-4" />
          </div>
          <span className="font-bold text-base">{storeName}</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* OS card */}
        <div className="rounded-2xl border bg-white shadow-sm p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Ordem de Serviço</p>
              <h1 className="text-2xl font-bold mt-0.5">{os.order_number}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {os.customer_first_name ?? ""}
                {os.vehicle_label ? ` · ${os.vehicle_label}` : ""}
              </p>
            </div>
            {os.status_name && !isCanceled && (
              <span
                className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: os.status_color ?? "#6366f1" }}
              >
                {os.status_name}
              </span>
            )}
            {isCanceled && (
              <span className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">
                Cancelada
              </span>
            )}
          </div>

          {os.reported_problem && (
            <p className="text-sm text-muted-foreground border-t pt-3">
              {os.reported_problem}
            </p>
          )}

          {os.expected_delivery_at && (
            <div className="flex items-center gap-2 text-sm border-t pt-3">
              <Clock className="size-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Previsão de entrega:</span>
              <span className="font-medium">{fmtDate(os.expected_delivery_at)}</span>
            </div>
          )}
        </div>

        {/* Progress timeline */}
        {!isCanceled && (
          <div className="rounded-2xl border bg-white shadow-sm p-6">
            <h2 className="text-sm font-semibold mb-5">Progresso da sua OS</h2>
            <ol className="space-y-0">
              {PROGRESS_SLUGS.map((step, idx) => {
                const isDone = currentSlugIndex >= 0 && idx <= currentSlugIndex
                const isCurrent = idx === currentSlugIndex

                return (
                  <li key={step.slug} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex size-7 items-center justify-center rounded-full border-2 transition-colors shrink-0 ${
                          isDone
                            ? isCurrent
                              ? "border-primary bg-primary text-white"
                              : "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-200 bg-white text-slate-300"
                        }`}
                      >
                        {isDone && !isCurrent ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <Circle className={`size-3 ${isCurrent ? "fill-white" : ""}`} />
                        )}
                      </div>
                      {idx < PROGRESS_SLUGS.length - 1 && (
                        <div
                          className={`w-0.5 flex-1 my-1 min-h-[20px] ${
                            idx < currentSlugIndex ? "bg-emerald-400" : "bg-slate-200"
                          }`}
                        />
                      )}
                    </div>

                    <div className={`pb-5 ${idx === PROGRESS_SLUGS.length - 1 ? "pb-0" : ""}`}>
                      <p
                        className={`text-sm leading-7 ${
                          isCurrent
                            ? "font-semibold text-foreground"
                            : isDone
                            ? "text-muted-foreground"
                            : "text-slate-400"
                        }`}
                      >
                        {step.label}
                        {isCurrent && (
                          <span className="ml-2 text-xs font-medium text-primary">
                            ← aqui
                          </span>
                        )}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        {isCanceled && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-center">
            <p className="text-sm font-medium text-red-700">
              Esta ordem de serviço foi cancelada.
            </p>
            <p className="text-xs text-red-500 mt-1">Entre em contato com a loja para mais informações.</p>
          </div>
        )}

        {/* Contact card */}
        {os.store_whatsapp && (
          <div className="rounded-2xl border bg-white shadow-sm p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Dúvidas?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Fale com {storeName}</p>
            </div>
            <a
              href={`https://wa.me/${os.store_whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
            >
              Falar no WhatsApp
            </a>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground pb-6">
          Atualizado em {fmtDate(os.updated_at ?? os.created_at)}
        </p>
      </main>
    </div>
  )
}
