import type { FieldNode, FormDocument, Locale, LocalizedText, Step } from "@formweave/schema";

// The settings panel is itself a formweave form (dogfooding). These helpers
// build its document from the selected item and turn its values back into a
// patch. Keys of localized texts are `<prop>_<locale>`, e.g. `label_fa`.

/** Translates a builder message key. */
export type Translate = (key: string) => string;

type Values = Readonly<Record<string, unknown>>;

const PLACEHOLDER_TYPES = new Set([
  "shortText",
  "longText",
  "email",
  "number",
  "select",
  "url",
  "phone",
]);
/** Types without an answer to require (display-only, groups, hidden and calculated values). */
const NO_REQUIRED = new Set(["group", "heading", "paragraph", "divider", "hidden", "calculated"]);
const COUNTRY = /^[1-9]\d{0,3}$/;
const PARAM = /^[\w.-]{1,64}$/;
const CHOICE_TYPES = new Set(["select", "radio", "checkboxes"]);

/** Locales the document is written in, default first. */
export function docLocales(doc: FormDocument): Locale[] {
  const rest = (doc.locales.supported ?? []).filter((l) => l !== doc.locales.default);
  return [doc.locales.default, ...rest];
}

function textFields(
  prop: string,
  title: string,
  locales: readonly Locale[],
  languageName: Translate,
  type = "shortText",
): FieldNode[] {
  return locales.map((l) => ({
    type,
    key: `${prop}_${l}`,
    label: locales.length > 1 ? `${title} · ${languageName(l)}` : title,
  }));
}

function textValues(prop: string, value: LocalizedText | undefined, locales: readonly Locale[]) {
  const out: Record<string, string> = {};
  for (const [i, l] of locales.entries()) {
    out[`${prop}_${l}`] = typeof value === "string" ? (i === 0 ? value : "") : (value?.[l] ?? "");
  }
  return out;
}

/** Reads `<prop>_<locale>` values back into a localized text (or `undefined` when empty). */
export function readText(
  values: Values,
  prop: string,
  locales: readonly Locale[],
): LocalizedText | undefined {
  const entries = locales
    .map((l) => [l, values[`${prop}_${l}`]] as const)
    .filter((e): e is readonly [string, string] => typeof e[1] === "string" && e[1] !== "");
  if (entries.length === 0) return undefined;
  if (locales.length === 1) return entries[0]?.[1];
  return Object.fromEntries(entries);
}

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;
const str = (v: unknown): string | undefined => (typeof v === "string" && v !== "" ? v : undefined);

const settingNumber = (key: string, label: string, integer = true): FieldNode => ({
  type: "number",
  key,
  label,
  width: "half",
  settings: integer ? { min: 0, integer: true } : {},
});

