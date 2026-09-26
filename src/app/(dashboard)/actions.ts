"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

z.config(z.locales.fr());

const text = (value: FormDataEntryValue | null) => String(value ?? "").trim();
const nullable = (value: FormDataEntryValue | null) => text(value) || null;
const numberOrNull = (value: FormDataEntryValue | null) =>
  text(value) ? Number(value) : null;
const textList = (values: FormDataEntryValue[]) =>
  values.map((value) => String(value).trim()).filter(Boolean);
const isMissingColumnError = (error: { code?: string; message?: string }) =>
  error.code === "PGRST204" ||
  error.message?.includes("schema cache") ||
  error.message?.includes("submission_key");
const urlOrVisibilityStatus = z
  .string()
  .refine(
    (value) =>
      value === "In Progress" ||
      value === "Private" ||
      z.url().safeParse(value).success,
    "Saisissez une URL valide, In Progress ou Private.",
  );

async function createNotifications(
  notifications: {
    recipient_id: string;
    title: string;
    message: string;
    kind?: string;
    entity_type?: string;
    entity_id?: string;
  }[],
) {
  if (!notifications.length) return;
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert(
      notifications.map((notification) => ({
        kind: "info",
        ...notification,
      })),
    );
    if (error) {
      console.error("Echec creation notifications", { code: error.code });
    }
  } catch (error) {
    console.error("Notifications ignorees", error);
  }
}

