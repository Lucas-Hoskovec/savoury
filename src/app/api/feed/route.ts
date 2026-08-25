import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getFeedPage } from "@/lib/feed";
import type { FeedPage } from "@/lib/feed-types";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const offset = Math.max(0, Number(req.nextUrl.searchParams.get("offset") ?? 0) || 0);
  const page = await getFeedPage(session.userId, offset);
  const body: FeedPage = page;
  return NextResponse.json(body);
}