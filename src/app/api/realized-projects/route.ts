import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam
    ? Math.min(Math.max(Number(limitParam) || 12, 1), 100)
    : 100;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("realized_projects")
    .select(
      "id,name,name_fr,name_en,name_it,categories,stacks,description,description_fr,description_en,description_it,project_year,client_name,project_url,github_url,image_urls,created_at,updated_at",
    )
    .order("project_year", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { error: "Impossible de charger les projets realises." },
      { status: 500, headers: corsHeaders },
    );
  }

  return NextResponse.json(
    {
      data: data ?? [],
      count: data?.length ?? 0,
    },
    { headers: corsHeaders },
  );
}