export async function markNotificationRead(formData: FormData) {
  const profile = await requireProfile();
  const id = text(formData.get("id"));
  z.object({ id: z.uuid() }).parse({ id });
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_id", profile.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function markAllNotificationsRead() {
  const profile = await requireProfile();
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", profile.id)
    .is("read_at", null);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function createClient(
  _previousState: { error: string },
  formData: FormData,
): Promise<{ error: string }> {
  const profile = await requireProfile();
  const businessSector = nullable(formData.get("business_sector"));
  const serviceType = text(formData.get("service_type"));
  const values = {
    contact_name: nullable(formData.get("contact_name")),
    contact_position: nullable(formData.get("contact_position")),
    company_name: text(formData.get("company_name")),
    business_sector: businessSector,
    business_sector_other:
      businessSector === "Autre"
        ? nullable(formData.get("business_sector_other"))
        : null,
    email: nullable(formData.get("email")),
    phone: text(formData.get("phone")),
    website: nullable(formData.get("website")),
    facebook_url: nullable(formData.get("facebook_url")),
    instagram_url: nullable(formData.get("instagram_url")),
    address: nullable(formData.get("address")),
    city: nullable(formData.get("city")),
    country: text(formData.get("country")) || "Tunisie",
    client_type: text(formData.get("client_type")) || "Company",
    service_type: serviceType,
    service_type_other:
      serviceType === "Other"
        ? nullable(formData.get("service_type_other"))
        : null,
    estimated_budget: numberOrNull(formData.get("estimated_budget")),
    sales_status: text(formData.get("sales_status")) || "New",
    priority: text(formData.get("priority")) || "Medium",
    notes: nullable(formData.get("notes")),
    created_by: profile.id,
  };
  const validation = z
    .object({
      contact_name: z.string().min(2).nullable(),
      contact_position: z.string().min(2).nullable(),
      company_name: z.string().min(2),
      business_sector: z.string().min(2).nullable(),
      business_sector_other: z.string().min(2).nullable(),
      email: z.email().nullable(),
      phone: z
        .string()
        .min(4)
        .regex(
          /^[+\d\s().-]+$/,
          "Le téléphone contient des caractères non autorisés.",
        )
        .refine(
          (value) => value.replace(/\D/g, "").replace(/^00/, "").length >= 4,
          "Saisissez un numéro de téléphone valide.",
        ),
      website: z.url().nullable(),
      facebook_url: z.url().nullable(),
      instagram_url: z.url().nullable(),
      client_type: z.enum(["Individual", "Company"]),
      service_type: z.string().min(1),
      service_type_other: z.string().min(2).nullable(),
      estimated_budget: z.number().min(0).nullable(),
      sales_status: z.enum([
        "New",
        "Contacted",
        "In Discussion",
        "Waiting",
        "Confirmed",
        "Lost",
        "Converted",
      ]),
      priority: z.enum(["Low", "Medium", "High"]),
    })
    .superRefine((client, context) => {
      if (client.business_sector === "Autre" && !client.business_sector_other) {
        context.addIssue({
          code: "custom",
          path: ["business_sector_other"],
          message: "Précisez le secteur d’activité",
        });
      }
      if (client.service_type === "Other" && !client.service_type_other) {
        context.addIssue({
          code: "custom",
          path: ["service_type_other"],
          message: "Précisez le service demandé",
        });
      }
    })
    .safeParse(values);
  if (!validation.success) {
    return {
      error:
        validation.error.issues[0]?.message ??
        "Vérifiez les informations du client.",
    };
  }
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("clients")
    .insert(values)
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      if (error.message.includes("clients_phone_unique")) {
        return { error: "Un client possède déjà ce numéro de téléphone." };
      }
      if (error.message.includes("clients_email_unique")) {
        return { error: "Un client possède déjà cette adresse de courriel." };
      }
      return { error: "Un client possède déjà cet identifiant." };
    }
    console.error("Échec de la création du client", { code: error.code });
    return {
      error:
        "Impossible d’enregistrer le client. Réessayez ou contactez votre administrateur.",
    };
  }
  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClientStatus(formData: FormData) {
  await requireProfile();
  const id = text(formData.get("id"));
  const sales_status = text(formData.get("sales_status"));
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("clients")
    .update({ sales_status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
}

export async function createInteraction(
  _previousState: { error: string; success: boolean },
  formData: FormData,
): Promise<{ error: string; success: boolean }> {
  const profile = await requireProfile();
  const type = text(formData.get("type"));
  const isWritten = type === "Message" || type === "Email";
  const occurredAt = isWritten
    ? new Date().toISOString()
    : text(formData.get("date"));
  const values = {
    employee_id: profile.id,
    client_id: text(formData.get("client_id")),
    type,
    date: occurredAt,
    duration_minutes: isWritten
      ? null
      : numberOrNull(formData.get("duration_minutes")),
    objective: text(formData.get("objective")),
    result: text(formData.get("result")),
    conclusion: isWritten ? text(formData.get("conclusion")) : "",
    interest_score: numberOrNull(formData.get("interest_score")),
    next_action: nullable(formData.get("next_action")),
  };
  const validation = z
    .object({
      client_id: z.uuid(),
      type: z.enum([
        "Message",
        "Email",
        "Telephone",
        "Meeting en ligne",
        "Meeting face a face",
      ]),
      date: z
        .string()
        .min(1)
        .refine(
          (value) => Number.isFinite(Date.parse(value)),
          "Date et heure invalides.",
        ),
      objective: z.string().min(1),
      result: z.string().min(1),
      conclusion: z.string(),
      interest_score: z.number().int().min(0).max(10),
      duration_minutes: z.number().int().min(0).nullable(),
    })
    .superRefine((interaction, context) => {
      if (isWritten && !interaction.conclusion) {
        context.addIssue({
          code: "custom",
          path: ["conclusion"],
          message: "La conclusion est obligatoire pour un email ou un message.",
        });
      }
      if (
        ["Telephone", "Meeting en ligne", "Meeting face a face"].includes(
          interaction.type,
        ) &&
        interaction.duration_minutes == null
      ) {
        context.addIssue({
          code: "custom",
          path: ["duration_minutes"],
          message: "La duree est obligatoire pour un telephone ou un meeting.",
        });
      }
    })
    .safeParse(values);

  if (!validation.success) {
    return {
      error:
        validation.error.issues[0]?.message ??
        "Vérifiez les champs de l’interaction.",
      success: false,
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("interactions").insert(values);
  if (error) {
    console.error("Échec de création de l’interaction", { code: error.code });
    let message = "Impossible d’enregistrer l’interaction. Réessayez.";
    if (["PGRST204", "42703", "22P02"].includes(error.code)) {
      message =
        "La base de données des interactions doit être mise à jour. Contactez l’administrateur.";
    } else if (error.code === "42501") {
      message =
        "Vous n’avez pas les droits pour ajouter une interaction à ce client.";
    } else if (error.code === "23503") {
      message =
        "Le client ou le profil employé n’existe plus. Actualisez la page.";
    }
    return { error: message, success: false };
  }
  revalidatePath(`/clients/${values.client_id}`);
  revalidatePath("/interactions");
  revalidatePath("/dashboard");
  return { error: "", success: true };
}

export async function createProject(formData: FormData) {
  const profile = await requireProfile();
  const clientId = text(formData.get("client_id"));
  const serviceType = text(formData.get("service_type"));
  const submissionKey = nullable(formData.get("submission_key"));
  const values = {
    client_id: clientId,
    employee_id: profile.id,
    submission_key: submissionKey,
    name: text(formData.get("name")),
    service_type: serviceType,
    service_type_other:
      serviceType === "Other"
        ? nullable(formData.get("service_type_other"))
        : null,
    description: nullable(formData.get("description")),
    estimated_price: numberOrNull(formData.get("estimated_price")),
    final_price: Number(formData.get("final_price") ?? 0),
    status: text(formData.get("status")) || "Proposal",
    start_date: nullable(formData.get("start_date")),
    expected_end_date: nullable(formData.get("expected_end_date")),
  };
  z.object({
    client_id: z.uuid(),
    employee_id: z.uuid(),
    submission_key: z.uuid().nullable(),
    name: z.string().min(2),
    service_type: z.string().min(1),
    service_type_other: z.string().min(2).nullable(),
    final_price: z.number().min(0),
  })
    .superRefine((project, context) => {
      if (project.service_type === "Other" && !project.service_type_other) {
        context.addIssue({
          code: "custom",
          path: ["service_type_other"],
          message: "Précisez le service du projet",
        });
      }
    })
    .parse(values);
  const supabase = await createServerClient();
  let { data, error } = await supabase
    .from("projects")
    .insert(values)
    .select("id")
    .single();
  if (error && isMissingColumnError(error)) {
    const fallbackValues = {
      client_id: values.client_id,
      employee_id: values.employee_id,
      name: values.name,
      service_type: values.service_type,
      service_type_other: values.service_type_other,
      description: values.description,
      estimated_price: values.estimated_price,
      final_price: values.final_price,
      status: values.status,
      start_date: values.start_date,
      expected_end_date: values.expected_end_date,
    };
    ({ data, error } = await supabase
      .from("projects")
      .insert(fallbackValues)
      .select("id")
      .single());
  }
  if (error) {
    if (error.code === "23505" && submissionKey) {
      const { data: existing } = await supabase
        .from("projects")
        .select("id")
        .eq("submission_key", submissionKey)
        .maybeSingle();
      if (existing?.id) redirect(`/projects/${existing.id}`);
    }
    throw new Error(error.message);
  }
  if (!data) throw new Error("Projet cree, mais identifiant introuvable.");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

export async function createRealizedProject(formData: FormData) {
  const profile = await requireAdmin();
  const values = {
    name: text(formData.get("name")),
    stacks: textList(formData.getAll("stacks")),
    description: text(formData.get("description")),
    project_year: Number(formData.get("project_year")),
    client_name: text(formData.get("client_name")),
    project_url: nullable(formData.get("project_url")),
    github_url: nullable(formData.get("github_url")),
    image_urls: textList(formData.getAll("image_urls")),
    created_by: profile.id,
  };
  const validation = z
    .object({
      name: z.string().min(2, "Le nom du projet est obligatoire."),
      stacks: z
        .array(z.string().min(1))
        .min(1, "Ajoutez au moins une stack."),
      description: z.string().min(5, "La description est trop courte."),
      project_year: z
        .number()
        .int()
        .min(1990)
        .max(new Date().getFullYear() + 10),
      client_name: z.string().min(2, "Le nom du client est obligatoire."),
      project_url: urlOrVisibilityStatus.nullable(),
      github_url: urlOrVisibilityStatus.nullable(),
      image_urls: z.array(urlOrVisibilityStatus).max(30),
      created_by: z.uuid(),
    })
    .safeParse(values);
  if (!validation.success) {
    throw new Error(
      validation.error.issues[0]?.message ??
        "Verifiez les informations du projet realise.",
    );
  }
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("realized_projects")
    .insert(validation.data);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/realized-projects");
}

export async function createPayment(formData: FormData) {
  const profile = await requireProfile();
  const projectId = text(formData.get("project_id"));
  const submissionKey = nullable(formData.get("submission_key"));
  const amount = Number(formData.get("amount"));
  const values = {
    project_id: projectId,
    created_by: profile.id,
    submission_key: submissionKey,
    amount,
    currency: "TND",
    payment_method: text(formData.get("payment_method")),
    payment_date: text(formData.get("payment_date")),
    reference: nullable(formData.get("reference")),
    notes: nullable(formData.get("notes")),
  };
  z.object({
    project_id: z.uuid(),
    created_by: z.uuid(),
    submission_key: z.uuid().nullable(),
    amount: z.number().positive(),
    payment_method: z.string().min(1),
    payment_date: z.string().min(1),
  }).parse(values);
  const supabase = await createServerClient();
  const { data: project } = await supabase
    .from("projects")
    .select("remaining_amount")
    .eq("id", projectId)
    .single();
  if (!project) throw new Error("Projet introuvable.");
  if (amount > Number(project.remaining_amount)) {
    throw new Error("Le paiement depasse le reste a payer.");
  }
  let { error } = await supabase.from("payments").insert(values);
  if (error && isMissingColumnError(error)) {
    const fallbackValues = {
      project_id: values.project_id,
      created_by: values.created_by,
      amount: values.amount,
      currency: values.currency,
      payment_method: values.payment_method,
      payment_date: values.payment_date,
      reference: values.reference,
      notes: values.notes,
    };
    ({ error } = await supabase.from("payments").insert(fallbackValues));
  }
  if (error) {
    if (error.code !== "23505") throw new Error(error.message);
  }
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function createComplaint(formData: FormData) {
  const profile = await requireProfile();
  const values = {
    employee_id: profile.id,
    subject: text(formData.get("subject")),
    details: text(formData.get("details")),
  };
  const validation = z
    .object({
      employee_id: z.uuid(),
      subject: z
        .string()
        .min(3, "L'objet doit contenir au moins 3 caracteres."),
      details: z
        .string()
        .min(5, "Les details doivent contenir au moins 5 caracteres."),
    })
    .safeParse(values);
  if (!validation.success) {
    throw new Error(
      validation.error.issues[0]?.message ??
        "Verifiez l'objet et les details de la reclamation.",
    );
  }
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("complaints")
    .insert(values)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  try {
    const admin = createAdminClient();
    const { data: admins } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .eq("is_active", true);
    await createNotifications(
      (admins ?? []).map((adminProfile) => ({
        recipient_id: adminProfile.id,
        title: "Nouvelle reclamation",
        message: values.subject,
        kind: "warning",
        entity_type: "complaints",
        entity_id: data.id,
      })),
    );
  } catch (error) {
    console.error("Notification reclamation ignoree", error);
  }
  revalidatePath("/reclamations");
  revalidatePath("/admin/reclamations");
  revalidatePath("/dashboard");
}

export async function createTask(
  _previousState: { error: string; success: boolean },
  formData: FormData,
): Promise<{ error: string; success: boolean }> {
  const profile = await requireProfile();
  const requestedAssignee = nullable(formData.get("assigned_to"));
  const status = text(formData.get("status")) || "Todo";
  const values = {
    title: text(formData.get("title")),
    description: nullable(formData.get("description")),
    status,
    priority: text(formData.get("priority")) || "Medium",
    due_date: nullable(formData.get("due_date")),
    client_id: nullable(formData.get("client_id")),
    project_id: nullable(formData.get("project_id")),
    assigned_to:
      profile.role === "admin" && requestedAssignee
        ? requestedAssignee
        : profile.id,
    created_by: profile.id,
    completed_at: status === "Done" ? new Date().toISOString() : null,
  };
  const validation = z
    .object({
      title: z.string().min(3, "Le titre doit contenir au moins 3 caracteres."),
      description: z.string().nullable(),
      status: z.enum(["Todo", "In Progress", "Done", "Blocked"]),
      priority: z.enum(["Low", "Medium", "High"]),
      due_date: z.string().nullable(),
      client_id: z.uuid().nullable(),
      project_id: z.uuid().nullable(),
      assigned_to: z.uuid(),
      created_by: z.uuid(),
      completed_at: z.string().nullable(),
    })
    .safeParse(values);
  if (!validation.success) {
    return {
      error:
        validation.error.issues[0]?.message ??
        "Verifiez les informations de la tache.",
      success: false,
    };
  }
  const supabase = await createServerClient();
  const { error } = await supabase.from("tasks").insert(values);
  if (error) {
    console.error("Echec de creation de tache", { code: error.code });
    return {
      error: "Impossible d'enregistrer la tache. Verifiez la migration Supabase.",
      success: false,
    };
  }
  if (values.assigned_to !== profile.id) {
    await createNotifications([
      {
        recipient_id: values.assigned_to,
        title: "Nouvelle tache assignee",
        message: values.title,
        kind: values.priority === "High" ? "warning" : "info",
        entity_type: "tasks",
      },
    ]);
  }
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { error: "", success: true };
}

export async function updateTaskStatus(formData: FormData) {
  await requireProfile();
  const id = text(formData.get("id"));
  const status = text(formData.get("status"));
  z.object({
    id: z.uuid(),
    status: z.enum(["Todo", "In Progress", "Done", "Blocked"]),
  }).parse({ id, status });
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "Done" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function updateComplaintStatus(formData: FormData) {
  const profile = await requireAdmin();
  const id = text(formData.get("id"));
  const status = text(formData.get("status"));
  z.object({
    id: z.uuid(),
    status: z.enum(["Open", "Reviewed", "Closed"]),
  }).parse({ id, status });
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("complaints")
    .update({
      status,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/reclamations");
  revalidatePath("/reclamations");
}

export async function updateProjectStatus(formData: FormData) {
  await requireProfile();
  const id = text(formData.get("id"));
  const status = text(formData.get("status"));
  const supabase = await createServerClient();
  const updates: { status: string; completed_at?: string } = { status };
  if (status === "Completed") updates.completed_at = new Date().toISOString();
  const { error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function createEmployee(formData: FormData) {
  await requireAdmin();
  const values = {
    first_name: text(formData.get("first_name")),
    last_name: text(formData.get("last_name")),
    email: text(formData.get("email")),
    phone: nullable(formData.get("phone")),
    password: text(formData.get("password")),
  };
  z.object({
    first_name: z.string().min(2),
    last_name: z.string().min(2),
    email: z.email(),
    password: z.string().min(8),
  }).parse(values);
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: values.email,
    password: values.password,
    email_confirm: true,
    user_metadata: {
      first_name: values.first_name,
      last_name: values.last_name,
    },
  });
  if (error) throw new Error(error.message);
  await admin
    .from("profiles")
    .update({ phone: values.phone, role: "employee" })
    .eq("user_id", data.user.id);
  revalidatePath("/admin/employees");
}

export async function toggleEmployee(formData: FormData) {
  await requireAdmin();
  const id = text(formData.get("id"));
  const is_active = text(formData.get("is_active")) === "true";
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: !is_active })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/employees");
}

export async function createCommissionRule(formData: FormData) {
  await requireAdmin();
  const supabase = await createServerClient();
  const values = {
    min_projects: Number(formData.get("min_projects")),
    max_projects: numberOrNull(formData.get("max_projects")),
    commission_percentage: Number(formData.get("commission_percentage")),
    is_active: true,
  };
  const { error } = await supabase.from("commission_rules").insert(values);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/commission-rules");
}

export async function createBonusRule(formData: FormData) {
  await requireAdmin();
  const supabase = await createServerClient();
  const values = {
    name: text(formData.get("name")),
    min_project_value: Number(formData.get("min_project_value")),
    bonus_amount: Number(formData.get("bonus_amount")),
    is_active: true,
  };
  const { error } = await supabase.from("bonus_rules").insert(values);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/bonus-rules");
}

export async function updateSettings(formData: FormData) {
  await requireAdmin();
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      company_name: text(formData.get("company_name")),
      currency: text(formData.get("currency")),
      locale: text(formData.get("locale")),
    })
    .eq("id", true);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
}

export async function updateProfile(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: text(formData.get("first_name")),
      last_name: text(formData.get("last_name")),
      phone: nullable(formData.get("phone")),
      avatar_url: nullable(formData.get("avatar_url")),
    })
    .eq("id", profile.id);
  if (error) throw new Error(error.message);
  revalidatePath("/profile");
}

export async function toggleRule(formData: FormData) {
  await requireAdmin();
  const table = text(formData.get("table"));
  if (table !== "commission_rules" && table !== "bonus_rules")
    throw new Error("Table invalide");
  const id = text(formData.get("id"));
  const isActive = text(formData.get("is_active")) === "true";
  const supabase = await createServerClient();
  const { error } = await supabase
    .from(table)
    .update({ is_active: !isActive })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(
    table === "commission_rules"
      ? "/admin/commission-rules"
      : "/admin/bonus-rules",
  );
}
