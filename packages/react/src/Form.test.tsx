import { createRegistry } from "@formweave/engine";
import { allFields } from "@formweave/engine/fields/all";
import type { FormDocument } from "@formweave/schema";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { basicRenderers, shortTextRenderer } from "./fields/index.js";
import { Form } from "./Form.js";
import { createRenderers, defineRenderer } from "./renderers.js";

afterEach(cleanup);

const registry = createRegistry(allFields);
const renderers = createRenderers(basicRenderers);
const team = { op: "eq", args: [{ var: "plan" }, "team"] } as const;

const doc: FormDocument = {
  schemaVersion: 1,
  id: "t",
  title: { en: "Feedback", fa: "بازخورد" },
  locales: { default: "en", supported: ["en", "fa"] },
  steps: [
    {
      key: "main",
      fields: [
        { type: "shortText", key: "name", label: { en: "Name", fa: "نام" }, required: true },
        {
          type: "radio",
          key: "plan",
          label: "Plan",
          settings: {
            options: [
              { value: "free", label: { en: "Free", fa: "رایگان" } },
              { value: "team", label: { en: "Team", fa: "تیمی" } },
            ],
          },
        },
        { type: "number", key: "seats", label: "Seats", visibleWhen: team, required: true },
      ],
    },
  ],
};

describe("<Form>", () => {
  it("shows a field when its condition becomes true", async () => {
    const user = userEvent.setup();
    render(<Form schema={doc} registry={registry} renderers={renderers} onSubmit={vi.fn()} />);
    expect(screen.queryByLabelText(/Seats/)).toBeNull();
    await user.click(screen.getByLabelText("Team"));
    expect(screen.getByLabelText(/Seats/)).toBeTruthy();
  });

  it("submits only visible, valid values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Form schema={doc} registry={registry} renderers={renderers} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/Name/), "Sara");
    await user.click(screen.getByLabelText("Team"));
    await user.type(screen.getByLabelText(/Seats/), "۱۲");
    await user.click(screen.getByLabelText("Free"));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: "Sara", plan: "free" });
    });
  });

  it("shows errors in the reader's language and marks the field invalid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Form
        schema={doc}
        registry={registry}
        renderers={renderers}
        locale="fa"
        onSubmit={onSubmit}
      />,
    );
    const form = screen.getByRole("button", { name: "ارسال" }).closest("form");
    expect(form?.getAttribute("dir")).toBe("rtl");
    await user.click(screen.getByRole("button", { name: "ارسال" }));
    expect(await screen.findByText("پاسخ به این پرسش لازم است.")).toBeTruthy();
    expect(screen.getByLabelText(/نام/).getAttribute("aria-invalid")).toBe("true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("checks each step before moving on", async () => {
    const user = userEvent.setup();
    const [name, plan] = doc.steps[0]?.fields ?? [];
    if (!name || !plan) throw new Error("fixture changed");
    const twoSteps: FormDocument = {
      ...doc,
      steps: [
        { key: "a", title: "About you", fields: [name] },
        { key: "b", title: "Plan", fields: [plan] },
      ],
    };
    render(<Form schema={twoSteps} registry={registry} renderers={renderers} onSubmit={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("This field is required.")).toBeTruthy();
    await user.type(screen.getByLabelText(/Name/), "Sara");
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByLabelText("Team")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
  });

  it("re-renders only the field being edited", async () => {
    const user = userEvent.setup();
    const renders: Record<string, number> = {};
    const Counting = shortTextRenderer.component;
    const counting = createRenderers([
      ...basicRenderers,
      defineRenderer("shortText", (p) => {
        renders[p.name] = (renders[p.name] ?? 0) + 1;
        return <Counting {...p} />;
      }),
    ]);
    const twoTexts: FormDocument = {
      ...doc,
      steps: [
        {
          key: "main",
          fields: [
            { type: "shortText", key: "a", label: "A" },
            { type: "shortText", key: "b", label: "B" },
          ],
        },
      ],
    };
    render(<Form schema={twoTexts} registry={registry} renderers={counting} onSubmit={vi.fn()} />);
    const before = renders.b ?? 0;
    await user.type(screen.getByLabelText("A"), "hello");
    expect(renders.b).toBe(before);
    expect(renders.a).toBeGreaterThan(5);
  });

  it("shows one question at a time in the focus layout", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Form
        schema={doc}
        registry={registry}
        renderers={renderers}
        locale="fa"
        layout="focus"
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByText("پرسش ۱ از ۲")).toBeTruthy();
    expect(screen.queryByLabelText("تیمی")).toBeNull();
    await user.click(screen.getByRole("button", { name: "تأیید" }));
    expect(await screen.findByText("پاسخ به این پرسش لازم است.")).toBeTruthy();
    await user.type(screen.getByLabelText(/نام/), "سارا{Enter}");
    await user.click(await screen.findByLabelText("تیمی"));
    expect(screen.getByText("پرسش ۲ از ۳")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "تأیید" }));
    await user.type(await screen.findByLabelText(/Seats/), "3");
    await user.click(screen.getByRole("button", { name: "ارسال" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: "سارا", plan: "team", seats: 3 });
    });
  });

  it("reports changes and hides the buttons in a live form", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Form
        schema={doc}
        registry={registry}
        renderers={renderers}
        actions={false}
        onChange={onChange}
      />,
    );
    expect(screen.queryByRole("button")).toBeNull();
    await user.type(screen.getByLabelText(/Name/), "Al{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ name: "Al" }), "name");
    expect(screen.queryByText("This field is required.")).toBeNull();
  });
});
