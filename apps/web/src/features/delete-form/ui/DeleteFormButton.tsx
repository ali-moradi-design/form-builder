"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { deleteDraft } from "@/entities/form";
import { Button } from "@/shared/ui";

/** Deletes a draft from this browser. */
export function DeleteFormButton({ id, title }: { id: string; title: string }) {
  const t = useTranslations("forms");
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`${t("delete")}: ${title}`}
      onClick={() => {
        deleteDraft(id);
      }}
    >
      <Trash2 size={16} aria-hidden />
    </Button>
  );
}
