import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

/**
 * Parts of an address besides the first line.
 *
 * @since 0.6.0
 */
export type AddressPart = "line2" | "city" | "region" | "postalCode" | "country";

/**
 * Value of {@link address}. Only `line1` is always present.
 *
 * @since 0.6.0
 */
export interface AddressValue {
  /** Street and number. */
  readonly line1: string;
  /** Flat, floor or building. */
  readonly line2?: string | undefined;
  /** City or town. */
  readonly city?: string | undefined;
  /** State, province or region. */
  readonly region?: string | undefined;
  /** Postal or ZIP code. */
  readonly postalCode?: string | undefined;
  /** Country, as an ISO 3166-1 alpha-2 code such as `"IR"`, or a name. */
  readonly country?: string | undefined;
}

/**
 * Settings of {@link address}.
 *
 * @since 0.6.0
 */
export interface AddressSettings {
  /**
   * Parts to ask for, besides the first line.
   *
   * @defaultValue all of them
   */
  readonly parts?: readonly AddressPart[] | undefined;
  /** Parts that need an answer once the address is started. `line1` always does. */
  readonly requiredParts?: readonly AddressPart[] | undefined;
}

const PARTS = ["line2", "city", "region", "postalCode", "country"] as const;
const part = /*#__PURE__*/ z.enum(PARTS);

const addressSettings: z.ZodMiniType<AddressSettings> = /*#__PURE__*/ z.object({
  parts: z.optional(z.array(part)),
  requiredParts: z.optional(z.array(part)),
});

const line = /*#__PURE__*/ z.optional(z.string("invalidType").check(z.maxLength(200, "tooLong")));

/**
 * A postal address in parts. Value: {@link AddressValue}. Issue codes:
 * `invalidType`, `tooLong`, `incompleteAddress`.
 *
 * @since 0.6.0
 */
export const address: FieldDefinition<AddressSettings, AddressValue> = /*#__PURE__*/ defineField({
  type: "address",
  settings: addressSettings,
  defaultValue: () => undefined,
  isEmpty: (v) =>
    v === undefined ||
    v === null ||
    (typeof v === "object" &&
      Object.values(v).every((x) => x === undefined || (typeof x === "string" && !x.trim()))),
  validator: ({ settings }) => {
    const needed = ["line1", ...(settings.requiredParts ?? [])] as const;
    return z
      .object(
        { line1: line, line2: line, city: line, region: line, postalCode: line, country: line },
        "invalidType",
      )
      .check(
        z.refine((v) => needed.every((k) => (v[k] ?? "").trim() !== ""), "incompleteAddress"),
      ) as unknown as z.ZodMiniType<AddressValue>;
  },
});
