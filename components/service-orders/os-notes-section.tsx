"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateOsNotesAction } from "@/lib/actions/service-orders"

export function OsNotesSection({
  osId,
  technicalDiagnosis,
  internalNotes,
  customerNotes,
}: {
  osId: string
  technicalDiagnosis: string
  internalNotes: string
  customerNotes: string
}) {
  const [isPending, startTransition] = useTransition()
  const [diagnosis, setDiagnosis] = useState(technicalDiagnosis)
  const [internal, setInternal] = useState(internalNotes)
  const [customer, setCustomer] = useState(customerNotes)

  function save(field: "technical_diagnosis" | "internal_notes" | "customer_notes", value: string) {
    startTransition(async () => {
      const result = await updateOsNotesAction(osId, field, value)
      if (result.error) toast.error(result.error)
      else toast.success("Nota salva")
    })
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Notas e diagnóstico</CardTitle></CardHeader>
      <CardContent>
        <Tabs defaultValue="diagnosis">
          <TabsList className="mb-3">
            <TabsTrigger value="diagnosis" className="text-xs">Diagnóstico técnico</TabsTrigger>
            <TabsTrigger value="internal" className="text-xs">Interno</TabsTrigger>
            <TabsTrigger value="customer" className="text-xs">Para o cliente</TabsTrigger>
          </TabsList>
          <TabsContent value="diagnosis" className="space-y-2">
            <Textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} rows={4} placeholder="Diagnóstico técnico..." />
            <Button size="sm" onClick={() => save("technical_diagnosis", diagnosis)} disabled={isPending}>Salvar</Button>
          </TabsContent>
          <TabsContent value="internal" className="space-y-2">
            <Textarea value={internal} onChange={e => setInternal(e.target.value)} rows={4} placeholder="Notas internas da equipe..." />
            <Button size="sm" onClick={() => save("internal_notes", internal)} disabled={isPending}>Salvar</Button>
          </TabsContent>
          <TabsContent value="customer" className="space-y-2">
            <Textarea value={customer} onChange={e => setCustomer(e.target.value)} rows={4} placeholder="Informações para o cliente..." />
            <Button size="sm" onClick={() => save("customer_notes", customer)} disabled={isPending}>Salvar</Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
