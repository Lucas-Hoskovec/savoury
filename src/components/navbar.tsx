import Link from "next/link";
import { Compass, Home, MessageCircle, PlusSquare, Shield, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-14 max-w-[935px] items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Savoury — accueil">
          <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2.5 12c0-2.5 2-2.5 2-5 0-1.5 1-2.5 2.5-2.5S9 5.5 9 7c0 2.5 2 2.5 2 5s-2 2.5-2 5c0 1.5-1 2.5-2.5 2.5S4 18.5 4 17c0-2.5-2-2.5-2-5Z" />
              <path d="M13 4h4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-4" />
            </svg>
          </span>
          <span className="font-display text-xl font-bold tracking-tight">Savoury</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3">
          <NavIcon href="/" label="Accueil" className="hidden sm:grid">
            <Home className="size-6" />
          </NavIcon>
          <NavIcon href="/explore" label="Explorer" className="hidden sm:grid">
            <Compass className="size-6" />
          </NavIcon>
          <NavIcon href="/recipes/new" label="Créer" className="hidden sm:grid">
            <PlusSquare className="size-6" />
          </NavIcon>
          <NavIcon href="/ai" label="Savoury AI" className="hidden sm:grid">
            <Sparkles className="size-6" />
          </NavIcon>
          <NavIcon href="/messages" label="Messages">
            <MessageCircle className="size-6" />
          </NavIcon>
          {user?.role === "ADMIN" && (
            <NavIcon href="/moderation" label="Modération">
              <Shield className="size-6" />
            </NavIcon>
          )}
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Button asChild size="sm" className="ml-1 rounded-full px-4">
              <Link href="/login">Connexion</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavIcon({
  href,
  label,
  children,
  className,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`grid size-10 place-items-center rounded-xl text-foreground transition-colors hover:bg-muted ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}

export function MobileTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto grid h-14 max-w-[935px] grid-cols-4 items-center px-6">
        <TabLink href="/" label="Accueil">
          <Home className="size-6" />
        </TabLink>
        <TabLink href="/explore" label="Explorer">
          <Compass className="size-6" />
        </TabLink>
        <TabLink href="/recipes/new" label="Créer">
          <PlusSquare className="size-6" />
        </TabLink>
        <TabLink href="/ai" label="Savoury AI">
          <Sparkles className="size-6 text-primary" />
        </TabLink>
      </div>
    </nav>
  );
}

function TabLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} aria-label={label} className="mx-auto grid place-items-center text-foreground">
      {children}
    </Link>
  );
}