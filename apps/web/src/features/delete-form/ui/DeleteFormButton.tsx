"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { deleteMyForm } from "@/entities/form";
import { Button } from "@/shared/ui";

/** Deletes one of the user's forms after a confirmation. */
export function DeleteFormButton({ id, title }: { id: string; title: string }) {
  const t = useTranslations("forms");
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`${t("delete")}: ${title}`}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(t("confirmDelete", { title }))) return;
        start(async () => {
          await deleteMyForm(id);
        });
      }}
    >
      <Trash2 size={16} aria-hidden />
    </Button>
  );
}
