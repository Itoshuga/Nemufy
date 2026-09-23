"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LikeButton({
  className,
  label = "Save to library",
}: {
  className?: string;
  label?: string;
}) {
  const [liked, setLiked] = useState(false);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn(liked && "text-primary", className)}
      onClick={() => setLiked((value) => !value)}
      aria-label={liked ? "Remove from library" : label}
      aria-pressed={liked}
    >
      <Heart className={cn(liked && "fill-current")} aria-hidden="true" />
    </Button>
  );
}
