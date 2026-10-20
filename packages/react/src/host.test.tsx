import { createRegistry } from "@formweave/engine";
import { allFields } from "@formweave/engine/fields/all";
import type { FormDocument } from "@formweave/schema";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { allRenderers } from "./fields/index.js";
import { Form } from "./Form.js";
import { createRenderers } from "./renderers.js";

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
  it("keeps fw-form next to the host's class names (#44)", () => {
    const { container } = render(
      <Form schema={doc} registry={registry} renderers={renderers} className="settings-form" />,
    );
    expect(container.querySelector("form")?.className).toBe("fw-form settings-form");
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
});
