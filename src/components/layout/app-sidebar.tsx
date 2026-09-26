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
  MessageSquareText,
  MessageSquareWarning,
  Settings,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/types";

const employeeNav = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Contact },
  { href: "/projects", label: "Projets", icon: BriefcaseBusiness },
  { href: "/tasks", label: "Taches", icon: ListChecks },
  { href: "/interactions", label: "Interactions", icon: MessageSquareText },
  { href: "/reclamations", label: "Reclamations", icon: MessageSquareWarning },
  { href: "/earnings", label: "Mes revenus", icon: BadgeDollarSign },
  { href: "/profile", label: "Mon profil", icon: Users },
];

const adminNav = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Contact },
  { href: "/projects", label: "Projets", icon: BriefcaseBusiness },
  { href: "/tasks", label: "Taches", icon: ListChecks },
  { href: "/interactions", label: "Interactions", icon: MessageSquareText },
  { href: "/admin/reclamations", label: "Reclamations", icon: MessageSquareWarning },
  { href: "/admin/employees", label: "Employés", icon: Users },
  { href: "/admin/realized-projects", label: "Projets realises", icon: Images },
  {
    href: "/admin/commission-rules",
    label: "Commissions",
    icon: SlidersHorizontal,
  },
  { href: "/admin/bonus-rules", label: "Bonus", icon: Gift },
  { href: "/admin/reports", label: "Rapports", icon: BarChart3 },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

export function AppSidebar({
  role,
  onNavigate,
}: {
  role: AppRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const navigation = role === "admin" ? adminNav : employeeNav;
  return (
    <div className="flex h-full flex-col bg-white">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex h-16 items-center gap-3 border-b px-5"
      >
        <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/30">
          <Building2 className="size-5" />
        </span>
        <div>
          <p className="font-semibold leading-none">Gestion clients Tunisie</p>
          <p className="mt-1 text-[11px] text-slate-500">Gestion commerciale</p>
        </div>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">
          Navigation
        </p>
        {navigation.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
              )}
            >
              <Icon className={cn("size-4.5", active && "text-blue-600")} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4 text-xs text-slate-500">
        <p className="font-medium text-slate-700">Espace sécurisé</p>
        <p className="mt-1">Accès selon votre rôle</p>
      </div>
    </div>
  );
}
