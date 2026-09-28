"use client";

import { useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2, UploadCloud, X } from "lucide-react";
import {
  createRealizedProject,
  updateRealizedProject,
} from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormGrid } from "@/components/forms/form-fields";
import { SubmitButton } from "@/components/forms/submit-button";
import { createClient } from "@/lib/supabase/client";
import {
  REALIZED_PROJECT_CATEGORIES,
  type RealizedProject,
} from "@/lib/types";

const REALIZED_PROJECT_IMAGES_BUCKET = "realized-project-images";
const VISIBILITY_STATUSES = ["Private", "In Progress"] as const;

function DynamicInputs({
  label,
  name,
  placeholder,
  minItems = 1,
  initialItems,
}: {
  label: string;
  name: string;
  placeholder: string;
  minItems?: number;
  initialItems?: string[];
}) {
  const [items, setItems] = useState(
    initialItems?.length ? initialItems : [""],
  );
  const canRemove = items.length > minItems;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setItems((current) => [...current, ""])}
        >
          <Plus />
          Ajouter
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((value, index) => (
          <div key={index} className="flex gap-2">
            <Input
              name={name}
              defaultValue={value}
              placeholder={placeholder}
              required={index < minItems}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Supprimer"
              disabled={!canRemove}
              onClick={() =>
                setItems((current) =>
                  current.filter((_, itemIndex) => itemIndex !== index),
                )
              }
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function fileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName;
  return file.type.split("/").pop() || "png";
}

function RealizedProjectImagesInput({
  onUploadingChange,
  initialImageUrls,
}: {
  onUploadingChange: (uploading: boolean) => void;
  initialImageUrls?: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<
    { value: string; label: string; isUrl: boolean }[]
  >(
    (initialImageUrls ?? []).map((image, index) => ({
      value: image,
      label: image.startsWith("http") ? `Image ${index + 1}` : image,
      isUrl: image.startsWith("http://") || image.startsWith("https://"),
    })),
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadFiles(files: File[]) {
    if (uploading) return;

    const remainingSlots = 30 - images.length;
    if (remainingSlots <= 0) return;

    const imageFiles = files
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remainingSlots);
    if (!imageFiles.length) return;

    setUploading(true);
    onUploadingChange(true);
    setError("");

    try {
      const supabase = createClient();
      const uploadedImages = await Promise.all(
        imageFiles.map(async (file) => {
          const path = `realized-projects/${crypto.randomUUID()}.${fileExtension(file)}`;
          const { error: uploadError } = await supabase.storage
            .from(REALIZED_PROJECT_IMAGES_BUCKET)
            .upload(path, file, {
              cacheControl: "31536000",
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from(REALIZED_PROJECT_IMAGES_BUCKET)
            .getPublicUrl(path);

          return {
            value: data.publicUrl,
            label: file.name || "Image",
            isUrl: true,
          };
        }),
      );

      setImages((current) => [...current, ...uploadedImages].slice(0, 30));
    } catch (uploadError) {
      console.error("Echec upload images", uploadError);
      setError("Impossible d'uploader les images.");
    } finally {
      setUploading(false);
      onUploadingChange(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      className="space-y-3 rounded-lg border border-dashed p-3"
      tabIndex={0}
      onPaste={(event) => {
        const files = Array.from(event.clipboardData.files);
        if (files.length) void uploadFiles(files);
      }}
      onDrop={(event) => {
        event.preventDefault();
        void uploadFiles(Array.from(event.dataTransfer.files));
      }}
      onDragOver={(event) => event.preventDefault()}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">Images</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || images.length >= 30}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud />
          {uploading ? "Upload..." : "Importer"}
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {VISIBILITY_STATUSES.map((status) => (
          <Button
            key={status}
            type="button"
            variant="outline"
            size="sm"
            disabled={
              images.length >= 30 || images.some((image) => image.value === status)
            }
            onClick={() =>
              setImages((current) => [
                ...current,
                {
                  value: status,
                  label: status,
                  isUrl: false,
                },
              ].slice(0, 30))
            }
          >
            Ajouter {status}
          </Button>
        ))}
      </div>
      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => void uploadFiles(Array.from(event.target.files ?? []))}
      />
      {images.map((image, index) => (
        <input
          key={`${image.value}-${index}`}
          type="hidden"
          name="image_urls"
          value={image.value}
        />
      ))}
      {!!images.length && (
        <div className="grid gap-2 sm:grid-cols-2">
          {images.map((image, index) => (
            <div
              key={`${image.value}-${image.label}-${index}`}
              className="flex items-center gap-2 rounded-md border p-2"
            >
              {image.isUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.value}
                  alt={image.label}
                  className="size-12 rounded-md object-cover"
                />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-md bg-muted text-xs font-medium text-slate-600">
                  {image.label}
                </div>
              )}
              <p className="min-w-0 flex-1 truncate text-sm text-slate-600">
                {image.label}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Supprimer"
                onClick={() =>
                  setImages((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              >
                <X />
              </Button>
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function ProjectCategoriesSelect({
  initialCategories,
}: {
  initialCategories?: string[];
}) {
  const [categories, setCategories] = useState<string[]>(
    (initialCategories ?? []).filter((category) =>
      REALIZED_PROJECT_CATEGORIES.includes(
        category as (typeof REALIZED_PROJECT_CATEGORIES)[number],
      ),
    ),
  );
  const availableCategories = REALIZED_PROJECT_CATEGORIES.filter(
    (category) => !categories.includes(category),
  );

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Categories</p>
      <select
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value=""
        required={!categories.length}
        onChange={(event) => {
          const category = event.target.value;
          if (!category) return;
          setCategories((current) =>
            current.includes(category) ? current : [...current, category],
          );
        }}
      >
        <option value="">Select category</option>
        {availableCategories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      {categories.map((category) => (
        <input key={category} type="hidden" name="categories" value={category} />
      ))}
      {!!categories.length && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <span
              key={category}
              className="inline-flex h-7 items-center gap-1 rounded-lg border px-2 text-xs"
            >
              {category}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Supprimer"
                onClick={() =>
                  setCategories((current) =>
                    current.filter((item) => item !== category),
                  )
                }
              >
                <X />
              </Button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function UrlOrStatusInput({
  id,
  name,
  placeholder,
  defaultValue,
}: {
  id: string;
  name: string;
  placeholder: string;
  defaultValue?: string | null;
}) {
  const [mode, setMode] = useState<"url" | (typeof VISIBILITY_STATUSES)[number]>(
    defaultValue === "Private" || defaultValue === "In Progress"
      ? defaultValue
      : "url",
  );

  return (
    <div className="grid gap-2">
      <select
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={mode}
        onChange={(event) =>
          setMode(event.target.value as typeof mode)
        }
      >
        <option value="url">URL</option>
        {VISIBILITY_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      {mode === "url" ? (
        <Input
          id={id}
          name={name}
          placeholder={placeholder}
          defaultValue={
            defaultValue &&
            defaultValue !== "Private" &&
            defaultValue !== "In Progress"
              ? defaultValue
              : ""
          }
        />
      ) : (
        <input type="hidden" name={name} value={mode} />
      )}
    </div>
  );
}

export function RealizedProjectFormDialog({
  project,
}: {
  project?: RealizedProject;
}) {
  const currentYear = new Date().getFullYear();
  const [imagesUploading, setImagesUploading] = useState(false);
  const isEditing = !!project;
  const action = isEditing ? updateRealizedProject : createRealizedProject;
  const submitLabel = isEditing ? "Modifier le projet realise" : "Creer le projet realise";

  return (
    <Dialog>
      <DialogTrigger render={<Button variant={isEditing ? "outline" : "default"} />}>
        {isEditing ? <Pencil /> : <ImagePlus />}
        {isEditing ? "Modifier" : "Ajouter un projet realise"}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le projet realise" : "Nouveau projet realise"}
          </DialogTitle>
          <DialogDescription>
            Ajoutez un projet livre avec ses stacks, liens et visuels.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-5">
          {project?.id && <input type="hidden" name="id" value={project.id} />}
          <FormGrid>
            <Field label="Nom de projet FR" htmlFor="name_fr" required>
              <Input
                id="name_fr"
                name="name_fr"
                defaultValue={project?.name_fr || project?.name || ""}
                required
              />
            </Field>
            <Field label="Nom de projet EN" htmlFor="name_en" required>
              <Input
                id="name_en"
                name="name_en"
                defaultValue={project?.name_en || project?.name || ""}
                required
              />
            </Field>
            <Field label="Nom de projet IT" htmlFor="name_it" required>
              <Input
                id="name_it"
                name="name_it"
                defaultValue={project?.name_it || project?.name || ""}
                required
              />
            </Field>
            <Field label="Annee de projet" htmlFor="project_year" required>
              <Input
                id="project_year"
                name="project_year"
                type="number"
                min="1990"
                max={currentYear + 10}
                defaultValue={project?.project_year ?? currentYear}
                required
              />
            </Field>
          </FormGrid>
          <Field label="Nom de client" htmlFor="client_name" required>
            <Input
              id="client_name"
              name="client_name"
              defaultValue={project?.client_name ?? ""}
              required
            />
          </Field>
          <Field label="Description FR" htmlFor="description_fr" required>
            <Textarea
              id="description_fr"
              name="description_fr"
              defaultValue={project?.description_fr || project?.description || ""}
              required
            />
          </Field>
          <Field label="Description EN" htmlFor="description_en" required>
            <Textarea
              id="description_en"
              name="description_en"
              defaultValue={project?.description_en || project?.description || ""}
              required
            />
          </Field>
          <Field label="Description IT" htmlFor="description_it" required>
            <Textarea
              id="description_it"
              name="description_it"
              defaultValue={project?.description_it || project?.description || ""}
              required
            />
          </Field>
          <ProjectCategoriesSelect initialCategories={project?.categories} />
          <DynamicInputs
            label="Stacks"
            name="stacks"
            placeholder="React, Next.js, Supabase..."
            initialItems={project?.stacks}
          />
          <FormGrid>
            <Field label="Lien de site" htmlFor="project_url">
              <UrlOrStatusInput
                id="project_url"
                name="project_url"
                placeholder="https://..., In Progress ou Private"
                defaultValue={project?.project_url}
              />
            </Field>
            <Field label="Lien GitHub" htmlFor="github_url">
              <UrlOrStatusInput
                id="github_url"
                name="github_url"
                placeholder="https://github.com/... ou Private"
                defaultValue={project?.github_url}
              />
            </Field>
          </FormGrid>
          <RealizedProjectImagesInput
            onUploadingChange={setImagesUploading}
            initialImageUrls={project?.image_urls}
          />
          <DialogFooter>
            <SubmitButton
              pendingLabel={imagesUploading ? "Upload images..." : "Creation..."}
              disabled={imagesUploading}
            >
              {submitLabel}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
