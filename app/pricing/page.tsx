"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles, User, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";
import { BGPattern } from "@/components/ui/bg-pattern";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "@/lib/hooks";

// Disable static optimization for authenticated page
export const dynamic = 'force-dynamic';

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

export default function PricingPage() {
  const router = useRouter();
  const sessionData = useSession() ?? { data: null, status: "loading", update: async () => null };
  const { data: session, status } = sessionData;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<Tier>("Freemium");
  const [phone, setPhone] = useState("");
  const [creatingPayment, setCreatingPayment] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/pricing");
    }
  }, [status, router]);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    // Selalu fetch tier terbaru dari server (tidak mengandalkan cache session)
    async function fetchCurrentTier() {
      try {
        const response = await fetch("/api/auth/get-session", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          const userTier = data?.user?.tier || "Freemium";
          setCurrentTier(userTier as Tier);
        }
      } catch (error) {
        console.error("Error fetching current tier:", error);
      }
    }

    if (session) {
      fetchCurrentTier();
      fetchUserPhone();
    }
  }, [session]);

  async function fetchUserPhone() {
    try {
      const response = await fetch("/api/auth/get-session", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setPhone(data?.user?.phone || "");
      }
    } catch (error) {
      console.error("Error fetching phone:", error);
    }
  }

  async function fetchPlans() {
    try {
      const response = await fetch("/api/payment");
      if (!response.ok) throw new Error("Failed to fetch plans");
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
      // Use fallback plans
      setPlans([
        {
          id: "starter-monthly",
          name: "Starter",
          tier: "Starter",
          price: 49000,
          currency: "IDR",
          interval: "monthly",
          description: "Cocok buat yang udah pengen hasil lebih mateng",
          features: [
            "5 PRD per bulan",
            "100 chat revisi via AI Agent",
            "Akses model high-end",
            "Export lengkap",
            "Riwayat project permanen",
          ],
        },
        {
          id: "pro-monthly",
          name: "Pro",
          tier: "Pro",
          price: 125000,
          currency: "IDR",
          interval: "monthly",
          description: "Buat yang kerjanya sat-set terus",
          features: [
            "Unlimited PRD & Chat",
            "Prioritas proses",
            "Support prioritas",
            "Semua fitur Starter",
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectPlan(plan: Plan) {
    if (!session) {
      router.push("/login?redirect=/pricing");
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
      toast.error(error instanceof Error ? error.message : "Gagal membuat pembayaran");
    } finally {
      setCreatingPayment(false);
    }
  }

  function redirectToPayment() {
    if (paymentUrl) {
      window.location.href = paymentUrl;
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  }

  const freemiumPlan = {
    id: "freemium",
    name: "Freemium",
    tier: "Freemium" as Tier,
    price: 0,
    currency: "IDR",
    interval: "monthly" as const,
    description: "Pas buat ngetes flow awal",
    features: [
      "1 PRD per bulan",
      "Akses eksplorasi ide",
      "Model standar",
      "Tanpa export lanjutan",
    ],
  };

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
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Memuat paket berlangganan...</p>
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

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 mt-6">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary ring-1 ring-primary/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-4xl font-bold tracking-[-0.05em] text-[#f7ecda] sm:text-5xl md:text-6xl">
              Pilih paket yang sesuai
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
              Upgrade paket untuk membuka fitur lengkap dan kuota yang lebih besar.
            </p>
          </div>
        </div>

        {/* Current Tier Badge */}
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="text-sm">
            Paket saat ini: <span className="font-bold">{currentTier}</span>
          </Badge>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Freemium Plan */}
          <PricingCard
            plan={freemiumPlan}
            currentTier={currentTier}
            processing={processing}
            onSelect={() => router.push("/")}
            disabled={false}
          />

          {/* Starter and Pro Plans */}
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              currentTier={currentTier}
              processing={processing}
              onSelect={() => handleSelectPlan(plan)}
              disabled={!session}
            />
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-16">
          <h2 className="mb-8 text-center text-3xl font-bold text-[#f7ecda]">
            Perbandingan Fitur
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 text-left text-sm font-semibold text-muted-foreground">
                    Fitur
                  </th>
                  <th className="py-4 text-center text-sm font-semibold text-muted-foreground">
                    Freemium
                  </th>
                  <th className="py-4 text-center text-sm font-semibold text-muted-foreground">
                    Starter
                  </th>
                  <th className="py-4 text-center text-sm font-semibold text-muted-foreground">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Generate PRD", freemium: "1/bulan", starter: "5/bulan", pro: "Unlimited" },
                  { feature: "Chat AI Agent", freemium: "0", starter: "100/bulan", pro: "Unlimited" },
                  { feature: "Model AI", freemium: "Standar", starter: "High-end", pro: "High-end" },
                  { feature: "Export Markdown", freemium: "✓", starter: "✓", pro: "✓" },
                  { feature: "Export PDF", freemium: "✗", starter: "✓", pro: "✓" },
                  { feature: "Export Mermaid", freemium: "✗", starter: "✓", pro: "✓" },
                  { feature: "Riwayat Project", freemium: "Terbatas", starter: "Permanen", pro: "Permanen" },
                  { feature: "Support", freemium: "Community", starter: "Email", pro: "Priority" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-4 text-sm text-[#f2e6d5]">{row.feature}</td>
                    <td className="py-4 text-center text-sm text-muted-foreground">{row.freemium}</td>
                    <td className="py-4 text-center text-sm text-muted-foreground">{row.starter}</td>
                    <td className="py-4 text-center text-sm text-muted-foreground">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-[#1b2635] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#f7ecda]">
              Lanjutkan Pembayaran
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Data akun akan otomatis terisi di halaman pembayaran Mayar.
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-4 py-2">
              {/* Plan summary */}
              <div className="flex items-center justify-between rounded-lg bg-white/5 p-4">
                <div>
                  <p className="font-semibold text-[#f7ecda]">{selectedPlan.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{formatPrice(selectedPlan.price)}</p>
                  <p className="text-xs text-muted-foreground">per {selectedPlan.interval === "monthly" ? "bulan" : "tahun"}</p>
                </div>
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
            </div>
          )}

          <div className="flex flex-col gap-3">
            {paymentUrl ? (
              <Button
                className="w-full rounded-2xl"
                onClick={redirectToPayment}
                size="lg"
                variant="accent"
              >
                Bayar Sekarang
              </Button>
            ) : (
              <Button
                className="w-full rounded-2xl"
                onClick={confirmPayment}
                size="lg"
                variant="accent"
                disabled={creatingPayment}
              >
                {creatingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membuat link pembayaran...
                  </>
                ) : (
                  "Lanjut ke Pembayaran"
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setPaymentDialogOpen(false);
                setPaymentUrl(null);
              }}
            >
              Batalkan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function PricingCard({
  plan,
  currentTier,
  processing,
  onSelect,
  disabled,
}: {
  plan: Plan;
  currentTier: Tier;
  processing: string | null;
  onSelect: () => void;
  disabled: boolean;
}) {
  const isCurrentTier = currentTier === plan.tier;
  const isProcessing = processing === plan.id;

  const tierColors = {
    Freemium: "from-slate-500/20 to-slate-600/20 border-slate-500/30",
    Starter: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
    Pro: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
  };

  const badgeColors = {
    Freemium: "bg-slate-500/14 text-slate-300 border-slate-500/25",
    Starter: "bg-blue-500/14 text-blue-300 border-blue-500/25",
    Pro: "bg-purple-500/14 text-purple-300 border-purple-500/25",
  };

  return (
    <Card
      className={`relative overflow-hidden border bg-gradient-to-b ${tierColors[plan.tier]} ${
        isCurrentTier ? "ring-2 ring-primary/50" : ""
      }`}
    >
      {plan.tier === "Pro" && (
        <div className="absolute right-0 top-0 bg-gradient-to-l from-purple-500/30 to-transparent px-3 py-1 text-xs font-bold text-purple-200">
          POPULER
        </div>
      )}

      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl text-[#f7ecda]">{plan.name}</CardTitle>
          {isCurrentTier && (
            <Badge variant="secondary" className={badgeColors[plan.tier]}>
              Aktif
            </Badge>
          )}
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-[#f7ecda]">
              {plan.price === 0 ? "Gratis" : formatPrice(plan.price)}
            </span>
            {plan.price > 0 && (
              <span className="text-muted-foreground">/{plan.interval === "monthly" ? "bulan" : "tahun"}</span>
            )}
          </div>
        </div>

        <ul className="space-y-3">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <Check className="h-5 w-5 shrink-0 text-emerald-400" />
              <span className="text-[#f2e6d5]">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full rounded-2xl"
          variant={isCurrentTier ? "outline" : "accent"}
          onClick={onSelect}
          disabled={disabled || isProcessing}
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
          ) : (
            `Pilih ${plan.name}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}
