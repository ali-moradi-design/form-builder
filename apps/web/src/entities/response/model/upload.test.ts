import type { FormDocument } from "@formcanvas/schema";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createForm, getUpload, openDb, publishForm, tables, type Db } from "@/shared/db";
import { acceptResponse } from "./accept";
import { cleanName, receiveUpload, sniff } from "./upload";

const doc: FormDocument = {
  schemaVersion: 1,
  id: "x",
  title: "Speakers",
  locales: { default: "en" },
  steps: [
    {
      key: "a",
      fields: [
        {
          type: "file",
          key: "slides",
          settings: { accept: [".pdf"], maxFiles: 2, maxSize: 1000 },
        },
        { type: "signature", key: "sign" },
        {
          type: "repeater",
          key: "people",
          fields: [{ type: "imageUpload", key: "photo" }],
        },
      ],
    },
  ],
};

const PDF = new TextEncoder().encode("%PDF-1.7 tiny");
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

let db: Db;
let formId = "";
beforeAll(async () => {
  db = await openDb(undefined, "memory://");
  await db.insert(tables.user).values({ id: "u", name: "U", email: "u@example.com" });
  formId = await createForm(db, "u", doc);
  await publishForm(db, "u", formId, "Speakers");
}, 30_000);

const send = (field: string, name: string, type: string, data: Uint8Array) =>
  receiveUpload(db, { slug: "speakers", field, ip: "1.2.3.4", name, type, data });

describe("uploads", () => {
  it("checks the field, size and real type", async () => {
    expect(await send("nope", "a.pdf", "application/pdf", PDF)).toEqual({
      ok: false,
      reason: "notFound",
    });
    expect(await send("slides", "a.pdf", "application/pdf", new Uint8Array(2000))).toEqual({
      ok: false,
      reason: "tooLarge",
    });
    // Says PDF, is not.
    expect(await send("slides", "a.pdf", "application/pdf", new Uint8Array(10))).toEqual({
      ok: false,
      reason: "type",
    });
    // Is a PNG, the field wants PDF.
    expect(await send("slides", "a.pdf", "application/pdf", PNG)).toEqual({
      ok: false,
      reason: "type",
    });
    expect(sniff(PNG)).toBe("image/png");
    expect(cleanName("..\\\\evil/../a\u0000b.pdf")).toBe("ab.pdf");
  });

  it("accepts answers that name pending files of the right field, once", async () => {
    const slides = await send("slides", "talk.pdf", "application/pdf", PDF);
    const sign = await send("sign", "signature.png", "image/png", PNG);
    const photo = await send("photo", "photo.png", "image/png", PNG);
    if (!slides.ok || !sign.ok || !photo.ok) throw new Error("upload failed");

    // A reference to a file of another field is refused.
    const wrong = await acceptResponse(db, "speakers", { sign: photo.file });
    expect(wrong).toMatchObject({ ok: false, issues: [{ key: "sign", code: "fileMissing" }] });

    const ok = await acceptResponse(db, "speakers", {
      slides: [{ ...slides.file, name: "renamed.pdf", size: 1 }],
      sign: sign.file,
      people: [{ photo: photo.file }],
    });
    if (!ok.ok) throw new Error("not accepted");
    // Name and size come from storage, not from the sender.
    expect(ok.data.slides).toEqual([slides.file]);
    const [row] = await db
      .select({ responseId: tables.upload.responseId })
      .from(tables.upload)
      .where(eq(tables.upload.id, photo.file.id));
    expect(row?.responseId).toBe(ok.id);
    expect((await getUpload(db, "u", formId, slides.file.id))?.data).toEqual(PDF);
    expect(await getUpload(db, "someone", formId, slides.file.id)).toBeUndefined();

    // The same file cannot be used by a second response.
    const again = await acceptResponse(db, "speakers", { sign: sign.file });
    expect(again).toMatchObject({ ok: false, issues: [{ key: "sign", code: "fileMissing" }] });
  });
});
