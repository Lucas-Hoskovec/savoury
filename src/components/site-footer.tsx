"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/explore", label: "Explorer" },
  { href: "/cgu", label: "CGU" },
  { href: "/privacy", label: "Confidentialité" },
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter({ className }: { className?: string }) {
  const pathname = usePathname();
  const hideOnMobile = pathname === "/ai";

  return (
    <footer
      className={cn("border-t border-border bg-card/60", hideOnMobile && "hidden md:block", className)}
    >
      <div className="mx-auto flex max-w-[935px] flex-col items-center gap-4 px-4 py-6 md:flex-row md:justify-between">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Savoury — le réseau social culinaire.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}