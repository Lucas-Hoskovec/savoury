import Link from "next/link";
import { CATEGORIES } from "@/lib/validation";
import { cn } from "@/lib/utils";

export function CategoryChips() {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Chip href="/" label="Tous" active={false} />
      {CATEGORIES.map((c) => (
        <Chip key={c} href={`/explore?category=${encodeURIComponent(c)}`} label={c} active={false} />
      ))}
    </div>
  );
}

function Chip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted"
      )}
    >
      {label}
    </Link>
  );
}