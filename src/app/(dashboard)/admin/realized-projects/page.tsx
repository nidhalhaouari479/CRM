import { Code2, ExternalLink, ImageIcon, Lock, Timer } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { RealizedProject } from "@/lib/types";
import { RealizedProjectFormDialog } from "@/components/forms/realized-project-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Projets realises" };

function isUrl(value: string | null | undefined) {
  if (!value) return false;
  return value.startsWith("http://") || value.startsWith("https://");
}

function LinkValue({
  value,
  label,
  kind,
}: {
  value: string | null;
  label: string;
  kind: "site" | "github";
}) {
  const Icon = kind === "github" ? Code2 : ExternalLink;
  if (!value) return <span className="text-slate-400">Non renseigne</span>;
  if (value === "Private") {
    return (
      <span className="inline-flex items-center gap-1 text-slate-600">
        <Lock className="size-3.5" /> Private
      </span>
    );
  }
  if (value === "In Progress") {
    return (
      <span className="inline-flex items-center gap-1 text-amber-700">
        <Timer className="size-3.5" /> In Progress
      </span>
    );
  }
  return (
    <a
      href={value}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
    >
      <Icon className="size-3.5" />
      {label}
    </a>
  );
}

export default async function RealizedProjectsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("realized_projects")
    .select("*")
    .order("project_year", { ascending: false })
    .order("created_at", { ascending: false });
  const projects = (data ?? []) as RealizedProject[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projets realises"
        description="Portfolio interne des projets livres, prives ou encore en cours."
        action={<RealizedProjectFormDialog />}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {projects.map((project) => {
          const previewImage = project.image_urls.find(isUrl);
          return (
            <Card key={project.id}>
              {previewImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewImage}
                  alt={project.name_fr || project.name}
                  className="h-48 w-full object-cover"
                />
              )}
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{project.name_fr || project.name}</CardTitle>
                    <CardDescription>
                      {project.client_name} - {project.project_year}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{formatDate(project.created_at)}</Badge>
                    <RealizedProjectFormDialog project={project} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm leading-6 text-slate-600">
                  <p>{project.description_fr || project.description}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border p-3">
                      <p className="text-xs font-medium uppercase text-slate-400">
                        English
                      </p>
                      <p className="mt-1 font-medium text-slate-800">
                        {project.name_en}
                      </p>
                      <p className="mt-1">{project.description_en}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-xs font-medium uppercase text-slate-400">
                        Italiano
                      </p>
                      <p className="mt-1 font-medium text-slate-800">
                        {project.name_it}
                      </p>
                      <p className="mt-1">{project.description_it}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.stacks.map((stack) => (
                    <Badge key={stack} variant="secondary">
                      {stack}
                    </Badge>
                  ))}
                </div>
                {!!project.categories.length && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase text-slate-400">
                      Categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.categories.map((category) => (
                        <Badge key={category} variant="outline">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-400">
                      Site
                    </p>
                    <LinkValue
                      value={project.project_url}
                      label="Ouvrir le site"
                      kind="site"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-400">
                      GitHub
                    </p>
                    <LinkValue
                      value={project.github_url}
                      label="Ouvrir GitHub"
                      kind="github"
                    />
                  </div>
                </div>
                {!!project.image_urls.length && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase text-slate-400">
                      Images
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.image_urls.map((image, index) =>
                        isUrl(image) ? (
                          <a
                            key={`${image}-${index}`}
                            href={image}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                          >
                            <ImageIcon className="size-3.5" />
                            Image {index + 1}
                          </a>
                        ) : (
                          <Badge key={`${image}-${index}`} variant="outline">
                            {image}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!projects.length && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            Aucun projet realise pour le moment.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
