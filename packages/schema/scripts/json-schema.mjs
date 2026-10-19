// Writes dist/form-document.schema.json: the JSON Schema of a form document,
// for editors (Monaco, VS Code "$schema"). Rules that span the document
// (unique keys, known field references) are only checked by parseFormDocument.
import { writeFileSync } from "node:fs";
import * as z from "zod/mini";
import { formDocumentSchema } from "../dist/meta.js";

const schema = {
  ...z.toJSONSchema(formDocumentSchema, { unrepresentable: "any" }),
  $id: "https://github.com/ali-moradi-design/form-builder/schema/form-document.json",
  title: "formweave form document",
};
writeFileSync(
  new URL("../dist/form-document.schema.json", import.meta.url),
  `${JSON.stringify(schema, null, 2)}\n`,
);
