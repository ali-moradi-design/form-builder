"use client";

import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { clearLocalDrafts, importMyDrafts, readLocalDrafts } from "@/entities/form";
import { Button } from "@/shared/ui";

/** Offers to move drafts saved in this browser (version 0.3) into the account. */
export function ImportLocalDrafts() {
  const t = useTranslations("forms");
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [pending, start] = useTransition();
  useEffect(() => {
    setCount(readLocalDrafts().length);
  }, []);
  if (count === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-line bg-surface p-4 shadow-xs">
      <Upload size={18} className="text-primary-fg" aria-hidden />
      <p className="grow text-[13px]">{t("importText", { count })}</p>
      <Button
        variant="ghost"
        onClick={() => {
          clearLocalDrafts();
          setCount(0);
        }}
      >
        {t("importSkip")}
      </Button>
      <Button
        variant="primary"
        disabled={pending}
        onClick={() => {
          start(async () => {
            await importMyDrafts(readLocalDrafts());
            clearLocalDrafts();
            setCount(0);
            router.refresh();
          });
        }}
      >
        {t("importAction")}
      </Button>
    </div>
  );
}
