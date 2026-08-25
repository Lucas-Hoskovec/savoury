import { MobileTabBar, Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <SiteFooter className="pb-16 md:pb-0" />
      <MobileTabBar />
    </>
  );
}