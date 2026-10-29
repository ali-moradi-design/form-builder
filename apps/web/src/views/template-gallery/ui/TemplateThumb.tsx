import type { FieldNode, FormDocument } from "@formcanvas/schema";

const CHOICE = new Set(["radio", "checkboxes", "select", "rating", "nps"]);
const SWATCHES = ["bg-primary", "bg-orange", "bg-amber"];

/** First answerable fields, opening groups so their children show. */
const firstFields = (document: FormDocument, max: number): FieldNode[] => {
  const out: FieldNode[] = [];
  const walk = (fields: readonly FieldNode[]) => {
    for (const f of fields) {
      if (out.length >= max) return;
      if (f.type === "group") walk(f.fields ?? []);
      else out.push(f);
    }
  };
  walk(document.steps[0]?.fields ?? []);
  return out;
};

const Shape = ({ field }: { field: FieldNode }) => {
  if (field.type === "colorSet") {
    return (
      <span className="flex gap-1.5">
        {SWATCHES.map((c) => (
          <i key={c} className={`h-4 flex-1 rounded ${c}`} />
        ))}
      </span>
    );
  }
  if (CHOICE.has(field.type)) {
    const n = field.type === "nps" ? 10 : field.type === "rating" ? 5 : 4;
    return (
      <span className="flex gap-1">
        {Array.from({ length: n }, (_, k) => (
          <i
            key={k}
            className={`h-4 flex-1 rounded border ${k === 0 ? "border-orange bg-orange/15" : "border-line bg-surface-2"}`}
          />
        ))}
      </span>
    );
  }
  if (field.type === "file" || field.type === "repeater") {
    return <i className="block h-6 rounded-md border border-dashed border-line-strong" />;
  }
  return (
    <span className="grid gap-1">
      <i className="block h-1.5 w-2/5 rounded bg-line-strong" />
      <i className="block h-5 rounded-md border border-line-strong" />
    </span>
  );
};

/** A small drawing of a form's first fields, for a template card. Decorative. */
export function TemplateThumb({ document }: { document: FormDocument }) {
  const steps = document.steps.length;
  return (
    <div
      aria-hidden
      className="h-[150px] overflow-hidden border-b border-line bg-surface-2 px-6 pt-[18px]"
    >
      <div className="grid h-full content-start gap-2 rounded-t-[10px] border border-line bg-surface px-4 pt-3.5 shadow-sm">
        {steps > 1 && (
          <span className="flex gap-1">
            {Array.from({ length: steps }, (_, k) => (
              <i key={k} className={`h-1 flex-1 rounded ${k === 0 ? "bg-primary" : "bg-line"}`} />
            ))}
          </span>
        )}
        <i className="block h-2 w-1/2 rounded bg-ink/80" />
        {firstFields(document, 3).map((f) => (
          <Shape key={f.key} field={f} />
        ))}
      </div>
    </div>
  );
}