/** Settings form of one field. */
export function fieldSettingsDocument(
  node: FieldNode,
  doc: FormDocument,
  t: Translate,
  languageName: Translate,
): { document: FormDocument; values: Record<string, unknown> } {
  const locales = docLocales(doc);
  const fields: FieldNode[] = [];
  if (node.type !== "divider") {
    const labelType = node.type === "paragraph" ? "longText" : "shortText";
    const labelTitle = node.type === "paragraph" ? t("text") : t("label");
    fields.push(...textFields("label", labelTitle, locales, languageName, labelType));
  }
  if (PLACEHOLDER_TYPES.has(node.type))
    fields.push(...textFields("placeholder", t("placeholder"), locales, languageName));
  if (node.type !== "divider" && node.type !== "paragraph")
    fields.push(...textFields("help", t("help"), locales, languageName));
  fields.push({
    type: "shortText",
    key: "key",
    label: t("key"),
    help: t("keyHelp"),
    required: true,
  });
  if (!NO_REQUIRED.has(node.type))
    fields.push({ type: "switch", key: "required", label: t("required"), width: "half" });
  if (!NO_REQUIRED.has(node.type) || node.type === "group" || node.type === "calculated")
    fields.push({ type: "switch", key: "half", label: t("halfWidth"), width: "half" });

  const s = node.settings ?? {};
  const values: Record<string, unknown> = {
    ...textValues("label", node.label, locales),
    ...textValues("placeholder", node.placeholder, locales),
    ...textValues("help", node.help, locales),
    key: node.key,
    required: node.required === true,
    half: node.width === "half",
  };
  const settingKeys: string[] = [];
  const addNumber = (key: string, label: string, integer = true) => {
    fields.push(settingNumber(key, label, integer));
    values[key] = num(s[key]);
    settingKeys.push(key);
  };
  if (node.type === "shortText" || node.type === "longText") {
    addNumber("minLength", t("minLength"));
    addNumber("maxLength", t("maxLength"));
  } else if (node.type === "number") {
    addNumber("min", t("min"), false);
    addNumber("max", t("max"), false);
    fields.push({ type: "switch", key: "integer", label: t("integer") });
    values.integer = s.integer === true;
  } else if (node.type === "checkboxes") {
    addNumber("minSelected", t("minSelected"));
    addNumber("maxSelected", t("maxSelected"));
  } else if (node.type === "repeater") {
    addNumber("minRows", t("minRows"));
    addNumber("maxRows", t("maxRows"));
    fields.push(...textFields("rowLabel", t("rowLabel"), locales, languageName));
    Object.assign(values, textValues("rowLabel", s.rowLabel as LocalizedText | undefined, locales));
  } else if (node.type === "colorSet") {
    addNumber("minColors", t("minColors"));
    addNumber("maxColors", t("maxColors"));
  } else if (node.type === "rating") {
    fields.push({
      type: "number",
      key: "max",
      label: t("maxStars"),
      settings: { min: 3, max: 10, integer: true },
    });
    values.max = num(s.max) ?? 5;
  } else if (node.type === "nps") {
    fields.push(...textFields("lowLabel", t("lowLabel"), locales, languageName));
    fields.push(...textFields("highLabel", t("highLabel"), locales, languageName));
    Object.assign(values, textValues("lowLabel", s.lowLabel as LocalizedText | undefined, locales));
    Object.assign(
      values,
      textValues("highLabel", s.highLabel as LocalizedText | undefined, locales),
    );
  } else if (node.type === "currency") {
    fields.push({
      type: "shortText",
      key: "currency",
      label: t("currency"),
      help: t("currencyHelp"),
    });
    values.currency = str(s.currency);
    addNumber("min", t("min"), false);
    addNumber("max", t("max"), false);
  } else if (node.type === "calculated") {
    fields.push({
      type: "select",
      key: "format",
      label: t("format"),
      settings: {
        options: (["number", "currency", "percent"] as const).map((value) => ({
          value,
          label: t(`format_${value}`),
        })),
      },
    });
    values.format = str(s.format) ?? "number";
    fields.push({
      type: "shortText",
      key: "currency",
      label: t("currency"),
      help: t("currencyHelp"),
      visibleWhen: { op: "eq", args: [{ var: "format" }, "currency"] },
    });
    values.currency = str(s.currency);
    addNumber("decimals", t("decimals"));
  } else if (node.type === "slider" || node.type === "rangeSlider") {
    addNumber("min", t("min"), false);
    addNumber("max", t("max"), false);
    addNumber("step", t("step"), false);
  } else if (node.type === "phone") {
    fields.push({
      type: "shortText",
      key: "defaultCountry",
      label: t("defaultCountry"),
      help: t("defaultCountryHelp"),
    });
    values.defaultCountry = str(s.defaultCountry);
  } else if (node.type === "hidden") {
    fields.push({ type: "shortText", key: "fromUrl", label: t("fromUrl"), help: t("fromUrlHelp") });
    values.fromUrl = str(s.fromUrl);
  } else if (node.type === "time" || node.type === "dateTime") {
    for (const key of ["min", "max"] as const) {
      fields.push({
        type: node.type,
        key,
        label: t(key === "min" ? "minTime" : "maxTime"),
        width: "half",
      });
      values[key] = str(s[key]);
    }
  } else if (node.type === "date" || node.type === "dateRange") {
    for (const key of ["min", "max"] as const) {
      fields.push({
        type: "date",
        key,
        label: t(key === "min" ? "minDate" : "maxDate"),
        width: "half",
      });
      values[key] = str(s[key]);
    }
  }
  return {
    document: {
      schemaVersion: 1,
      id: `settings-${node.key}`,
      title: t("settings"),
      locales: { default: locales[0] ?? "en" },
      steps: [{ key: "settings", fields }],
    },
    values,
  };
}

