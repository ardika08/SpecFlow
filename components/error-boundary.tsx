"use client";

import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component untuk catch dan handle error di React component tree
 * Menampilkan UI yang graceful ketika terjadi error di aplikasi
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Jika ada custom fallback, gunakan itu
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#0d1522] px-4 py-12 text-foreground">
          <Card className="max-w-md border-red-500/30 bg-red-950/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <CardTitle className="text-xl text-red-300">Terjadi Kesalahan</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi support jika masalah berlanjut.
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="rounded-lg border border-red-500/20 bg-red-950/10 p-3">
                  <summary className="cursor-text text-xs font-mono text-red-300">
                    Error Details (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs text-red-200">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button
                  variant="accent"
                  className="flex-1"
                  onClick={() => (window.location.href = "/")}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Beranda
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      );
    }

    return this.props.children;
  }
}
