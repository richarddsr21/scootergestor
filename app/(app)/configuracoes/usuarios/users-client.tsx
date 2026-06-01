"use client"

import * as React from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import { UserPlus, Copy, Check, MoreHorizontal, Mail, Shield, UserX, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ROLE_LABELS } from "@/lib/constants"
import {
  inviteUserAction,
  updateUserRoleAction,
  toggleUserStatusAction,
  cancelInvitationAction,
} from "@/lib/actions/users"
import type { Profile, CompanyInvitation } from "@/types/app"

const ROLES_FOR_INVITE = [
  { value: "admin", label: "Administrador" },
  { value: "manager", label: "Gerente" },
  { value: "seller", label: "Vendedor" },
  { value: "technician", label: "Técnico" },
  { value: "cashier", label: "Caixa" },
]

interface Props {
  profiles: Profile[]
  invitations: CompanyInvitation[]
  currentUserId: string
  canManage: boolean
}

export function UsersClient({ profiles, invitations, currentUserId, canManage }: Props) {
  const [open, setOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [inviteState, formAction, pending] = useActionState(inviteUserAction, {})
  const inviteUrl = (inviteState as { inviteUrl?: string }).inviteUrl

  React.useEffect(() => {
    if (inviteState.error) toast.error(inviteState.error)
    if (inviteState.success && !inviteUrl) {
      toast.success(inviteState.success)
      setOpen(false)
    }
  }, [inviteState, inviteUrl])

  function handleCopy() {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRoleChange(profileId: string, role: string) {
    const result = await updateUserRoleAction(profileId, role)
    if (result.error) toast.error(result.error)
    else toast.success(result.success)
  }

  async function handleToggleStatus(profileId: string, activate: boolean) {
    const result = await toggleUserStatusAction(profileId, activate)
    if (result.error) toast.error(result.error)
    else toast.success(result.success)
  }

  async function handleCancelInvite(id: string) {
    const result = await cancelInvitationAction(id)
    if (result.error) toast.error(result.error)
    else toast.success(result.success)
  }

  return (
    <div className="space-y-6">
      {/* Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Membros da equipe</CardTitle>
          {canManage && (
            <Button size="sm" onClick={() => { setOpen(true) }}>
              <UserPlus className="mr-2 h-4 w-4" />
              Convidar usuário
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p) => {
                const isCurrentUser = p.user_id === currentUserId
                const initials = p.name
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()

                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium leading-none">
                            {p.name}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{p.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {canManage && !isCurrentUser && p.role !== "owner" ? (
                        <Select
                          defaultValue={p.role}
                          onValueChange={(v) => handleRoleChange(p.id, v)}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES_FOR_INVITE.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm">{ROLE_LABELS[p.role] ?? p.role}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "active" ? "default" : "secondary"}>
                        {p.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        {!isCurrentUser && p.role !== "owner" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {p.status === "active" ? (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleToggleStatus(p.id, false)}
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Desativar
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleToggleStatus(p.id, true)}>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Reativar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Convites pendentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Expira em</TableHead>
                  {canManage && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {inv.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {ROLE_LABELS[inv.role] ?? inv.role}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(inv.expires_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleCancelInvite(inv.id)}
                        >
                          Cancelar
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Invite dialog */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setCopied(false)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar usuário</DialogTitle>
            <DialogDescription>
              O usuário receberá um link de acesso para entrar na sua empresa.
            </DialogDescription>
          </DialogHeader>

          {inviteUrl ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Convite criado! Copie o link abaixo e envie para o usuário.
              </p>
              <div className="flex gap-2">
                <Input value={inviteUrl} readOnly className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setOpen(false)
                    setCopied(false)
                  }}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">E-mail</Label>
                <Input
                  id="invite-email"
                  name="email"
                  type="email"
                  placeholder="colaborador@exemplo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Função</Label>
                <Select name="role" defaultValue="seller">
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES_FOR_INVITE.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {inviteState.error && (
                <p className="text-sm text-destructive">{inviteState.error}</p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Criando..." : "Criar convite"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