/** Turns settings-form values into a field patch (everything but the key). */
export function fieldPatch(
  node: FieldNode,
  values: Values,
  locales: readonly Locale[],
): Partial<Omit<FieldNode, "key" | "fields">> {
  const settings = new Map<string, unknown>(Object.entries(node.settings ?? {}));
  const set = (key: string, value: unknown) => {
    if (value === undefined) settings.delete(key);
    else settings.set(key, value);
  };
  if (node.type === "shortText" || node.type === "longText") {
    set("minLength", num(values.minLength));
    set("maxLength", num(values.maxLength));
  } else if (node.type === "number") {
    set("min", num(values.min));
    set("max", num(values.max));
    set("integer", values.integer === true ? true : undefined);
  } else if (node.type === "checkboxes") {
    set("minSelected", num(values.minSelected));
    set("maxSelected", num(values.maxSelected));
  } else if (
    node.type === "date" ||
    node.type === "dateRange" ||
    node.type === "time" ||
    node.type === "dateTime"
  ) {
    set("min", str(values.min));
    set("max", str(values.max));
  } else if (node.type === "repeater") {
    const rows = (v: unknown) => {
      const n = num(v);
      return n !== undefined && Number.isInteger(n) && n >= 0 && n <= 100 ? n : undefined;
    };
    set("minRows", rows(values.minRows));
    set("maxRows", rows(values.maxRows));
    set("rowLabel", readText(values, "rowLabel", locales));
  } else if (node.type === "colorSet") {
    const count = (v: unknown) => {
      const n = num(v);
      return n !== undefined && Number.isInteger(n) && n >= 1 && n <= 12 ? n : undefined;
    };
    set("minColors", count(values.minColors));
    set("maxColors", count(values.maxColors));
  } else if (node.type === "rating") {
    const max = num(values.max);
    set(
      "max",
      max !== undefined && Number.isInteger(max) && max >= 3 && max <= 10 ? max : undefined,
    );
  } else if (node.type === "nps") {
    set("lowLabel", readText(values, "lowLabel", locales));
    set("highLabel", readText(values, "highLabel", locales));
  } else if (node.type === "currency") {
    const code = str(values.currency)?.toUpperCase();
    set("currency", code && /^[A-Z]{3}$/.test(code) ? code : undefined);
    set("min", num(values.min));
    set("max", num(values.max));
  } else if (node.type === "calculated") {
    const format = str(values.format);
    set("format", format === "currency" || format === "percent" ? format : undefined);
    const code = str(values.currency)?.toUpperCase();
    set("currency", format === "currency" && code && /^[A-Z]{3}$/.test(code) ? code : undefined);
    const decimals = num(values.decimals);
    set(
      "decimals",
      decimals !== undefined && Number.isInteger(decimals) && decimals >= 0 && decimals <= 6
        ? decimals
        : undefined,
    );
  } else if (node.type === "slider" || node.type === "rangeSlider") {
    // min and max are required by the slider; keep the old ones while a box is empty.
    set("min", num(values.min) ?? settings.get("min") ?? 0);
    set("max", num(values.max) ?? settings.get("max") ?? 10);
    const step = num(values.step);
    set("step", step !== undefined && step > 0 ? step : undefined);
  } else if (node.type === "phone") {
    const code = str(values.defaultCountry);
    set("defaultCountry", code && COUNTRY.test(code) ? code : undefined);
  } else if (node.type === "hidden") {
    const name = str(values.fromUrl);
    set("fromUrl", name && PARAM.test(name) ? name : undefined);
  }
  return {
    label: readText(values, "label", locales),
    placeholder: PLACEHOLDER_TYPES.has(node.type)
      ? readText(values, "placeholder", locales)
      : undefined,
    help: readText(values, "help", locales),
    required: values.required === true && !NO_REQUIRED.has(node.type) ? true : undefined,
    width: values.half === true ? "half" : undefined,
    settings: settings.size > 0 || node.settings ? Object.fromEntries(settings) : undefined,
  };
}

