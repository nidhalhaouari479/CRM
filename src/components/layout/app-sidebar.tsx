"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Contact,
  Gift,
  Images,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  MessageSquareText,
  MessageSquareWarning,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/types";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavSection = { title: string; items: NavItem[] };

const workspace: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Contact },
  { href: "/projects", label: "Projets", icon: BriefcaseBusiness },
  { href: "/tasks", label: "Tâches", icon: ListChecks },
  { href: "/interactions", label: "Interactions", icon: MessageSquareText },
];

const employeeNav: NavSection[] = [
  { title: "Espace de travail", items: workspace },
  {
    title: "Mon espace",
    items: [
      {
        href: "/reclamations",
        label: "Réclamations",
        icon: MessageSquareWarning,
      },
      { href: "/earnings", label: "Mes revenus", icon: BadgeDollarSign },
      { href: "/profile", label: "Mon profil", icon: UserRound },
    ],
  },
];

const adminNav: NavSection[] = [
  { title: "Espace de travail", items: workspace },
  {
    title: "Administration",
    items: [
      {
        href: "/admin/reclamations",
        label: "Réclamations",
        icon: MessageSquareWarning,
      },
      { href: "/admin/employees", label: "Employés", icon: Users },
      {
        href: "/admin/realized-projects",
        label: "Projets réalisés",
        icon: Images,
      },
      { href: "/admin/reports", label: "Rapports", icon: BarChart3 },
    ],
  },
  {
    title: "Configuration",
    items: [
      {
        href: "/admin/commission-rules",
        label: "Commissions",
        icon: SlidersHorizontal,
      },
      { href: "/admin/bonus-rules", label: "Bonus", icon: Gift },
      { href: "/admin/settings", label: "Paramètres", icon: Settings },
    ],
  },
];

export function AppSidebar({
  role,
  onNavigate,
}: {
  role: AppRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const sections = role === "admin" ? adminNav : employeeNav;
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-5 focus-visible:outline-sidebar-ring"
      >
        <span className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Building2 className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold leading-tight text-white">
            Gestion clients
          </span>
          <span className="mt-0.5 block text-xs text-sidebar-muted">
            Tunisie · CRM
          </span>
        </span>
      </Link>
      <nav
        aria-label="Navigation principale"
        className="flex-1 space-y-6 overflow-y-auto px-3 py-5"
      >
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[.14em] text-sidebar-muted">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href ||
                  (href !== "/dashboard" && pathname.startsWith(`${href}/`));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-sidebar-ring",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-sidebar-primary"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          "size-4.5 shrink-0",
                          active
                            ? "text-sidebar-primary"
                            : "text-sidebar-muted",
                        )}
                      />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="flex items-center gap-3 border-t border-sidebar-border px-5 py-4 text-xs">
        <ShieldCheck
          className="size-4 shrink-0 text-sidebar-primary"
          aria-hidden="true"
        />
        <p className="text-sidebar-muted">
          {role === "admin" ? "Accès administrateur" : "Accès employé"}
        </p>
      </div>
    </div>
  );
}
