"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type CoverImageProps = {
  src?: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
};

export function CoverImage({
  src,
  alt,
  sizes = "(max-width: 768px) 45vw, 220px",
  priority = false,
  className,
  imageClassName,
}: CoverImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("bg-surface-hover relative overflow-hidden", className)}>
      {!src || failed ? (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,var(--color-primary),transparent_32%),linear-gradient(145deg,var(--color-surface-hover),var(--color-background))]" />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={cn("object-cover", imageClassName)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
