import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || null);

const requestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  company: optionalText(160),
  email: z.string().trim().max(200).pipe(z.email()),
  phone: optionalText(40),
  project_type: z.string().trim().min(1).max(120),
  timeline: optionalText(120),
  budget: optionalText(120),
  message: z.string().trim().min(10).max(5000),
  source: optionalText(300),
  // Champ piege anti-robot : doit rester vide.
  website: z.string().optional(),
});

function isAuthorized(request: NextRequest) {
  const expected = process.env.PROJECT_REQUESTS_API_KEY;
  const received =
    request.headers.get("x-api-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !received) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Donnees invalides.",
        fields: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 422 },
    );
  }

  const { website, ...values } = parsed.data;
  if (website) {
    return NextResponse.json({ id: null }, { status: 201 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("project_requests")
    .insert(values)
    .select("id, created_at")
    .single();

  if (error) {
    console.error("Echec enregistrement demande de projet", error);
    return NextResponse.json(
      { error: "Impossible d'enregistrer la demande." },
      { status: 500 },
    );
  }

  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("is_active", true);
  if (admins?.length) {
    const { error: notifyError } = await supabase.from("notifications").insert(
      admins.map((admin) => ({
        recipient_id: admin.id,
        title: "Nouvelle demande de projet",
        message: `${values.name} — ${values.project_type}`,
        kind: "info",
        entity_type: "project_requests",
        entity_id: data.id,
      })),
    );
    if (notifyError) console.error("Echec notification demande", notifyError);
  }

  return NextResponse.json({ id: data.id, created_at: data.created_at }, { status: 201 });
}
