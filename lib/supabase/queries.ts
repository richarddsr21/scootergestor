import { cache } from "react"
import { createClient } from "./server"

export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ?? null
})

export const getAuthProfile = cache(async () => {
  const user = await getAuthUser()
  if (!user) return null
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()
  return profile
})
