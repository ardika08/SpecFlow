"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PencilLine, Key, User, AlertTriangle, Trash2, ExternalLink, Shield } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { BGPattern } from "@/components/ui/bg-pattern";
import { Navbar } from "@/components/navbar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession, signOut } from "@/lib/hooks";

// Disable static optimization for authenticated page
export const dynamic = 'force-dynamic';

type Tier = "Freemium" | "Starter" | "Pro";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  tier: Tier;
  createdAt: string;
};

type UsageStats = {
  prdUsed: number;
  prdLimit: number;
  chatUsed: number;
  chatLimit: number;
  renewDate: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const sessionData = useSession() ?? { data: null, status: "loading", update: async () => null };
  const { data: session, status, update } = sessionData;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Usage state
  const [usage, setUsage] = useState<UsageStats>({
    prdUsed: 0,
    prdLimit: 5,
    chatUsed: 0,
    chatLimit: 100,
    renewDate: "",
  });

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchProfile();
      fetchUsage();
    }
  }, [session]);

  async function fetchProfile() {
    try {
      if (!session?.user?.id) {
        throw new Error("No user session");
      }
      const response = await fetch(`/api/users?id=${session.user.id}`);
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setProfile(data.user);
      setName(data.user.name);
      setAvatar(data.user.avatar || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsage() {
    try {
      const response = await fetch("/api/users/usage");
      if (!response.ok) throw new Error("Failed to fetch usage");
      const data = await response.json();
      setUsage(data.usage);
    } catch (error) {
      console.error("Error fetching usage:", error);
    }
  }

  async function updateProfile() {
    if (!name.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }

    if (!session?.user?.id) {
      toast.error("Sesi tidak valid");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, name, avatar: avatar || null }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      await update();
      toast.success("Profil berhasil diperbarui");
      await fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Semua field password harus diisi");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Password baru tidak cocok dengan konfirmasi");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password baru minimal 8 karakter");
      return;
    }

    setSaving(true);
    try {
      // Call API endpoint directly
      const response = await fetch("/api/users/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      toast.success("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error instanceof Error ? error.message : "Gagal mengubah password");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    if (deleteConfirmText !== "HAPUS") {
      toast.error('Ketik "HAPUS" untuk mengkonfirmasi');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/users", {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete account");
      }

      toast.success("Akun berhasil dihapus");
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menghapus akun");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden px-3 py-4 text-foreground sm:px-6 sm:py-5">
        <BGPattern
          className="pointer-events-none opacity-70"
          fill="rgba(255,255,255,0.08)"
          mask="fade-center"
          size={26}
          variant="dots"
        />
        <div className="mx-auto flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            <p className="mt-4 text-muted-foreground">Memuat pengaturan...</p>
          </div>
        </div>
      </main>
    );
  }

  const tierColors = {
    Freemium: "bg-slate-500/14 text-slate-300 border-slate-500/25",
    Starter: "bg-blue-500/14 text-blue-300 border-blue-500/25",
    Pro: "bg-purple-500/14 text-purple-300 border-purple-500/25",
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-3 py-4 text-foreground sm:px-6 sm:py-5">
      <BGPattern
        className="pointer-events-none opacity-70"
        fill="rgba(255,255,255,0.08)"
        mask="fade-center"
        size={26}
        variant="dots"
      />
      <div className="mx-auto max-w-[1280px]">
        <Navbar />
      </div>

      <div className="mx-auto max-w-[760px]">
        <h1 className="mb-8 text-center text-5xl font-bold tracking-[-0.04em] text-[#f7ecda]">
          Atur workspace kamu
        </h1>

        <div className="space-y-6">
          {/* Usage Stats */}
          <Card className="border-white/10 bg-[#1b2635]/88">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-[#f7ecda]">Paket & pemakaian</h2>
                {profile && <Badge variant="secondary" className={tierColors[profile.tier]}>{profile.tier}</Badge>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Biar kebaca sejauh mana paketmu lagi kepakai bulan ini.
              </p>

              <div className="mt-6 space-y-5">
                <UsageBar label="PRD" value={usage.prdUsed} max={usage.prdLimit} />
                <UsageBar label="Chat" value={usage.chatUsed} max={usage.chatLimit} />
              </div>

              <Separator className="my-5 bg-white/10" />
              <p className="text-sm text-muted-foreground">Masih aktif sampai {usage.renewDate}</p>
            </CardContent>
          </Card>

          {/* Upgrade Plan */}
          <Card className="border-white/10 bg-[#1b2635]/88">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-[#f7ecda]">Naik level kalau udah butuh</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Kalau kerjaan makin padat, tinggal geser ke paket yang lebih longgar.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {profile && <Badge variant="secondary" className={tierColors[profile.tier]}>{profile.tier}</Badge>}
                <Button variant="outline" onClick={() => router.push("/pricing")}>
                  Cek semua paket
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card className="border-white/10 bg-[#1b2635]/88">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold text-[#f7ecda]">Profil kamu</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Data dasar akun yang lagi kepakai di workspace ini.
              </p>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0d1522] text-lg font-bold text-foreground ring-1 ring-white/10">
                  {profile?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-xl font-bold text-[#f7ecda]">{profile?.name}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>

              <Separator className="mb-6 bg-white/10" />

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#f2e6d5]">Nama</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#f2e6d5]">Email</label>
                  <Input value={profile?.email || ""} disabled className="bg-white/5 cursor-not-allowed" />
                  <p className="mt-2 text-xs text-muted-foreground">Email terkunci untuk keamanan akun.</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#f2e6d5]">Avatar URL</label>
                  <Input
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <Button
                  className="mt-2 rounded-2xl"
                  variant="accent"
                  onClick={updateProfile}
                  disabled={saving}
                >
                  <PencilLine className="mr-2 h-4 w-4" />
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Password Settings */}
          <Card className="border-white/10 bg-[#1b2635]/88">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Key className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold text-[#f7ecda]">Keamanan</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Ganti password untuk menjaga keamanan akunmu.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#f2e6d5]">Password saat ini</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#f2e6d5]">Password baru</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#f2e6d5]">Konfirmasi password baru</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                  />
                </div>
                <Button
                  className="mt-2 rounded-2xl"
                  onClick={changePassword}
                  disabled={saving}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {saving ? "Mengubah..." : "Ganti Password"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-500/30 bg-red-950/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h2 className="text-2xl font-bold text-red-300">Zona Bahaya</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
              </p>

              <Button
                variant="destructive"
                className="rounded-2xl"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Akun
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#1b2635] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#f7ecda]">Hapus Akun?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Tindakan ini akan menghapus semua data Anda termasuk proyek dan riwayat chat. Tindakan ini
              tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Ketik <span className="font-bold text-foreground">HAPUS</span> untuk mengkonfirmasi penghapusan
              akun.
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Ketik HAPUS"
              className="bg-white/5"
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={deleteAccount}
              disabled={deleteConfirmText !== "HAPUS" || saving}
            >
              {saving ? "Menghapus..." : "Ya, Hapus Akun Saya"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function UsageBar({ label, value, max }: { label: string; value: number; max: number | string }) {
  const percent = typeof max === "number" ? Math.min((value / max) * 100, 100) : 0;
  const displayMax = max === "Unlimited" ? "∞" : max;
  const displayValue = value;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-semibold text-[#f2e6d5]">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {displayValue} / {displayMax}
        </span>
      </div>
      {max !== "Unlimited" ? (
        <Progress value={percent} className="h-2" />
      ) : (
        <div className="h-2 rounded-full bg-emerald-500/30" />
      )}
    </div>
  );
}
