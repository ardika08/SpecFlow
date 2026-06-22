"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { BGPattern } from "@/components/ui/bg-pattern";

export default function RegisterPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("register");

  const handleSuccess = () => {
    router.push("/");
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
      <AuthForm mode={mode} onModeChange={setMode} onSuccess={handleSuccess} />
    </main>
  );
}
