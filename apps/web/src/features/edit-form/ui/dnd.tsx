"use client";

import type { FieldPlace } from "@/entities/form";
import { pointerDistance } from "@dnd-kit/collision";
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import { useTranslations } from "next-intl";
import { createContext, memo, useContext, useState, type ReactNode } from "react";
import { fieldType } from "@/shared/config";
import { cn } from "@/shared/lib";
import { dropField, dropNewField, type DragSource } from "../model/actions";
import { useBuilderApi } from "../model/context";

const Dragging = createContext<DragSource | null>(null);

/** The current drag, or `null`. Drop slots show only while dragging. */
export const useDragging = (): DragSource | null => useContext(Dragging);

const isSource = (v: unknown): v is DragSource =>
  typeof v === "object" && v !== null && "kind" in v;
const isPlace = (v: unknown): v is FieldPlace =>
  typeof v === "object" && v !== null && "step" in v && "index" in v;

/** Drag and drop for the palette and the canvas. */
export function BuilderDnd({ children }: { children: ReactNode }) {
  const { store } = useBuilderApi();
  const t = useTranslations("builder");
  const [dragging, setDragging] = useState<DragSource | null>(null);
  return (
    <DragDropProvider
      onDragStart={(e) => {
        const data: unknown = e.operation.source?.data;
        setDragging(isSource(data) ? data : null);
      }}
      onDragEnd={(e) => {
        setDragging(null);
        const source: unknown = e.operation.source?.data;
        const slot: unknown = e.operation.target?.data;
        if (e.canceled || !isSource(source) || !isPlace(slot)) return;
        if (source.kind === "new") {
          const info = fieldType(source.type);
          if (info) dropNewField(store, info, t("newField"), slot);
        } else {
          store.getState().edit((doc) => dropField(doc, source.key, slot));
          store.getState().select({ kind: "field", key: source.key });
        }
      }}
    >
      <Dragging.Provider value={dragging}>{children}</Dragging.Provider>
    </DragDropProvider>
  );
}

/** Makes an element draggable; returns refs for the element and its handle. */
export function useBuilderDraggable(id: string, data: DragSource) {
  return useDraggable({ id, data });
}

/** A place between fields where a dragged field can land. */
export const DropSlot = memo(
  DropSlotImpl,
  // `place` is a new object on every render of the list; compare what it holds.
  (a, b) =>
    a.place.step === b.place.step &&
    a.place.parent === b.place.parent &&
    a.place.index === b.place.index &&
    (a.empty === undefined) === (b.empty === undefined),
);

function DropSlotImpl({ place, empty }: { place: FieldPlace; empty?: ReactNode }) {
  const t = useTranslations("builder");
  const dragging = useDragging();
  const id = `slot:${place.step}:${place.parent ?? ""}:${String(place.index)}`;
  // The slot nearest the pointer wins, so thin slots are easy to hit.
  const { ref, isDropTarget } = useDroppable({
    id,
    data: place,
    disabled: !dragging,
    collisionDetector: pointerDistance,
  });
  if (!dragging && !empty) return null;
  if (!dragging) return <div className="col-span-2">{empty}</div>;
  return (
    <div
      ref={ref}
      data-drop-slot=""
      className={cn(
        "col-span-2 grid place-items-center rounded-lg border-2 border-dashed",
        empty ? "min-h-16" : "h-7",
        isDropTarget
          ? "border-orange bg-[color-mix(in_oklab,var(--amber)_14%,transparent)]"
          : "border-line-strong/60",
      )}
    >
      {isDropTarget && (
        <span className="rounded-full bg-orange px-2 py-0.5 text-[11.5px] font-medium text-white">
          {t("dropHere")}
        </span>
      )}
    </div>
  );
}
