export type FeedItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  category: string;
  createdAt: string;
  author: {
    username: string;
    avatarUrl: string | null;
  };
  likeCount: number;
  commentCount: number;
  liked: boolean;
  saved: boolean;
};

export type FeedPage = {
  items: FeedItem[];
  nextOffset: number | null;
};