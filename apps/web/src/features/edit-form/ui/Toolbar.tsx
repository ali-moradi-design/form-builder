"use client";

import { AlertCircle, Check, LoaderCircle, Redo2, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui";
import { useBuilder, useBuilderApi, useHistoryState } from "../model/context";

/** Autosave state and undo/redo buttons. */
export function Toolbar() {
  const t = useTranslations("builder");
  const { history } = useBuilderApi();
  const { canUndo, canRedo } = useHistoryState();
  const save = useBuilder((s) => s.saveState);
  return (
    <div className="flex items-center gap-2">
      <span role="status" className="flex items-center gap-1.5 text-[13px] text-ink-3">
        {save === "saved" && <Check size={15} aria-hidden />}
        {save === "pending" && <LoaderCircle size={15} className="animate-spin" aria-hidden />}
        {save === "invalid" && <AlertCircle size={15} className="text-carmine" aria-hidden />}
        {t(save === "saved" ? "saved" : save === "pending" ? "saving" : "invalid")}
      </span>
      <Button
        size="icon"
        aria-label={t("undo")}
        title={t("undo")}
        disabled={!canUndo}
        onClick={history.undo}
      >
        <Undo2 size={16} aria-hidden />
      </Button>
      <Button
        size="icon"
        aria-label={t("redo")}
        title={t("redo")}
        disabled={!canRedo}
        onClick={history.redo}
      >
        <Redo2 size={16} aria-hidden />
      </Button>
    </div>
  );
}
