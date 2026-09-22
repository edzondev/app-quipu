"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { fromConvexError } from "@/core/errors";
import { getInitial } from "@/modules/dashboard/lib/dashboard-math";
import { Button } from "@/shared/components/ui/button";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { withPending } from "@/shared/lib/with-pending";
import { useUpdateDisplayName } from "../actions";
import {
  SETTINGS_EDIT_PROFILE,
  SETTINGS_NAME_CANCEL,
  SETTINGS_NAME_ERROR,
  SETTINGS_NAME_SAVE,
  SETTINGS_NAME_SAVED,
  SETTINGS_PROFILE_LABEL,
  SETTINGS_PROGRESS_LINK,
} from "../constants";
import { displayNameSchema } from "../schemas";
import type { SettingsProfileOverview } from "../types";

type Props = {
  profile: SettingsProfileOverview;
  className?: string;
  id?: string;
};

export function SettingsProfileCard({ profile, className, id }: Props) {
  const updateName = useUpdateDisplayName();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile.name);
  const [pending, setPending] = useState(false);

  const subtitleParts = [profile.email, profile.country].filter(Boolean);

  async function saveName() {
    const parsed = displayNameSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? SETTINGS_NAME_ERROR);
      return;
    }
    await withPending(setPending, async () => {
      try {
        await updateName({ name: parsed.data });
        toast.success(SETTINGS_NAME_SAVED);
        setEditing(false);
      } catch (error) {
        toast.error(fromConvexError(error).message);
      }
    });
  }

  function cancelEdit() {
    setDraft(profile.name);
    setEditing(false);
  }

  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-6 rounded-xl border border-line/70 bg-card px-5 py-5 md:px-6 md:py-[22px]",
        className,
      )}
    >
      <div className="mb-4 text-[12.5px] font-medium text-ink-secondary">
        {SETTINGS_PROFILE_LABEL}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3 sm:gap-4">
        <span
          className="flex size-[54px] shrink-0 items-center justify-center rounded-full bg-qp-tint font-serif text-2xl text-qp-deep"
          aria-hidden
        >
          {getInitial(editing ? draft : profile.name)}
        </span>
        <div className="min-w-0 flex-1 basis-[12rem]">
          {editing ? (
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-11 max-w-full text-[15px]"
              autoFocus
              maxLength={80}
              aria-label="Nombre"
            />
          ) : (
            <>
              <div className="truncate text-[17px] font-semibold text-ink">
                {profile.name}
              </div>
              {subtitleParts.length > 0 ? (
                <div className="truncate text-[13px] text-mute-subtle">
                  {subtitleParts.join(" · ")}
                </div>
              ) : null}
            </>
          )}
        </div>
        {editing ? (
          <div className="flex w-full shrink-0 flex-wrap gap-1.5 sm:w-auto sm:flex-row">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-11 border-line"
              disabled={pending}
              onClick={cancelEdit}
            >
              {SETTINGS_NAME_CANCEL}
            </Button>
            <Button
              type="button"
              size="sm"
              className="min-h-11"
              disabled={pending}
              onClick={() => void saveName()}
            >
              {SETTINGS_NAME_SAVE}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(profile.name);
              setEditing(true);
            }}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "min-h-11 shrink-0 border-line text-ink-secondary",
            )}
          >
            {SETTINGS_EDIT_PROFILE}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2.5">
        {profile.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-line-soft bg-surface-warm px-3.5 py-1.5 text-[12.5px] text-ink-secondary"
          >
            {tag}
          </span>
        ))}
      </div>
      <Link
        href="/progress"
        className="mt-4 inline-flex text-[13px] font-medium text-qp-deep underline-offset-4 hover:underline"
      >
        {SETTINGS_PROGRESS_LINK}
      </Link>
    </section>
  );
}
