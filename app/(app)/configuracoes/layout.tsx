import { SettingsNav } from "@/components/settings/settings-nav"

export default function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <aside className="w-full lg:w-56 shrink-0">
        <SettingsNav />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
