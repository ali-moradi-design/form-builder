import type { FormDocument } from "@formweave/schema";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Form } from "./remote.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const doc: FormDocument = {
  schemaVersion: 1,
  id: "t",
  title: "Hi",
  locales: { default: "en" },
  steps: [
    { key: "a", fields: [{ type: "shortText", key: "name", label: "Name", required: true }] },
  ],
};

describe("remote Form", () => {
  it("loads a published form, posts the answers and says thanks", async () => {
    const user = userEvent.setup();
    const calls: { url: string; body?: unknown }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url, body: init?.body ? JSON.parse(init.body as string) : undefined });
        if (init?.method === "POST")
          return Promise.resolve(
            new Response(JSON.stringify({ id: "r1", version: 2 }), { status: 201 }),
          );
        return Promise.resolve(new Response(JSON.stringify({ version: 2, document: doc })));
      }),
    );
    const onSubmitted = vi.fn();
    render(<Form formId="hi" endpoint="https://forms.example.com" onSubmitted={onSubmitted} />);
    expect(screen.getByText("Loading the form…")).toBeTruthy();
    await user.type(await screen.findByLabelText(/^Name/), "Sara");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByRole("status")).toHaveProperty(
      "textContent",
      "Thank you! Your answers were sent.",
    );
    expect(calls).toEqual([
      { url: "https://forms.example.com/api/forms/hi", body: undefined },
      {
        url: "https://forms.example.com/api/forms/hi/responses",
        body: { values: { name: "Sara" }, locale: "en" },
      },
    ]);
    expect(onSubmitted).toHaveBeenCalledWith({ id: "r1", version: 2 });
  });

  it("says when a form is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("{}", { status: 404 }))),
    );
    render(<Form formId="nope" />);
    await waitFor(() => {
      expect(screen.getByText("This form is not available.")).toBeTruthy();
    });
  });
});
