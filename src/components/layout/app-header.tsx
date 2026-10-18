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
import { ThemeToggle } from "@/components/layout/theme-toggle";
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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/75 md:px-6 lg:px-8">
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
        <SheetContent side="left" className="w-72 border-0 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <AppSidebar role={profile.role} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <form
        action="/search"
        role="search"
        className="relative hidden w-full max-w-md md:block"
      >
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground"
        />
        <Input
          name="q"
          type="search"
          aria-label="Rechercher"
          className="h-10 border-transparent bg-muted pl-9 focus-visible:bg-card"
          placeholder="Rechercher un client, projet ou employé…"
        />
      </form>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative size-10 text-muted-foreground"
                aria-label={
                  unreadCount
                    ? `Notifications, ${unreadCount} non lue(s)`
                    : "Notifications"
                }
              />
            }
          >
            <Bell className="size-4.5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-card">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[min(24rem,calc(100vw-2rem))] p-0"
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Notifications</p>
                <p className="text-xs text-muted-foreground">
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
                    className="rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={
                          notification.read_at
                            ? "mt-1.5 size-2 shrink-0 rounded-full bg-border"
                            : "mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {notification.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[11px] text-subtle-foreground">
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
                            aria-label={`Marquer « ${notification.title} » comme lue`}
                          >
                            Lu
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Aucune notification.
                </p>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="h-11 gap-2.5 px-2"
                aria-label="Menu du compte"
              />
            }
          >
            <Avatar className="size-8">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                {initials(profile.first_name, profile.last_name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-none">
                {profile.first_name} {profile.last_name}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {profile.role === "admin" ? "Administrateur" : "Employé"}
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className="hidden size-3.5 text-subtle-foreground sm:block"
            />
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
                  <button type="submit" className="w-full text-destructive" />
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
