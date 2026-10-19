import * as z from "zod/mini";
import { defineField, type FieldDefinition } from "../registry.js";

/**
 * A stored file, as kept in form values. The file itself lives wherever the
 * app's upload function put it; `id` points to it.
 *
 * @since 0.6.0
 */
export interface FileRef {
  /** Id given by the upload, for example a database key. */
  readonly id: string;
  /** Original file name. */
  readonly name: string;
  /** Size in bytes. */
  readonly size: number;
  /** Media type, for example `"application/pdf"`. */
  readonly type: string;
}

/**
 * Whether a file matches an `accept` list such as `[".pdf", "image/*"]`. An
 * empty or missing list accepts everything.
 *
 * @param accept - Extensions (`.pdf`), media types (`image/png`) or groups (`image/*`).
 * @param file - The file.
 * @param file.name - Its name, used for extension rules.
 * @param file.type - Its media type, used for type rules.
 * @returns `true` when the file is allowed.
 * @example
 * ```ts
 * acceptsFile([".pdf", "image/*"], { name: "a.JPG", type: "image/jpeg" }); // true
 * ```
 * @since 0.6.0
 */
export function acceptsFile(
  accept: readonly string[] | undefined,
  file: { readonly name: string; readonly type: string },
): boolean {
  if (!accept || accept.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept.some((a) => {
    const rule = a.trim().toLowerCase();
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

const bad = "invalidType";
const fileRef = /*#__PURE__*/ z.object(
  {
    id: z.string(bad).check(z.minLength(1, bad), z.maxLength(200, bad)),
    name: z.string(bad).check(z.minLength(1, bad), z.maxLength(255, bad)),
    size: z.int(bad).check(z.gte(0, bad)),
    type: z.string(bad).check(z.maxLength(200, bad)),
  },
  bad,
);

const MB = 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

/**
 * Settings of {@link file}.
 *
 * @since 0.6.0
 */
export interface FileSettings {
  /** Allowed files: extensions (`.pdf`), media types or groups (`image/*`). */
  readonly accept?: readonly string[] | undefined;
  /**
   * Most files.
   *
   * @defaultValue `1`
   */
  readonly maxFiles?: number | undefined;
  /**
   * Largest file in bytes, at most 50 MB.
   *
   * @defaultValue 10 MB
   */
  readonly maxSize?: number | undefined;
}

const fileSettings: z.ZodMiniType<FileSettings> = /*#__PURE__*/ z.object({
  accept: z.optional(z.array(z.string().check(z.minLength(1))).check(z.maxLength(30))),
  maxFiles: z.optional(z.int().check(z.gte(1), z.lte(20))),
  maxSize: z.optional(z.int().check(z.gte(1), z.lte(50 * MB))),
});

const checkFile = (accept: readonly string[] | undefined, maxSize: number) =>
  fileRef.check(
    z.refine((f) => f.size <= maxSize, { message: "fileTooBig", params: { max: maxSize } }),
    z.refine((f) => acceptsFile(accept, f), "fileType"),
  );

/**
 * Files people attach. Value: {@link FileRef}[]. The form only holds
 * references; the app uploads the files (see the React `upload` prop) and must
 * check on the server that each id is a file uploaded for this field.
 * Issue codes: `invalidType`, `tooMany`, `fileTooBig`, `fileType`.
 *
 * @since 0.6.0
 */
export const file: FieldDefinition<FileSettings, FileRef[]> = /*#__PURE__*/ defineField({
  type: "file",
  settings: fileSettings,
  defaultValue: () => undefined,
  validator: ({ settings }) =>
    z
      .array(checkFile(settings.accept, settings.maxSize ?? 10 * MB), "invalidType")
      .check(z.maxLength(settings.maxFiles ?? 1, "tooMany")),
});

/**
 * Settings of {@link imageUpload}.
 *
 * @since 0.6.0
 */
export interface ImageUploadSettings {
  /**
   * `"square"` crops to a square (shown in a circle for profile photos);
   * `"none"` keeps the whole picture, scaled down.
   *
   * @defaultValue `"square"`
   */
  readonly crop?: "square" | "none" | undefined;
  /**
   * Longest side of the saved image, in pixels.
   *
   * @defaultValue `1024`
   */
  readonly size?: number | undefined;
}

const imageSettings: z.ZodMiniType<ImageUploadSettings> = /*#__PURE__*/ z.object({
  crop: z.optional(z.enum(["square", "none"])),
  size: z.optional(z.int().check(z.gte(64), z.lte(4096))),
});

/**
 * One picture, cropped and scaled in the browser before upload. Value:
 * {@link FileRef} of a PNG, JPEG or WebP image up to 10 MB.
 * Issue codes: `invalidType`, `fileTooBig`, `fileType`.
 *
 * @since 0.6.0
 */
export const imageUpload: FieldDefinition<ImageUploadSettings, FileRef> = /*#__PURE__*/ defineField(
  {
    type: "imageUpload",
    settings: imageSettings,
    defaultValue: () => undefined,
    validator: () => checkFile(IMAGE_TYPES, 10 * MB),
  },
);

/**
 * A drawn signature, saved as a PNG image. Value: {@link FileRef}.
 * Issue codes: `invalidType`, `fileTooBig`, `fileType`.
 *
 * @since 0.6.0
 */
export const signature: FieldDefinition<Record<string, never>, FileRef> = /*#__PURE__*/ defineField(
  {
    type: "signature",
    settings: z.object({}),
    defaultValue: () => undefined,
    validator: () => checkFile(["image/png"], 2 * MB),
  },
);
