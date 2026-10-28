import { createTranslator, IntlErrorCode, type IntlError } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import fa from "../../../messages/fa.json";

type Tree = { [key: string]: string | Tree };

function keys(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([k, v]) =>
    typeof v === "string" ? [prefix + k] : keys(v, `${prefix}${k}.`),
  );
}

// Literal `<`, `{` and `}` must be quoted ('<slug>'), or the message fails to parse.
describe.each([
  ["en", en],
  ["fa", fa],
] as const)("%s messages", (locale, messages) => {
  it("all parse", () => {
    const invalid: string[] = [];
    const t = createTranslator({
      locale,
      messages,
      onError: (error: IntlError) => {
        if (error.code === IntlErrorCode.INVALID_MESSAGE) invalid.push(error.message);
      },
    });
    // Keys come from the file at run time, so the typed key check is skipped.
    const loose = t as unknown as { markup(key: string, values: object): string };
    for (const key of keys(messages)) loose.markup(key, {});
    expect(invalid).toEqual([]);
  });
});
