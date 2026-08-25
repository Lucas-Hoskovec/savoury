import { SiteFooter } from "@/components/site-footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="mb-6 flex items-center gap-2">
          <span className="font-display text-2xl font-bold tracking-tight">Savoury</span>
        </div>
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}