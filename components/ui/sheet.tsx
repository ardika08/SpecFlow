import * as React from "react";
import { cn } from "@/lib/utils";

function Sheet({
  open,
  children,
  className,
}: {
  open: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "fixed bottom-0 right-0 top-0 z-40 w-full max-w-md translate-x-full border-l border-white/10 bg-[#142030]/95 shadow-soft backdrop-blur transition-transform duration-300 lg:static lg:max-w-sm lg:translate-x-0 lg:rounded-[1.5rem] lg:border",
        open && "translate-x-0",
        className,
      )}
    >
      {children}
    </aside>
  );
}

export { Sheet };
