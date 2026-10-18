import {
  CalendarDays,
  Code2,
  ExternalLink,
  FolderKanban,
  ImageIcon,
  Lock,
  Timer,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { RealizedProject } from "@/lib/types";
import { RealizedProjectFormDialog } from "@/components/forms/realized-project-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Projets réalisés" };

const labelClass =
  "text-xs font-medium uppercase tracking-wide text-muted-foreground";

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
  if (!value)
    return <span className="text-subtle-foreground">Non renseigné</span>;
  if (value === "Private") {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <Lock className="size-3.5" aria-hidden="true" /> Privé
      </span>
    );
  }
  if (value === "In Progress") {
    return (
      <span className="inline-flex items-center gap-1.5 text-warning">
        <Timer className="size-3.5" aria-hidden="true" /> En cours
      </span>
    );
  }
  return (
    <a
      href={value}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
    >
      <Icon className="size-3.5" aria-hidden="true" />
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
        title="Projets réalisés"
        description="Portfolio interne des projets livrés, privés ou encore en cours."
        action={<RealizedProjectFormDialog />}
      />

      {projects.length ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {projects.map((project) => {
            const title = project.name_fr || project.name;
            const previewImage = project.image_urls.find(isUrl);
            return (
              <Card key={project.id} className="gap-0 pt-4 pb-0">
                <div className="px-4">
                  <div className="aspect-[16/9] overflow-hidden rounded-lg bg-muted ring-1 ring-border">
                    {previewImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewImage}
                        alt={`Aperçu du projet ${title}`}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-subtle-foreground">
                        <ImageIcon className="size-8" aria-hidden="true" />
                        <span className="sr-only">Aucune image</span>
                      </div>
                    )}
                  </div>
                </div>
                <CardHeader className="pt-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-lg">{title}</CardTitle>
                      <CardDescription className="mt-1">
                        {project.client_name}
                        <span aria-hidden="true"> · </span>
                        <span className="tabular">{project.project_year}</span>
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="tabular gap-1 text-muted-foreground"
                      >
                        <CalendarDays aria-hidden="true" />
                        {formatDate(project.created_at)}
                      </Badge>
                      <RealizedProjectFormDialog project={project} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-5 pt-3 pb-5">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {project.description_fr || project.description}
                  </p>
                  {!!project.stacks.length && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.stacks.map((stack) => (
                        <Badge key={stack} variant="secondary">
                          {stack}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border bg-muted/40 p-3">
                      <p className={labelClass}>English</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {project.name_en}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {project.description_en}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/40 p-3">
                      <p className={labelClass}>Italiano</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {project.name_it}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {project.description_it}
                      </p>
                    </div>
                  </div>
                  {!!project.categories.length && (
                    <div className="space-y-2">
                      <p className={labelClass}>Catégories</p>
                      <div className="flex flex-wrap gap-1.5">
                        {project.categories.map((category) => (
                          <Badge key={category} variant="outline">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className={labelClass}>Site</dt>
                      <dd className="mt-1">
                        <LinkValue
                          value={project.project_url}
                          label="Ouvrir le site"
                          kind="site"
                        />
                      </dd>
                    </div>
                    <div>
                      <dt className={labelClass}>GitHub</dt>
                      <dd className="mt-1">
                        <LinkValue
                          value={project.github_url}
                          label="Ouvrir GitHub"
                          kind="github"
                        />
                      </dd>
                    </div>
                  </dl>
                  {!!project.image_urls.length && (
                    <div className="space-y-2">
                      <p className={labelClass}>Images</p>
                      <div className="flex flex-wrap gap-2">
                        {project.image_urls.map((image, index) =>
                          isUrl(image) ? (
                            <a
                              key={`${image}-${index}`}
                              href={image}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Ouvrir l’image ${index + 1} du projet ${title}`}
                              className="block size-16 overflow-hidden rounded-lg bg-muted ring-1 ring-border transition-shadow hover:ring-2 hover:ring-primary"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={image}
                                alt={`Image ${index + 1} du projet ${title}`}
                                loading="lazy"
                                className="size-full object-cover"
                              />
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
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="Aucun projet réalisé"
          description="Ajoutez un premier projet au portfolio interne."
        />
      )}
    </div>
  );
}
