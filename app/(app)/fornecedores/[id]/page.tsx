import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getAuthProfile } from "@/lib/supabase/queries"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DeleteSupplierButton } from "@/components/suppliers/delete-supplier-button"
import { Pencil, Phone, Mail, MapPin, FileText, Package } from "lucide-react"

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR")
}

export default async function FornecedorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getAuthProfile()
  if (!profile) redirect("/onboarding")

  const cid = profile.company_id
  const supabase = await createClient()

  const [{ data: supplier }, { data: products }] = await Promise.all([
    supabase.from("suppliers").select("*").eq("id", id).eq("company_id", cid).single(),
    supabase
      .from("products")
      .select("id, name, sku, sale_price, stock_quantity")
      .eq("company_id", cid)
      .eq("supplier_id", id)
      .eq("status", "active")
      .order("name")
      .limit(20),
  ])

  if (!supplier) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={supplier.name} description="Detalhes do fornecedor" />
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/fornecedores/${id}/editar`}>
              <Pencil className="mr-1 h-4 w-4" />Editar
            </Link>
          </Button>
          <DeleteSupplierButton id={id} name={supplier.name} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader><CardTitle className="text-sm">Contato</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {supplier.cnpj && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{supplier.cnpj}</span>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {supplier.whatsapp && supplier.whatsapp !== supplier.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{supplier.whatsapp} (WhatsApp)</span>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="break-all">{supplier.email}</span>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{supplier.address}</span>
                </div>
              )}
              {supplier.notes && (
                <p className="text-muted-foreground pt-2 border-t">{supplier.notes}</p>
              )}
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Cadastrado em {fmtDate(supplier.created_at)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">Produtos vinculados</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href={`/produtos/novo?fornecedor=${id}`}>
                  <Package className="mr-1 h-3 w-3" />Novo produto
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {(!products || products.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum produto vinculado a este fornecedor.
                </p>
              ) : (
                <div className="divide-y">
                  {products.map((p) => (
                    <Link
                      key={p.id}
                      href={`/produtos/${p.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{p.name}</p>
                        {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                      </div>
                      <div className="text-right ml-2 shrink-0">
                        <p className="text-sm font-medium">{fmt(p.sale_price)}</p>
                        <p className="text-xs text-muted-foreground">Estoque: {p.stock_quantity}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
