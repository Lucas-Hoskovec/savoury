import { getSession } from "@/lib/auth";
import { getFeedPage } from "@/lib/feed";
import { FeedList } from "@/components/feed/feed-list";
import { SuggestedSidebar } from "@/components/feed/suggested-sidebar";

export default async function HomePage() {
  const session = await getSession();
  const initial = await getFeedPage(session.userId, 0);

  return (
    <div className="mx-auto flex max-w-[1024px] justify-center gap-8 px-4 py-6">
      <div className="min-w-0 max-w-[630px] flex-1">
        <FeedList initialItems={initial.items} initialOffset={initial.nextOffset} />
      </div>
      <SuggestedSidebar />
    </div>
  );
}