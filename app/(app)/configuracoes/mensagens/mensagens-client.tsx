"use client"

import * as React from "react"
import { toast } from "sonner"
import { ChevronDown, ChevronUp, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { updateMessageTemplateAction } from "@/lib/actions/settings"
import { WHATSAPP_VARIABLES } from "@/lib/constants"
import type { Tables } from "@/types/database"

type Template = Tables<"message_templates">

export function MensagensClient({ templates }: { templates: Template[] }) {
  const [openId, setOpenId] = React.useState<string | null>(templates[0]?.id ?? null)
  const [contents, setContents] = React.useState<Record<string, string>>(
    Object.fromEntries(templates.map((t) => [t.id, t.content]))
  )
  const [saving, setSaving] = React.useState<string | null>(null)

  async function handleSave(id: string) {
    setSaving(id)
    const result = await updateMessageTemplateAction(id, contents[id] ?? "")
    setSaving(null)
    if (result.error) toast.error(result.error)
    else toast.success(result.success)
  }

  return (
    <div className="space-y-3 max-w-2xl">
      <p className="text-xs text-muted-foreground">
        Variáveis disponíveis:{" "}
        {WHATSAPP_VARIABLES.map((v) => (
          <Badge key={v} variant="outline" className="mr-1 font-mono text-xs">{v}</Badge>
        ))}
      </p>

      {templates.map((t) => {
        const isOpen = openId === t.id
        return (
          <Card key={t.id}>
            <CardHeader
              className="cursor-pointer py-4 px-6"
              onClick={() => setOpenId(isOpen ? null : t.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{t.trigger_key}</p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
            {isOpen && (
              <CardContent className="pt-0 pb-4 px-6 space-y-3">
                <Textarea
                  rows={6}
                  value={contents[t.id] ?? ""}
                  onChange={(e) =>
                    setContents((prev) => ({ ...prev, [t.id]: e.target.value }))
                  }
                  className="font-mono text-sm resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleSave(t.id)}
                    disabled={saving === t.id}
                  >
                    {saving === t.id ? (
                      "Salvando..."
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
