"use client";

import { useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function ManageDrawer({
  title,
  description,
  trigger,
  children,
}: {
  title: string;
  description?: string;
  trigger: ReactNode;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return (
    <>
      <span onClick={() => dialogRef.current?.showModal()}>{trigger}</span>
      <dialog ref={dialogRef} className="manage-drawer">
        <button
          type="button"
          className="manage-drawer-backdrop"
          aria-label="Close"
          onClick={() => dialogRef.current?.close()}
        />
        <div className="manage-drawer-panel">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                {title}
              </h2>
              {description ? (
                <p className="text-muted-foreground mt-1 text-sm leading-6">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="border-border hover:bg-surface-hover grid size-9 shrink-0 place-items-center rounded-full border"
              aria-label="Close"
              onClick={() => dialogRef.current?.close()}
            >
              <X className="size-4" />
            </button>
          </header>
          <div className="mt-6">{children}</div>
        </div>
      </dialog>
    </>
  );
}
