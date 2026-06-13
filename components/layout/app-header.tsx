"use client"

import * as React from "react"
import { Search, LogOut, Settings, ChevronDown, User, Sun, Moon } from "lucide-react"
import { useTransition } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ROLE_LABELS } from "@/lib/constants"
import { logoutAction } from "@/lib/actions/auth"
import type { Profile } from "@/types/app"
import { NotificationBell } from "@/components/layout/notification-bell"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="size-9" />

  const isDark = theme === "dark"
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9 text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}

interface AppHeaderProps {
  profile?: Profile | null
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function AppHeader({ profile }: AppHeaderProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      {/* Search */}
      <div className="relative flex-1 max-w-sm hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar clientes, OS, produtos..."
          className="pl-9 h-9 bg-muted/40 border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-primary/50 placeholder:text-muted-foreground/70"
        />
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <ThemeToggle />
        <NotificationBell />

        {/* User dropdown */}
        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-muted/60"
              >
                <Avatar className="size-7 ring-2 ring-primary/20">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium leading-none max-w-[110px] truncate">
                    {profile.name.split(" ")[0]}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                    {ROLE_LABELS[profile.role] ?? profile.role}
                  </span>
                </div>
                <ChevronDown className="size-3 text-muted-foreground hidden sm:block ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-2.5 py-0.5">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate">{profile.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{profile.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/configuracoes/empresa" className="flex items-center gap-2">
                  <Settings className="size-4" />
                  Configurações
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isPending}
                onSelect={() => startTransition(() => logoutAction())}
                className="flex items-center gap-2"
              >
                <LogOut className="size-4" />
                {isPending ? "Saindo..." : "Sair"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Fallback if no profile */}
        {!profile && (
          <Button variant="ghost" size="icon" className="size-9">
            <User className="size-4" />
          </Button>
        )}
      </div>
    </header>
  )
}
