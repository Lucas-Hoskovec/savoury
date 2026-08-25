import { SiteFooter } from "@/components/site-footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2.5 12c0-2.5 2-2.5 2-5 0-1.5 1-2.5 2.5-2.5S9 5.5 9 7c0 2.5 2 2.5 2 5s-2 2.5-2 5c0 1.5-1 2.5-2.5 2.5S4 18.5 4 17c0-2.5-2-2.5-2-5Z" />
              <path d="M13 4h4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-4" />
            </svg>
          </span>
          <span className="font-display text-2xl font-bold tracking-tight">Savoury</span>
        </div>
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}