"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function FollowButton() {
  const [following, setFollowing] = useState(false);
  return (
    <Button
      variant="secondary"
      onClick={() => setFollowing((value) => !value)}
      aria-pressed={following}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
