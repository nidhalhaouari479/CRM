export type AppRole = "admin" | "employee";

export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: AppRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  client_number: number;
  client_code: string;
  created_by: string | null;
  company_name: string;
  contact_name: string | null;
  contact_position: string | null;
  business_sector: string | null;
  business_sector_other: string | null;
  phone: string;
  email: string | null;
  website: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  address: string | null;
  city: string | null;
  country: string;
  client_type: "Individual" | "Company";
  service_type: string;
  service_type_other: string | null;
  estimated_budget: number | null;
  notes: string | null;
  sales_status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "first_name" | "last_name"> | null;
}

export interface Project {
  id: string;
  client_id: string;
  employee_id: string;
  name: string;
  service_type: string;
  service_type_other: string | null;
  description: string | null;
  estimated_price: number | null;
  final_price: number;
  currency: string;
  status: string;
  payment_status: string;
  payment_amount: number;
  remaining_amount: number;
  payment_date: string | null;
  start_date: string | null;
  expected_end_date: string | null;
  completed_at: string | null;
  notes: string | null;
  commission_rate_applied: number | null;
  commission_amount: number;
  bonus_amount: number;
  commission_locked_at: string | null;
  created_at: string;
  updated_at: string;
  clients?: Pick<Client, "company_name" | "contact_name"> | null;
  profiles?: Pick<Profile, "first_name" | "last_name"> | null;
}

export interface Interaction {
  id: string;
  client_id: string;
  employee_id: string;
  type: string;
  date: string;
  duration_minutes: number | null;
  objective: string;
  result: string;
  conclusion: string;
  interest_score: number;
  next_action: string | null;
  created_at: string;
  clients?: Pick<Client, "company_name" | "contact_name"> | null;
  profiles?: Pick<Profile, "first_name" | "last_name"> | null;
}

export interface ClientFinancialSummary {
  client_id: string;
  project_count: number;
  project_amount: number;
  paid_amount: number;
  unpaid_amount: number;
}

export interface Payment {
  id: string;
  project_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_date: string;
  reference: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  employee_id: string;
  subject: string;
  details: string;
  status: "Open" | "Reviewed" | "Closed";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "first_name" | "last_name" | "email"> | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "Todo" | "In Progress" | "Done" | "Blocked";
  priority: "Low" | "Medium" | "High";
  due_date: string | null;
  client_id: string | null;
  project_id: string | null;
  assigned_to: string;
  created_by: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  clients?: Pick<Client, "company_name" | "contact_name"> | null;
  projects?: Pick<Project, "name"> | null;
  assignee?: Pick<Profile, "first_name" | "last_name" | "email"> | null;
  creator?: Pick<Profile, "first_name" | "last_name" | "email"> | null;
}

export interface LoginSession {
  id: string;
  profile_id: string;
  login_at: string;
  logout_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  kind: string;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
}

export const SERVICES = [
  "Website / Showcase Website",
  "E-commerce",
  "ERP",
  "CRM",
  "SaaS",
  "Mobile Application",
  "AI Solution",
  "AI Chatbot",
  "Automation",
  "Custom Software",
  "Other",
] as const;

export const BUSINESS_SECTORS = [
  "Agriculture",
  "Commerce",
  "Construction / Immobilier",
  "Éducation",
  "Énergie",
  "Finance / Assurance",
  "Hôtellerie / Tourisme",
  "Industrie",
  "Santé",
  "Services professionnels",
  "Technologie",
  "Transport / Logistique",
  "Autre",
] as const;
