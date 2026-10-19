import { createRegistry } from "@formweave/engine";
import { allFields } from "@formweave/engine/fields/all";
import type { FormDocument } from "@formweave/schema";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { allRenderers, basicRenderers, shortTextRenderer } from "./fields/index.js";
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

  it("draws rating, NPS and hidden fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const rich: FormDocument = {
      ...doc,
      steps: [
        {
          key: "main",
          fields: [
            { type: "hidden", key: "source" },
            { type: "rating", key: "stars", label: "Stars", required: true },
            {
              type: "nps",
              key: "nps",
              label: "Recommend",
              settings: { lowLabel: "No", highLabel: "Yes" },
            },
            { type: "divider", key: "line" },
          ],
        },
      ],
    };
    render(
      <Form
        schema={rich}
        registry={registry}
        renderers={createRenderers(allRenderers)}
        layout="focus"
        defaultValues={{ source: "mail" }}
        onSubmit={onSubmit}
      />,
    );
    // Hidden fields and dividers get no page: two questions.
    expect(screen.getByText("Question 1 of 2")).toBeTruthy();
    await user.click(screen.getByLabelText("4 / 5"));
    await user.click(screen.getByRole("button", { name: "OK" }));
    await user.click(await screen.findByLabelText("9"));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ source: "mail", stars: 4, nps: 9 });
    });
  });

  it("picks colours from swatches and removes them", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const colors: FormDocument = {
      ...doc,
      steps: [
        {
          key: "main",
          fields: [
            { type: "colorSet", key: "palette", label: "Palette", settings: { maxColors: 2 } },
          ],
        },
      ],
    };
    render(
      <Form
        schema={colors}
        registry={registry}
        renderers={createRenderers(allRenderers)}
        onSubmit={onSubmit}
      />,
    );
    await user.click(screen.getByRole("button", { name: "#e36414" }));
    await user.click(screen.getByRole("button", { name: "#0f4c5c" }));
    // At the limit, more swatches are ignored.
    await user.click(screen.getByRole("button", { name: "#5f0f40" }));
    await user.click(screen.getByRole("button", { name: "× #e36414" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ palette: ["#0f4c5c"] });
    });
  });

  it("collects a date range, a price and a range slider", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const ranges: FormDocument = {
      ...doc,
      steps: [
        {
          key: "main",
          fields: [
            { type: "dateRange", key: "stay", label: "Stay", required: true },
            { type: "currency", key: "budget", label: "Budget", settings: { currency: "EUR" } },
            { type: "rangeSlider", key: "age", label: "Age", settings: { min: 18, max: 60 } },
          ],
        },
      ],
    };
    render(
      <Form
        schema={ranges}
        registry={registry}
        renderers={createRenderers(allRenderers)}
        onSubmit={onSubmit}
      />,
    );
    const from = screen.getByLabelText("Stay: From");
    await user.type(from, "2026-03-01");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByText("Fill in both ends of the range.")).toBeTruthy();
    await user.type(screen.getByLabelText("Stay: To"), "2026-03-04");
    expect(screen.getByText("€")).toBeTruthy();
    await user.type(screen.getByLabelText("Budget"), "1200.5");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        stay: { from: "2026-03-01", to: "2026-03-04" },
        budget: 1200.5,
      });
    });
  });

  it("adds, fills, checks and removes repeater rows", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const trip: FormDocument = {
      ...doc,
      steps: [
        {
          key: "main",
          fields: [
            {
              type: "repeater",
              key: "people",
              label: "Travellers",
              settings: { minRows: 1, maxRows: 2, rowLabel: "Traveller" },
              fields: [
                { type: "shortText", key: "name", label: "Name", required: true },
                { type: "number", key: "age", label: "Age" },
                {
                  type: "shortText",
                  key: "school",
                  label: "School",
                  visibleWhen: { op: "lt", args: [{ var: "age" }, 18] },
                },
              ],
            },
          ],
        },
      ],
    };
    render(
      <Form
        schema={trip}
        registry={registry}
        renderers={createRenderers(allRenderers)}
        onSubmit={onSubmit}
      />,
    );
    // One row to start with; it cannot be removed below minRows.
    expect(screen.getAllByLabelText(/^Name/)).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Remove: Traveller 1" })).toHaveProperty(
      "disabled",
      true,
    );
    await user.click(screen.getByRole("button", { name: /Add Traveller/ }));
    expect(screen.getByRole("button", { name: /Add Traveller/ })).toHaveProperty("disabled", true);
    const names = screen.getAllByLabelText(/^Name/);
    await user.type(names[0] as HTMLElement, "Sara");
    // The condition reads the age of the same row only.
    await user.type(screen.getAllByLabelText("Age")[1] as HTMLElement, "9");
    expect(screen.getAllByLabelText("School")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByText("This field is required.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Move up: Traveller 2" }));
    await user.type(screen.getAllByLabelText(/^Name/)[0] as HTMLElement, "Nima");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        people: [{ name: "Nima", age: 9 }, { name: "Sara" }],
      });
    });
  });

  it("shows calculated results, in rows too, and submits them", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const shop: FormDocument = {
      ...doc,
      steps: [
        {
          key: "main",
          fields: [
            {
              type: "repeater",
              key: "items",
              label: "Items",
              settings: { minRows: 1 },
              fields: [
                { type: "number", key: "qty", label: "Qty" },
                { type: "number", key: "price", label: "Price" },
                {
                  type: "calculated",
                  key: "line",
                  label: "Line total",
                  calculate: { op: "mul", args: [{ var: "qty" }, { var: "price" }] },
                },
              ],
            },
            { type: "number", key: "shipping", label: "Shipping" },
            {
              type: "calculated",
              key: "extra",
              label: "Shipping with tax",
              settings: { format: "currency", currency: "EUR" },
              calculate: { op: "mul", args: [{ var: "shipping" }, 1.2] },
            },
          ],
        },
      ],
    };
    render(
      <Form
        schema={shop}
        registry={registry}
        renderers={createRenderers(allRenderers)}
        onSubmit={onSubmit}
      />,
    );
    await user.type(screen.getByLabelText("Qty"), "3");
    await user.type(screen.getByLabelText("Price"), "2.5");
    await waitFor(() => {
      expect(screen.getByLabelText("Line total").textContent).toBe("7.5");
    });
    await user.type(screen.getByLabelText("Shipping"), "10");
    await waitFor(() => {
      expect(screen.getByLabelText("Shipping with tax").textContent).toBe("€12.00");
    });
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        items: [{ qty: 3, price: 2.5, line: 7.5 }],
        shipping: 10,
        extra: 12,
      });
    });
  });

  it("collects combobox, tags, ranking, picture and matrix answers", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const opts = [
      { value: "teh", label: "Tehran" },
      { value: "shz", label: "Shiraz" },
      { value: "tab", label: "Tabriz" },
    ];
    const meetup: FormDocument = {
      ...doc,
      steps: [
        {
          key: "main",
          fields: [
            { type: "combobox", key: "city", label: "City", settings: { options: opts } },
            { type: "multiSelect", key: "also", label: "Also", settings: { options: opts } },
            { type: "tags", key: "topics", label: "Topics" },
            { type: "ranking", key: "order", label: "Order", settings: { options: opts } },
            {
              type: "imageChoice",
              key: "venue",
              label: "Venue",
              settings: {
                options: [
                  { value: "roof", label: "Rooftop", image: "/roof.jpg" },
                  { value: "hall", label: "Hall", image: "/hall.jpg" },
                ],
              },
            },
            {
              type: "matrix",
              key: "feel",
              label: "Feel",
              settings: {
                rows: [
                  { value: "talks", label: "Talks" },
                  { value: "venue", label: "The venue" },
                ],
                columns: [
                  { value: "1", label: "Poor" },
                  { value: "2", label: "Good" },
                ],
              },
            },
          ],
        },
      ],
    };
    render(
      <Form
        schema={meetup}
        registry={registry}
        renderers={createRenderers(allRenderers)}
        onSubmit={onSubmit}
      />,
    );
    await user.type(screen.getByRole("combobox", { name: "City" }), "shi");
    await user.keyboard("{Enter}");
    expect(screen.getByRole("combobox", { name: "City" })).toHaveProperty("value", "Shiraz");
    await user.click(screen.getByRole("combobox", { name: "Also" }));
    await user.keyboard("{ArrowDown}{Enter}");
    await user.type(screen.getByLabelText("Topics"), "UX,a11y{Enter}");
    await user.click(screen.getByRole("button", { name: "Move up: Tabriz" }));
    await user.click(screen.getByLabelText("Hall"));
    await user.click(screen.getByLabelText("Talks: Good"));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByText("Answer every row.")).toBeTruthy();
    await user.click(screen.getByLabelText("The venue: Poor"));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        city: "shz",
        also: ["shz"],
        topics: ["UX", "a11y"],
        order: ["teh", "tab", "shz"],
        venue: "hall",
        feel: { talks: "2", venue: "1" },
      });
    });
  });

  it("uploads files through the upload prop and checks them first", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onSubmit = vi.fn();
    let n = 0;
    const upload = vi.fn((file: Blob & { name?: string }) => {
      n++;
      return Promise.resolve({
        id: `f${String(n)}`,
        name: file.name ?? "file",
        size: file.size,
        type: file.type,
      });
    });
    const docs: FormDocument = {
      ...doc,
      steps: [
        {
          key: "main",
          fields: [
            {
              type: "file",
              key: "slides",
              label: "Slides",
              required: true,
              settings: { accept: [".pdf"], maxFiles: 2, maxSize: 100 },
            },
            { type: "signature", key: "sign", label: "Sign" },
          ],
        },
      ],
    };
    const { rerender } = render(
      <Form
        schema={docs}
        registry={registry}
        renderers={createRenderers(allRenderers)}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getAllByText("Uploads are not available in this form.")).toHaveLength(2);
    rerender(
      <Form
        schema={docs}
        registry={registry}
        renderers={createRenderers(allRenderers)}
        onSubmit={onSubmit}
        upload={upload}
      />,
    );
    const input = screen.getByLabelText(/^Slides/);
    await user.upload(input, [
      new File(["x".repeat(500)], "big.pdf", { type: "application/pdf" }),
      new File(["%PDF"], "talk.pdf", { type: "application/pdf" }),
    ]);
    expect(await screen.findByText("big.pdf is too big.")).toBeTruthy();
    await screen.findByText(/Saved/);
    expect(upload).toHaveBeenCalledTimes(1);
    await user.upload(input, new File(["hi"], "notes.txt", { type: "text/plain" }));
    expect(await screen.findByText("notes.txt is not an allowed type.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        slides: [{ id: "f1", name: "talk.pdf", size: 4, type: "application/pdf" }],
      });
    });
  });

  it("changes a dependent list, loads remote options and collects an address", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(["9-10", { value: "10-11", label: "10 to 11" }])),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const order: FormDocument = {
      ...doc,
      steps: [
        {
          key: "main",
          fields: [
            {
              type: "select",
              key: "country",
              label: "Country",
              settings: {
                options: [
                  { value: "ir", label: "Iran" },
                  { value: "de", label: "Germany" },
                ],
              },
            },
            {
              type: "radio",
              key: "city",
              label: "City",
              settings: {
                options: [],
                optionsBy: {
                  field: "country",
                  options: {
                    ir: [{ value: "shz", label: "Shiraz" }],
                    de: [{ value: "ber", label: "Berlin" }],
                  },
                },
              },
            },
            {
              type: "select",
              key: "slot",
              label: "Slot",
              settings: { options: [], optionsUrl: "https://example.com/slots" },
            },
            { type: "address", key: "ship", label: "Ship to", required: true },
          ],
        },
      ],
    };
    render(
      <Form
        schema={order}
        registry={registry}
        renderers={createRenderers(allRenderers)}
        onSubmit={onSubmit}
      />,
    );
    await user.selectOptions(screen.getByRole("combobox", { name: "Country" }), "ir");
    await user.click(await screen.findByLabelText("Shiraz"));
    await user.selectOptions(screen.getByRole("combobox", { name: "Country" }), "de");
    // The answer for the other country is cleared; the new list is shown.
    expect(screen.queryByLabelText("Shiraz")).toBeNull();
    await user.click(screen.getByLabelText("Berlin"));
    await screen.findByRole("option", { name: "10 to 11" });
    await user.selectOptions(screen.getByLabelText("Slot"), "10-11");
    await user.type(screen.getByLabelText("Street and number"), "Unter den Linden 1");
    await user.type(screen.getByRole("textbox", { name: "City" }), "Berlin");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        country: "de",
        city: "ber",
        slot: "10-11",
        ship: { line1: "Unter den Linden 1", city: "Berlin" },
      });
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
