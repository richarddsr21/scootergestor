"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function applyMask(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 14)

  if (d.length <= 11) {
    if (d.length <= 3) return d
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
  }

  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

interface Props {
  name: string
  defaultValue?: string
  className?: string
}

export function CpfCnpjField({ name, defaultValue = "", className = "space-y-1.5" }: Props) {
  const [value, setValue] = useState(() => applyMask(defaultValue))
  const digits = value.replace(/\D/g, "")
  const label = digits.length > 11 ? "CNPJ" : digits.length === 11 ? "CPF" : "CPF / CNPJ"
  const placeholder = digits.length > 11 ? "00.000.000/0001-00" : "000.000.000-00"

  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        value={value}
        onChange={(e) => setValue(applyMask(e.target.value))}
        placeholder={placeholder}
      />
    </div>
  )
}
