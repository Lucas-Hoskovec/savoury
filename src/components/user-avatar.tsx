import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  username: string;
  src?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizes = {
  sm: "size-6 text-xs",
  md: "size-8 text-sm",
  lg: "size-10 text-base",
  xl: "size-20 text-2xl",
};

export function UserAvatar({ username, src, className, size = "md" }: Props) {
  const initial = username.charAt(0).toUpperCase();

  if (!src) {
    return (
      <div
        aria-label={`@${username}`}
        className={cn(
          sizes[size],
          "grid shrink-0 select-none place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-accent/30 font-semibold text-primary",
          className
        )}
      >
        {initial}
      </div>
    );
  }

  return (
    <div className={cn(sizes[size], "relative shrink-0 overflow-hidden rounded-full", className)}>
      <Image src={src} alt={`@${username}`} fill sizes="96px" className="object-cover" />
    </div>
  );
}