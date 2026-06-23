"use client";

import { useState } from "react";
import { Sparkles, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type AuthMode = "login" | "register";

interface AuthFormProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSuccess?: () => void;
}

export function AuthForm({ mode, onModeChange }: AuthFormProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);

    try {
      console.log("Memulai Google Auth untuk:", mode);

      // Better Auth v1 endpoint untuk social sign-in
      // Redirect langsung ke Google OAuth URL
      const params = new URLSearchParams({
        provider: "google",
        callbackURL: "/dashboard",
      });

      // Redirect ke endpoint Better Auth untuk sign-in dengan Google
      window.location.href = `/api/auth/sign-in/social?${params.toString()}`;

      // Loading akan tetap true karena redirect akan terjadi
    } catch (error) {
      console.error("Google Auth error:", error);
      toast.error(error instanceof Error ? error.message : "Gagal login dengan Google");
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

          {/* Google OAuth Button */}
          <Button
            className="h-14 w-full rounded-2xl text-base bg-white text-gray-900 hover:bg-gray-100"
            type="button"
            disabled={loading}
            onClick={handleGoogleAuth}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? (
              "Memproses..."
            ) : mode === "login" ? (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Masuk dengan Google
              </>
            ) : (
              "Daftar dengan Google"
            )}
          </Button>

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
