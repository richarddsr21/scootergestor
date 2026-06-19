"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { deleteProductAction } from "@/lib/actions/products"

export function DeleteProductButton({
  productId,
  productName,
  redirectTo,
}: {
  productId: string
  productName: string
  redirectTo?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProductAction(productId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(result.success ?? "Produto inativado")
        if (redirectTo) router.push(redirectTo)
        else router.refresh()
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Inativar produto?</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{productName}</strong> será marcado como inativo e não aparecerá mais nas buscas. Você pode reativá-lo pelo formulário de edição.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Inativando..." : "Inativar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
