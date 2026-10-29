import { createRegistry } from "@formcanvas/engine";
import { allFields } from "@formcanvas/engine/fields/all";
import type { FormDocument } from "@formcanvas/schema";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { allRenderers } from "./fields/index.js";
import { Form } from "./Form.js";
import { createRenderers, type FieldRendererProps } from "./renderers.js";

afterEach(cleanup);

const registry = createRegistry(allFields);
const renderers = createRenderers(allRenderers);
const options = [
  { value: "1", label: "Teal" },
  { value: "2", label: "Orange" },
  { value: "true", label: "Yes" },
];
const doc: FormDocument = {
  schemaVersion: 1,
  id: "h",
  title: "Widget",
  locales: { default: "en" },
  steps: [
    {
      key: "s",
      fields: [
        {
          type: "select",
          key: "first",
          label: "First colour",
          required: true,
          settings: { options },
        },
        { type: "radio", key: "second", label: "Second colour", settings: { options } },
        { type: "checkboxes", key: "more", label: "More", settings: { options } },
        { type: "select", key: "optional", label: "Optional", settings: { options } },
      ],
    },
  ],
};

describe("Form in a host app", () => {
  it("keeps fc-form next to the host's class names (#44)", () => {
    const { container } = render(
      <Form schema={doc} registry={registry} renderers={renderers} className="settings-form" />,
    );
    expect(container.querySelector("form")?.className).toBe("fc-form settings-form");
  });

  it("writes the theme prop as data-theme (#45)", () => {
    const { container, rerender } = render(
      <Form schema={doc} registry={registry} renderers={renderers} />,
    );
    expect(container.querySelector("form")?.hasAttribute("data-theme")).toBe(false);
    rerender(<Form schema={doc} registry={registry} renderers={renderers} theme="light" />);
    expect(container.querySelector("form")?.dataset.theme).toBe("light");
  });

  it("matches number and boolean values to their options and submits them (#46)", async () => {
    const onSubmit = vi.fn();
    render(
      <Form
        schema={doc}
        registry={registry}
        renderers={renderers}
        defaultValues={{ first: 2, second: true, more: [1, "2"] }}
        onSubmit={onSubmit}
      />,
    );
    const first = screen.getByLabelText<HTMLSelectElement>(/First colour/);
    expect(first.value).toBe("2");
    // A required select with an answer has no empty choice to fall back to.
    expect([...first.options].map((o) => o.value)).toEqual(["1", "2", "true"]);
    expect(screen.getByLabelText<HTMLSelectElement>("Optional").options[0]?.value).toBe("");
    expect(screen.getByRole<HTMLInputElement>("radio", { name: "Yes" }).checked).toBe(true);
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Teal" }).checked).toBe(true);
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Orange" }).checked).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).toHaveBeenCalledWith({ first: "2", second: "true", more: ["1", "2"] });
  });

  it("renders the eyedropper only after hydration, so server HTML matches", () => {
    const colors: FormDocument = {
      ...doc,
      steps: [{ key: "s", fields: [{ type: "colorSet", key: "palette", label: "Palette" }] }],
    };
    const g = globalThis as { EyeDropper?: unknown };
    g.EyeDropper = function EyeDropper() {
      return undefined;
    };
    try {
      const html = renderToString(
        <Form schema={colors} registry={registry} renderers={renderers} />,
      );
      expect(html).not.toContain("fc-eyedropper");
      render(<Form schema={colors} registry={registry} renderers={renderers} />);
      expect(screen.getByRole("button", { name: "Eyedropper" })).toBeTruthy();
    } finally {
      delete g.EyeDropper;
    }
  });

  it("does not re-render fields when only the form's props change", () => {
    let renders = 0;
    const Base = renderers.get("shortText");
    if (!Base) throw new Error("no shortText renderer");
    const Counted = (props: FieldRendererProps) => {
      renders++;
      return <Base {...props} />;
    };
    const counted = createRenderers([...allRenderers, { type: "shortText", component: Counted }]);
    const text: FormDocument = {
      ...doc,
      steps: [{ key: "s", fields: [{ type: "shortText", key: "name", label: "Name" }] }],
    };
    const { rerender } = render(
      <Form schema={text} registry={registry} renderers={counted} onChange={() => undefined} />,
    );
    const after = renders;
    rerender(
      <Form schema={text} registry={registry} renderers={counted} onChange={() => undefined} />,
    );
    expect(renders).toBe(after);
  });
});