/** Whether a field type has an options list. */
export const hasOptions = (type: string): boolean => CHOICE_TYPES.has(type);

/** Keys that can name an answer. */
export const KEY_PATTERN = /^[A-Za-z_][\w]*$/;

/** Settings form of a step. */
export function stepSettingsDocument(
  step: Step,
  doc: FormDocument,
  t: Translate,
  languageName: Translate,
) {
  const locales = docLocales(doc);
  return {
    document: {
      schemaVersion: 1,
      id: `step-${step.key}`,
      title: t("step"),
      locales: { default: locales[0] ?? "en" },
      steps: [
        {
          key: "step",
          fields: [
            ...textFields("title", t("title"), locales, languageName),
            ...textFields("description", t("description"), locales, languageName, "longText"),
          ],
        },
      ],
    } satisfies FormDocument,
    values: {
      ...textValues("title", step.title, locales),
      ...textValues("description", step.description, locales),
    },
  };
}

/** Languages the builder offers for a form. */
export const LANGUAGES = ["en", "fa"] as const;

/** Settings form of the form itself. */
export function formSettingsDocument(doc: FormDocument, t: Translate, languageName: Translate) {
  const locales = docLocales(doc);
  const choices = LANGUAGES.map((l) => ({ value: l, label: languageName(l) }));
  return {
    document: {
      schemaVersion: 1,
      id: "form-settings",
      title: t("form"),
      locales: { default: locales[0] ?? "en" },
      steps: [
        {
          key: "form",
          fields: [
            ...textFields("title", t("title"), locales, languageName),
            ...textFields("description", t("description"), locales, languageName, "longText"),
            {
              type: "checkboxes",
              key: "languages",
              label: t("languages"),
              required: true,
              settings: { options: choices },
            },
            {
              type: "radio",
              key: "default",
              label: t("defaultLanguage"),
              required: true,
              settings: { options: choices },
            },
          ],
        },
      ],
    } satisfies FormDocument,
    values: {
      ...textValues("title", doc.title, locales),
      ...textValues("description", doc.description, locales),
      languages: locales,
      default: doc.locales.default,
    },
  };
}

/** Turns form-settings values into a document patch. */
export function formPatch(
  doc: FormDocument,
  values: Values,
): Partial<Pick<FormDocument, "title" | "description" | "locales">> {
  const locales = docLocales(doc);
  const chosen: unknown = values.languages;
  const picked: readonly string[] = Array.isArray(chosen)
    ? LANGUAGES.filter((l) => chosen.includes(l))
    : locales;
  const supported = picked.length > 0 ? picked : locales;
  const wanted = typeof values.default === "string" ? values.default : doc.locales.default;
  const def = supported.includes(wanted) ? wanted : (supported[0] ?? "en");
  return {
    title: readText(values, "title", locales) ?? doc.title,
    description: readText(values, "description", locales),
    locales: { default: def, supported: [...supported] },
  };
}
