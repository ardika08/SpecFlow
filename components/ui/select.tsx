import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="group relative">
      <select
        className={cn(
          "select-premium h-14 w-full appearance-none rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(38,48,67,0.94),rgba(27,36,51,0.98))] px-4 pr-12 text-[15px] font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_30px_rgba(3,8,18,0.18)] outline-none transition duration-200 [color-scheme:dark] hover:border-primary/30 hover:bg-[linear-gradient(180deg,rgba(42,54,75,0.96),rgba(29,39,56,1))] focus:border-primary/60 focus:ring-2 focus:ring-primary/30",
          className,
        )}
        {...props}
      />
      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition group-hover:border-primary/20 group-hover:text-primary">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export { Select };
