"use client";

import { useState } from "react";
import {
  Bell,
  ChevronDown,
  CheckCheck,
  LogOut,
  Menu,
  Search,
  UserRound,
} from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/(dashboard)/actions";
import type { Notification, Profile } from "@/lib/types";
import { formatDate, initials } from "@/lib/format";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function AppHeader({
  profile,
  notifications,
}: {
  profile: Profile;
  notifications: Notification[];
}) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((item) => !item.read_at).length;
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-white/95 px-4 backdrop-blur md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
      >
        <Menu />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <AppSidebar role={profile.role} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <form
        action="/search"
        className="relative hidden w-full max-w-xl md:block"
      >
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          name="q"
          className="h-9 bg-slate-50 pl-9"
          placeholder="Rechercher un client, projet ou employé…"
        />
      </form>
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative text-slate-500"
                aria-label="Notifications"
              />
            }
          >
            <Bell className="size-4.5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Notifications</p>
                <p className="text-xs text-slate-500">
                  {unreadCount} non lue(s)
                </p>
              </div>
              {unreadCount > 0 && (
                <form action={markAllNotificationsRead}>
                  <Button type="submit" size="sm" variant="ghost">
                    <CheckCheck />
                    Tout lu
                  </Button>
                </form>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {notifications.length ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-md px-3 py-2 hover:bg-slate-50"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={
                          notification.read_at
                            ? "mt-1.5 size-2 rounded-full bg-slate-300"
                            : "mt-1.5 size-2 rounded-full bg-red-500"
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {notification.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {formatDate(notification.created_at, true)}
                        </p>
                      </div>
                      {!notification.read_at && (
                        <form action={markNotificationRead}>
                          <input
                            type="hidden"
                            name="id"
                            value={notification.id}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                          >
                            Lu
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="px-4 py-10 text-center text-sm text-slate-500">
                  Aucune notification.
                </p>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="h-11 gap-2 px-2" />}
          >
              <Avatar className="size-8">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="bg-blue-100 text-xs font-semibold text-blue-700">
                  {initials(profile.first_name, profile.last_name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium leading-none">
                  {profile.first_name} {profile.last_name}
                </span>
                <span className="mt-1 block text-[11px] capitalize text-slate-500">
                  {profile.role === "admin" ? "Administrateur" : "Employé"}
                </span>
              </span>
              <ChevronDown className="hidden size-3.5 text-slate-400 sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuItem render={<a href="/profile" />}>
                <UserRound /> Mon profil
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <form action={signOut}>
              <DropdownMenuItem
                nativeButton
                render={
                  <button type="submit" className="w-full text-red-600" />
                }
              >
                <LogOut /> Se déconnecter
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
