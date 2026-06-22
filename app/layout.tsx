import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SpecFlow - AI PRD Builder",
  description: "Frontend MVP for generating AI-ready product requirement documents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
