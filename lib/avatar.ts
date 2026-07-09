const NAMES = ["teal", "violet", "amber", "coral"] as const
export type AvatarColor = (typeof NAMES)[number]

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}

export function avatarColorName(name: string): AvatarColor {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return NAMES[Math.abs(hash) % NAMES.length]
}

export const AVATAR_BG: Record<AvatarColor, string> = {
  teal: "bg-avatar-teal",
  violet: "bg-avatar-violet",
  amber: "bg-avatar-amber",
  coral: "bg-avatar-coral",
}

export const AVATAR_HOVER_CARD: Record<AvatarColor, string> = {
  teal: "hover:border-brand-teal hover:shadow-[0_0_20px_var(--brand-teal-glow)]",
  violet: "hover:border-brand-violet hover:shadow-[0_0_20px_var(--brand-violet-glow)]",
  amber: "hover:border-brand-amber hover:shadow-[0_0_20px_var(--brand-amber-glow)]",
  coral: "hover:border-brand-coral hover:shadow-[0_0_20px_var(--brand-coral-glow)]",
}

export const AVATAR_ICON_TEXT: Record<AvatarColor, string> = {
  teal: "text-brand-teal",
  violet: "text-brand-violet",
  amber: "text-brand-amber",
  coral: "text-brand-coral",
}

export const AVATAR_BORDER: Record<AvatarColor, string> = {
  teal: "border-brand-teal",
  violet: "border-brand-violet",
  amber: "border-brand-amber",
  coral: "border-brand-coral",
}
