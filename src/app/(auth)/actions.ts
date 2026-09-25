"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export async function signIn(formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/login?error=Identifiants%20invalides");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error)
    redirect(
      `/login?error=${encodeURIComponent("Courriel ou mot de passe incorrect")}`,
    );

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, is_active")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    redirect(
      `/login?error=${encodeURIComponent("Profil CRM introuvable. Créez ou synchronisez le profil de cet utilisateur.")}`,
    );
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    redirect(
      `/login?error=${encodeURIComponent("Ce compte utilisateur est désactivé.")}`,
    );
  }

  await supabase
    .from("login_sessions")
    .update({ logout_at: new Date().toISOString() })
    .eq("profile_id", profile.id)
    .is("logout_at", null);
  await supabase.from("login_sessions").insert({ profile_id: profile.id });

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (authData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (profile?.id) {
      await supabase
        .from("login_sessions")
        .update({ logout_at: new Date().toISOString() })
        .eq("profile_id", profile.id)
        .is("logout_at", null);
    }
  }
  await supabase.auth.signOut();
  redirect("/login");
}
