"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Props {
  total: number
  pageSize?: number
}

export function Pagination({ total, pageSize = 20 }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get("page") ?? "1")
  const totalPages = Math.ceil(total / pageSize)

  if (totalPages <= 1) return null

  function buildUrl(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    return `${pathname}?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground py-2">
      <span>
        {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, total)} de {total}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" asChild disabled={currentPage <= 1}>
          <Link href={buildUrl(currentPage - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" asChild disabled={currentPage >= totalPages}>
          <Link href={buildUrl(currentPage + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
