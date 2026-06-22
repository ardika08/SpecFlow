import * as React from "react";
import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    src?: string | null;
    alt?: string;
    fallback?: string;
  }
>(({ className, src, alt, fallback, ...props }, ref) => {
  const [imageError, setImageError] = React.useState(false);

  if (src && !imageError) {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      >
        <img
          src={src}
          alt={alt || "Avatar"}
          className="aspect-square h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fallback to initial or default
  const initial = fallback || (alt?.charAt(0).toUpperCase() || "?");

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0d1522] text-sm font-bold text-foreground ring-1 ring-white/10",
        className
      )}
      {...props}
    >
      {initial}
    </div>
  );
});
Avatar.displayName = "Avatar";

export { Avatar };
