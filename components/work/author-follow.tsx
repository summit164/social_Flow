"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollowAction } from "@/lib/profile/actions";

export function AuthorFollow({
  targetUserId,
  initialFollowing,
}: {
  targetUserId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    setFollowing((v) => !v);
    startTransition(async () => {
      const result = await toggleFollowAction(targetUserId);
      if ("error" in result) setFollowing(initialFollowing);
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={following ? "outline" : "default"}
      disabled={isPending}
      onClick={onClick}
    >
      {following ? "Вы подписаны" : "Подписаться"}
    </Button>
  );
}
