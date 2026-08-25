"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleFollow } from "@/actions/interactions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  username: string;
  initialFollowing: boolean;
  variant?: "default" | "compact";
};

export function FollowButton({ username, initialFollowing, variant = "default" }: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (pending) return;
    startTransition(async () => {
      const res = await toggleFollow(username);
      if ("error" in res) {
        toast.error(res.error);
        if (res.error === "Connecte-toi pour suivre") router.push("/login");
      } else {
        setFollowing(res.following);
      }
    });
  }

  return (
    <Button
      variant={following ? "secondary" : "default"}
      size={variant === "compact" ? "sm" : "default"}
      className={cn("font-semibold", !following && "text-primary-foreground")}
      onClick={handleClick}
      disabled={pending}
    >
      {following ? "Suivi" : "Suivre"}
    </Button>
  );
}