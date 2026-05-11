"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollowAction } from "@/lib/profile/actions";

export function FollowButton({
  targetUserId,
  isFollowing,
}: {
  targetUserId: string;
  isFollowing: boolean;
}) {
  const [optimistic, setOptimistic] = useState(isFollowing);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    setOptimistic((v) => !v);
    startTransition(async () => {
      const result = await toggleFollowAction(targetUserId);
      if ("error" in result) setOptimistic(isFollowing); // откатываем
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={optimistic ? "outline" : "default"}
      disabled={isPending}
      onClick={onClick}
    >
      {optimistic ? "Вы подписаны" : "Подписаться"}
    </Button>
  );
}
