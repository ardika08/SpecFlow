"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  Menu,
  Settings,
  CreditCard,
  HelpCircle,
  MoonStar,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { useSession, signOut } from "@/lib/hooks";

type Tier = "Freemium" | "Starter" | "Pro";

interface UserData {
  name: string;
  email: string;
  avatar: string;
  tier: string;
  chatCredits: string;
  prdUsage: number;
  prdLimit: number;
}

function getTierLimits(tier: string) {
  if (tier === "Pro") return { prd: Infinity, chat: Infinity };
  if (tier === "Starter") return { prd: 5, chat: 100 };
  return { prd: 1, chat: 0 };
}

function getAvatar(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function UserMenuButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Settings;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-foreground transition hover:bg-white/5"
      onClick={onClick}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </button>
  );
}

export function Navbar() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (!session) {
        setUserData(null);
        return;
      }

      try {
        const [sessionRes, usageRes] = await Promise.all([
          fetch("/api/auth/get-session", { credentials: "include" }),
          fetch("/api/users/usage", { credentials: "include" }),
        ]);

        let tier = "Freemium";
        let name = "User";
        let email = "";

        if (sessionRes.ok) {
          const data = await sessionRes.json();
          tier = data?.user?.tier || "Freemium";
          name = data?.user?.name || "User";
          email = data?.user?.email || "";
        }

        let prdUsage = 0;
        let prdLimit = getTierLimits(tier).prd;
        let chatUsage = 0;
        let chatLimit = getTierLimits(tier).chat;

        if (usageRes.ok) {
          const data = await usageRes.json();
          prdUsage = data?.usage?.prdUsed ?? 0;
          prdLimit = data?.usage?.prdLimit ?? prdLimit;
          chatUsage = data?.usage?.chatUsed ?? 0;
          chatLimit = data?.usage?.chatLimit ?? chatLimit;
        }

        const chatCredits =
          chatLimit === Infinity
            ? "Unlimited"
            : `${Math.max(chatLimit - chatUsage, 0)} chat`;

        setUserData({
          name,
          email,
          avatar: getAvatar(name),
          tier,
          chatCredits,
          prdUsage,
          prdLimit: prdLimit === Infinity ? 999 : prdLimit,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    fetchUserData();
  }, [session]);

  async function handleSignOut() {
    await signOut();
    toast.success("Berhasil logout");
    router.push("/");
  }

  return (
    <header className="relative z-[90] rounded-full border border-white/10 bg-[#172231]/80 px-4 py-3 shadow-soft backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-3"
            onClick={() => router.push("/")}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary ring-1 ring-primary/20">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold tracking-[-0.04em] text-[#f7ecda]">
              SpecFlow
            </span>
          </button>
        </div>

        {/* Right: User info and actions */}
        <div className="flex items-center gap-2">
          {isPending ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
          ) : session ? (
            <>
              {/* PRD usage badge */}
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {userData?.prdUsage ?? 0}/{userData?.prdLimit ?? 1}
              </Badge>

              {/* Dashboard button */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex"
                onClick={() => router.push("/dashboard")}
              >
                <LayoutDashboard className="h-4 w-4" />
              </Button>

              {/* Notification bell */}
              <NotificationProvider />

              {/* Upgrade button */}
              <Button
                variant="accent"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => router.push("/pricing")}
              >
                Upgrade
              </Button>

              {/* User menu button */}
              <div className="relative z-[95]">
                <button
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-2 pr-3 py-1.5 transition hover:bg-white/10"
                  onClick={() => setUserMenuOpen((c) => !c)}
                >
                  <span className="hidden lg:inline-flex rounded-full bg-accent px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-accent-foreground">
                    {userData?.tier}
                  </span>
                  <span className="hidden md:inline-flex rounded-full bg-primary/15 px-2 py-1 text-[10px] font-bold text-primary">
                    + {userData?.chatCredits}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0d1522] text-sm font-bold text-foreground ring-1 ring-white/10">
                    {userData?.avatar}
                  </span>
                </button>

                {userMenuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+12px)] z-[120] w-72 overflow-hidden rounded-[22px] border border-white/10 bg-[#222c3d] p-0 shadow-[0_24px_80px_rgba(4,10,20,0.55)] backdrop-blur-xl">
                    <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0d1522] text-base font-bold text-foreground">
                        {userData?.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold text-foreground">
                          {userData?.name}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {userData?.email}
                        </p>
                      </div>
                    </div>

                    <div className="px-2 py-2">
                      <UserMenuButton
                        icon={Settings}
                        label="Pengaturan"
                        onClick={() => {
                          setUserMenuOpen(false);
                          router.push("/settings");
                        }}
                      />
                      <UserMenuButton
                        icon={CreditCard}
                        label="Lihat Paket"
                        onClick={() => {
                          setUserMenuOpen(false);
                          router.push("/pricing");
                        }}
                      />
                      <UserMenuButton
                        icon={HelpCircle}
                        label="Butuh Bantuan?"
                        onClick={() =>
                          toast.message(
                            "Pusat bantuan nyusul, tapi flow utamanya udah aman."
                          )
                        }
                      />
                      <UserMenuButton
                        icon={MoonStar}
                        label="Mode Terang"
                        onClick={() =>
                          toast.message("Mode terang belum dibuka di versi ini.")
                        }
                      />
                    </div>

                    <div className="border-t border-white/10 p-2">
                      <UserMenuButton
                        icon={LogOut}
                        label="Keluar Dulu"
                        onClick={handleSignOut}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => router.push("/register")}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Daftar
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={() => router.push("/login")}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Masuk
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
