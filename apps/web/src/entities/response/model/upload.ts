import { compile, createRegistry, type CompiledField, type CompiledForm } from "@formweave/engine";
import { acceptsFile, type FileSettings } from "@formweave/engine/fields";
import { allFields } from "@formweave/engine/fields/all";
import { addUpload, getLiveForm, uploadBytes, type Db, type StoredFile } from "@/shared/db";
import { createRateLimiter } from "@/shared/lib";
import { FILE_TYPES } from "./accept";

const registry = createRegistry(allFields);
const MB = 1024 * 1024;

/** Uploads per address and form per minute. */
const limiter = createRateLimiter(Number(process.env.UPLOAD_RATE_LIMIT ?? 30), 60_000);

/** The largest upload any field allows; bigger requests are refused early. */
export const MAX_UPLOAD = 50 * MB;

/** All stored files together may use this much (`UPLOAD_QUOTA_MB`, default 2 GB). */
const QUOTA = Number(process.env.UPLOAD_QUOTA_MB ?? 2048) * MB;
/** Files not yet part of a response, per form (`UPLOAD_PENDING_MB`, default 200 MB). */
const PENDING_QUOTA = Number(process.env.UPLOAD_PENDING_MB ?? 200) * MB;

/** Finds a field by key, inside repeater rows too. */
function findField(form: CompiledForm, key: string): CompiledField | undefined {
  const own = form.fields.get(key);
  if (own) return own;
  for (const f of form.fields.values()) {
    const inner = f.rows && findField(f.rows, key);
    if (inner) return inner;
  }
  return undefined;
}

/** Limits for a file field: allowed types and largest size. */
function limitsOf(field: CompiledField): {
  accept: readonly string[] | undefined;
  maxSize: number;
} {
  if (field.node.type === "imageUpload")
    return { accept: ["image/png", "image/jpeg", "image/webp"], maxSize: 10 * MB };
  if (field.node.type === "signature") return { accept: ["image/png"], maxSize: 2 * MB };
  const s = field.settings as FileSettings;
  return { accept: s.accept, maxSize: s.maxSize ?? 10 * MB };
}

/** File name extensions that fit each recognised type. */
const EXTENSIONS: Readonly<Record<string, readonly string[]>> = {
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/gif": ["gif"],
  "image/webp": ["webp"],
  "application/pdf": ["pdf"],
};

/** The media type the bytes really are, for the kinds we can recognise. */
export function sniff(data: Uint8Array): string | undefined {
  const starts = (...b: number[]) => b.every((x, i) => data[i] === x);
  if (starts(0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (starts(0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (starts(0x25, 0x50, 0x44, 0x46)) return "application/pdf";
  if (starts(0x52, 0x49, 0x46, 0x46) && data[8] === 0x57 && data[9] === 0x45) return "image/webp";
  return undefined;
}

/** A file name without folders or control characters, at most 255 characters. */
export function cleanName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const printable = Array.from(base).filter(
    (c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127,
  );
  return printable.join("").trim().slice(0, 255) || "file";
}

/** Outcome of {@link receiveUpload}. */
export type UploadResult =
  | { readonly ok: true; readonly file: StoredFile }
  | {
      readonly ok: false;
      readonly reason: "notFound" | "tooLarge" | "type" | "rateLimited" | "quota";
      readonly retryAfter?: number;
    };

/**
 * Stores a file for a file, image or signature field of a live form. The
 * size and type are checked against the field, and the type against the
 * bytes for kinds we can recognise (images, PDF). The file stays pending until
 * a submission names it.
 */
export async function receiveUpload(
  db: Db,
  input: {
    readonly slug: string;
    readonly field: string;
    readonly ip: string;
    readonly name: string;
    readonly type: string;
    readonly data: Uint8Array;
  },
): Promise<UploadResult> {
  const limit = limiter.hit(`${input.ip}|${input.slug}`);
  if (!limit.ok) return { ok: false, reason: "rateLimited", retryAfter: limit.retryAfter };
  const live = await getLiveForm(db, input.slug);
  if (!live) return { ok: false, reason: "notFound" };
  const field = findField(compile(live.document, { registry }), input.field);
  if (!field || !FILE_TYPES.has(field.node.type)) return { ok: false, reason: "notFound" };
  const { accept, maxSize } = limitsOf(field);
  if (input.data.byteLength > maxSize) return { ok: false, reason: "tooLarge" };
  const real = sniff(input.data);
  const claimed = input.type.toLowerCase().split(";")[0]?.trim() || "application/octet-stream";
  // A file that looks like a known kind must say so; others keep their claimed type.
  const type =
    real ?? (claimed.startsWith("image/") || claimed === "application/pdf" ? "" : claimed);
  const name = cleanName(input.name);
  if (!type || !acceptsFile(accept, { name, type })) return { ok: false, reason: "type" };
  // A recognised file must also be named like one, so ".pdf" rules can't pass a PNG.
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (real && !(EXTENSIONS[real] ?? []).includes(ext)) return { ok: false, reason: "type" };
  // Anyone can upload to a public form, so storage is capped before it fills the disk.
  const size = input.data.byteLength;
  if (
    (await uploadBytes(db, live.formId)) + size > PENDING_QUOTA ||
    (await uploadBytes(db)) + size > QUOTA
  )
    return { ok: false, reason: "quota" };
  const file = await addUpload(db, {
    formId: live.formId,
    fieldKey: input.field,
    name,
    type,
    data: input.data,
  });
  return { ok: true, file };
}
