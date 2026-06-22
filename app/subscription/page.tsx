"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Sparkles,
  Crown,
  Check,
  AlertCircle,
  User,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";
import { BGPattern } from "@/components/ui/bg-pattern";
import { useSession } from "@/lib/hooks";
import { SUBSCRIPTION_PLANS } from "@/lib/mayar/client";

type Tier = "Freemium" | "Starter" | "Pro";

type Plan = {
  id: string;
  name: string;
  tier: Tier;
  price: number;
  currency: string;
  interval: "monthly" | "yearly";
  description: string;
  features: string[];
};

type SubscriptionStatus = "success" | "pending" | "failed" | "cancelled" | null;

const FREEMIUM_PLAN: Plan = {
  id: "freemium",
  name: "Freemium",
  tier: "Freemium",
  price: 0,
  currency: "IDR",
  interval: "monthly",
  description: "Pas buat ngetes flow awal",
  features: [
    "1 PRD per bulan",
    "Akses eksplorasi ide",
    "Model standar",
    "Tanpa export lanjutan",
  ],
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [currentTier, setCurrentTier] = useState<Tier>("Freemium");
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<Date | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [statusChecked, setStatusChecked] = useState(false);

  const status = searchParams.get("status") as SubscriptionStatus;
  const planParam = searchParams.get("plan");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!session && !isPending) {
      router.push("/login?redirect=/subscription");
    }
  }, [session, isPending, router]);

  // Fetch current tier, phone, dan currentPeriodEnd dari server
  useEffect(() => {
    async function fetchCurrentTier() {
      try {
        const response = await fetch("/api/auth/get-session", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          const userTier = data?.user?.tier || "Freemium";
          setCurrentTier(userTier as Tier);
          setPhone(data?.user?.phone || "");
          // Parse currentPeriodEnd jika ada
          if (data?.user?.currentPeriodEnd) {
            setCurrentPeriodEnd(new Date(data.user.currentPeriodEnd));
          } else {
            setCurrentPeriodEnd(null);
          }
        }
      } catch (error) {
        console.error("Error fetching current tier:", error);
      }
    }

    if (session) {
      fetchCurrentTier();
    }
  }, [session]);

  // Handle payment redirect status
  useEffect(() => {
    if (!status) return;

    // Give a moment for the webhook to potentially arrive first
    const timer = setTimeout(() => {
      if (status === "success") {
        // Refresh session to get updated tier
        refreshSession();
        toast.success("Pembayaran berhasil!", {
          description: "Langganan Anda telah diaktifkan.",
        });
      } else if (status === "pending") {
        toast.info("Pembayaran sedang diproses", {
          description: "Mohon tunggu konfirmasi dari penyedia pembayaran.",
        });
      } else if (status === "failed") {
        toast.error("Pembayaran gagal", {
          description: "Terjadi kesalahan saat memproses pembayaran.",
        });
      } else if (status === "cancelled") {
        toast.info("Pembayaran dibatalkan", {
          description: "Anda dapat mencoba lagi kapan saja.",
        });
      }
      setStatusChecked(true);
    }, 1500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function refreshSession() {
    try {
      // Re-fetch user data to get updated tier
      const res = await fetch("/api/auth/get-session", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.user?.tier) {
          setCurrentTier(data.user.tier as Tier);
        }
      }
    } catch (e) {
      console.error("Failed to refresh session:", e);
    }
  }

  async function handleSelectPlan(plan: Plan) {
    if (!session) {
      router.push("/login?redirect=/subscription");
      return;
    }

    // Freemium - just go home
    if (plan.tier === "Freemium") {
      router.push("/");
      return;
    }

    // Check if user already has this tier
    if (currentTier === plan.tier) {
      toast.info(`Anda sudah berlangganan paket ${plan.name}`);
      return;
    }

    setSelectedPlan(plan);
    setPaymentUrl(null);
    setPaymentDialogOpen(true);
  }

  async function confirmPayment() {
    if (!selectedPlan) return;

    // Validasi nomor WA
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Nomor WhatsApp tidak valid. Minimal 10 digit.");
      return;
    }

    setCreatingPayment(true);
    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.id, phone: cleanPhone }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create payment");
      }

      const data = await response.json();

      if (data.success && data.payment?.payment_url) {
        setPaymentUrl(data.payment.payment_url);
      } else {
        throw new Error("Payment URL not received");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal membuat pembayaran"
      );
    } finally {
      setCreatingPayment(false);
    }
  }

  function redirectToPayment() {
    if (paymentUrl) {
      window.location.href = paymentUrl;
    }
  }

  const allPlans: Plan[] = [
    FREEMIUM_PLAN,
    ...SUBSCRIPTION_PLANS.map((p) => ({ ...p, interval: p.interval as "monthly" })),
  ];

  // Loading state
  if (isPending || (!session && !statusChecked)) {
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
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">
              Memuat langganan...
            </p>
          </div>
        </div>
      </main>
    );
  }

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

      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 mt-6">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary ring-1 ring-primary/20">
              <Crown className="h-5 w-5" />
            </div>
            <h1 className="text-4xl font-bold tracking-[-0.05em] text-[#f7ecda] sm:text-5xl md:text-6xl">
              Langganan
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
              Kelola paket berlangganan Anda dan nikmati fitur lengkap SpecFlow.
            </p>
          </div>
        </div>

        {/* Status Banner */}
        {status === "success" && (
          <StatusBanner
            variant="success"
            title="Pembayaran Berhasil!"
            description={`Langganan paket ${
              planParam || "baru"
            } Anda telah diaktifkan. Selamat menikmati fitur premium SpecFlow!`}
          />
        )}
        {status === "pending" && (
          <StatusBanner
            variant="pending"
            title="Pembayaran Sedang Diproses"
            description="Mohon tunggu konfirmasi dari penyedia pembayaran. Halaman ini akan diperbarui otomatis saat pembayaran dikonfirmasi."
          />
        )}
        {status === "failed" && (
          <StatusBanner
            variant="error"
            title="Pembayaran Gagal"
            description="Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi atau hubungi support jika masalah berlanjut."
          />
        )}
        {status === "cancelled" && (
          <StatusBanner
            variant="info"
            title="Pembayaran Dibatalkan"
            description="Anda dapat mencoba berlangganan lagi kapan saja."
          />
        )}

        {/* Current Tier Card */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>Paket Anda Saat Ini</CardDescription>
                <CardTitle className="mt-1 flex items-center gap-2 text-2xl">
                  <Crown className="h-6 w-6 text-primary" />
                  {currentTier}
                </CardTitle>
                {currentPeriodEnd && currentTier !== "Freemium" && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Berlangganan hingga{" "}
                    {new Date(currentPeriodEnd).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              <Badge variant="accent" className="text-sm">
                Aktif
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TierBenefit
                label="PRD / bulan"
                value={
                  currentTier === "Pro"
                    ? "Unlimited"
                    : currentTier === "Starter"
                    ? "5"
                    : "1"
                }
              />
              <TierBenefit
                label="Chat AI / bulan"
                value={
                  currentTier === "Pro"
                    ? "Unlimited"
                    : currentTier === "Starter"
                    ? "100"
                    : "Terbatas"
                }
              />
              <TierBenefit
                label="Model AI"
                value={
                  currentTier === "Freemium"
                    ? "Standar"
                    : "Claude 3.5 + GPT-4o"
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="mb-4 text-center text-xl font-semibold text-[#f7ecda]">
            {currentTier === "Freemium"
              ? "Upgrade paket Anda"
              : "Ubah paket Anda"}
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {allPlans.map((plan) => (
              <SubscriptionCard
                key={plan.id}
                plan={plan}
                currentTier={currentTier}
                processing={processing}
                onSelect={() => handleSelectPlan(plan)}
              />
            ))}
          </div>
        </div>

        {/* FAQ / Help */}
        <Card className="border-muted/40 bg-muted/5">
          <CardHeader>
            <CardTitle className="text-lg">Butuh bantuan?</CardTitle>
            <CardDescription>
              Pertanyaan seputar langganan dan pembayaran
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">
                Kapan langganan saya aktif?
              </span>{" "}
              Langganan aktif otomatis setelah pembayaran berhasil dikonfirmasi
              oleh sistem kami (biasanya instan).
            </p>
            <p>
              <span className="font-medium text-foreground">
                Metode pembayaran apa saja yang didukung?
              </span>{" "}
              Kami mendukung transfer bank, e-wallet, virtual account, dan
              retail melalui Mayar.id.
            </p>
            <p>
              <span className="font-medium text-foreground">
                Bagaimana cara membatalkan langganan?
              </span>{" "}
              Langganan berlaku selama 1 bulan dan tidak diperpanjang otomatis.
              Anda dapat memilih paket lain kapan saja.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Redirect Dialog */}
      {paymentDialogOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Lanjutkan Pembayaran
              </CardTitle>
              <CardDescription>
                Data akun akan otomatis terisi di halaman pembayaran Mayar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan summary */}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="font-semibold text-foreground">{selectedPlan.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedPlan.description}</p>
                </div>
                <p className="text-lg font-bold text-primary">
                  {selectedPlan.price === 0 ? "Gratis" : formatPrice(selectedPlan.price)}
                </p>
              </div>

              {/* Customer info (read-only) */}
              <div className="space-y-2 rounded-lg border border-white/10 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[#f2e6d5]">{session?.user?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[#f2e6d5]">{session?.user?.email}</span>
                </div>
              </div>

              {/* WhatsApp input */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#f2e6d5]">
                  Nomor WhatsApp
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="bg-white/5"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Nomor ini akan terisi otomatis di halaman pembayaran Mayar.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setPaymentDialogOpen(false);
                    setPaymentUrl(null);
                  }}
                >
                  Batal
                </Button>
                {paymentUrl ? (
                  <Button
                    variant="accent"
                    className="flex-1"
                    onClick={redirectToPayment}
                  >
                    Bayar Sekarang
                  </Button>
                ) : (
                  <Button
                    variant="accent"
                    className="flex-1"
                    onClick={confirmPayment}
                    disabled={creatingPayment}
                  >
                    {creatingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      "Lanjut ke Pembayaran"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function StatusBanner({
  variant,
  title,
  description,
}: {
  variant: "success" | "error" | "pending" | "info";
  title: string;
  description: string;
}) {
  const config = {
    success: {
      icon: CheckCircle2,
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      iconColor: "text-emerald-400",
    },
    error: {
      icon: XCircle,
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      iconColor: "text-red-400",
    },
    pending: {
      icon: Clock,
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      iconColor: "text-amber-400",
    },
    info: {
      icon: AlertCircle,
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      iconColor: "text-blue-400",
    },
  }[variant];

  const Icon = config.icon;

  return (
    <div
      className={`mb-8 flex items-start gap-4 rounded-2xl border ${config.border} ${config.bg} p-5`}
    >
      <Icon className={`mt-0.5 h-6 w-6 shrink-0 ${config.iconColor}`} />
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function TierBenefit({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/30 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SubscriptionCard({
  plan,
  currentTier,
  processing,
  onSelect,
}: {
  plan: Plan;
  currentTier: Tier;
  processing: string | null;
  onSelect: () => void;
}) {
  const isCurrentTier = currentTier === plan.tier;
  const isProcessing = processing === plan.id;
  const isUpgrade =
    plan.tier !== "Freemium" && currentTier !== plan.tier;

  return (
    <Card
      className={`relative flex flex-col ${
        isCurrentTier
          ? "border-primary/40 ring-1 ring-primary/20"
          : ""
      }`}
    >
      {isCurrentTier && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="accent" className="shadow">
            Paket Saat Ini
          </Badge>
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        <div className="mt-3">
          <span className="text-3xl font-bold text-[#f7ecda]">
            {plan.price === 0 ? "Gratis" : formatPrice(plan.price)}
          </span>
          {plan.price > 0 && (
            <span className="ml-1 text-sm text-muted-foreground">
              /{plan.interval === "monthly" ? "bulan" : "tahun"}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <Separator className="mb-4" />

        <ul className="mb-6 flex-1 space-y-3">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span className="text-[#f2e6d5]">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full rounded-2xl"
          variant={isCurrentTier ? "outline" : "accent"}
          onClick={onSelect}
          disabled={isCurrentTier || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memproses...
            </>
          ) : isCurrentTier ? (
            "Paket Saat Ini"
          ) : plan.price === 0 ? (
            "Mulai Gratis"
          ) : isUpgrade ? (
            `Pilih ${plan.name}`
          ) : (
            `Pilih ${plan.name}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Default export wrapped in Suspense for useSearchParams             */
/* ------------------------------------------------------------------ */

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
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
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Memuat langganan...</p>
            </div>
          </div>
        </main>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}
