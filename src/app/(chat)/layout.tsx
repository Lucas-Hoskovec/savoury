import { MobileTabBar, Navbar } from "@/components/navbar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <MobileTabBar />
    </>
  );
}