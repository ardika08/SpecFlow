import * as React from "react";
import { cn } from "@/lib/utils";

function Tabs({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("w-full", className)} {...props} />;
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("inline-flex rounded-full border bg-white/80 p-1 shadow-sm", className)}
      {...props}
    />
  );
}

function TabsTrigger({
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition",
        active && "bg-primary text-primary-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
