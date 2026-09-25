import "server-only";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", authData.user.id)
    .single();
  return (data as Profile | null) ?? null;
}

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) redirect("/login");
  return profile;
}

export async function requireAdmin() {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}

export async function ensureOpenLoginSession(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("login_sessions")
    .select("id")
    .eq("profile_id", profileId)
    .is("logout_at", null)
    .maybeSingle();

  if (data?.id) return;

  const { error } = await supabase
    .from("login_sessions")
    .insert({ profile_id: profileId });

  if (error?.code === "23505") return;
  if (error) console.error("Echec creation historique de connexion", error);
}
