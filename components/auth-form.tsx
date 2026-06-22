"use client";

import { useState } from "react";
import { Sparkles, Mail, Lock, User, ArrowRight, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient, useSession } from "@/lib/hooks";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "register";

interface AuthFormProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSuccess?: () => void;
}

export function AuthForm({ mode, onModeChange, onSuccess }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const { refetch: refetchSession } = useSession();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "register") {
        // Validation
        if (!formData.name.trim()) {
          toast.error("Nama wajib diisi");
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          toast.error("Password minimal 6 karakter");
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error("Password tidak cocok");
          setLoading(false);
          return;
        }

        // Register using better-auth client
        await authClient.signUp.email({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });

        toast.success("Akun berhasil dibuat! Silakan login.");
        onModeChange("login");
      } else {
        // Login using better-auth client
        const result = await authClient.signIn.email({
          email: formData.email,
          password: formData.password,
          callbackURL: "/", // Redirect to this URL after successful login
        });

        console.log("Login result:", result);

        if (result.error) {
          toast.error(result.error.message || "Login gagal");
          setLoading(false);
          return;
        }

        toast.success("Login berhasil!");

        // Refetch session to ensure it's loaded
        await refetchSession();

        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-white/10 bg-[#1b2635]/82">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary ring-1 ring-primary/20">
                <Sparkles className="h-7 w-7" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-[#f7ecda]">
              {mode === "login" ? "Selamat Datang Kembali" : "Mulai Perjalananmu"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {mode === "login"
                ? "Masuk untuk melanjutkan racikan ide PRD-mu"
                : "Daftar gratis dan mulai buat PRD dalam hitungan menit"}
            </p>
          </div>

          {/* Mode Toggle */}
          <Tabs className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                active={mode === "login"}
                onClick={() => onModeChange("login")}
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                active={mode === "register"}
                onClick={() => onModeChange("register")}
              >
                Daftar
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#f2e6d5]">Nama</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-12 rounded-2xl bg-white/5 pl-11"
                    placeholder="Nama lengkap"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required={mode === "register"}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#f2e6d5]">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-12 rounded-2xl bg-white/5 pl-11"
                  placeholder="nama@email.com"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#f2e6d5]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-12 rounded-2xl bg-white/5 pl-11"
                  placeholder="••••••••"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#f2e6d5]">Konfirmasi Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-12 rounded-2xl bg-white/5 pl-11"
                    placeholder="••••••••"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required={mode === "register"}
                  />
                </div>
              </div>
            )}

            <Button
              className="h-14 w-full rounded-2xl text-base"
              variant="accent"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                "Memproses..."
              ) : mode === "login" ? (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Masuk
                </>
              ) : (
                <>
                  Daftar Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Footer Info */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Belum punya akun?{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary hover:underline"
                    onClick={() => onModeChange("register")}
                  >
                    Daftar sekarang
                  </button>
                </>
              ) : (
                <>
                  Sudah punya akun?{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary hover:underline"
                    onClick={() => onModeChange("login")}
                  >
                    Login
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Tier Info */}
          <div className="mt-4 flex justify-center gap-2">
            <Badge variant="secondary" className="text-xs">Freemium</Badge>
            <Badge variant="outline" className="border-accent/30 text-accent text-xs">
              Upgrade kapan saja
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
