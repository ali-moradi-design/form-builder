---
"@formcanvas/engine": minor
"@formcanvas/react": minor
---

Add `file`, `imageUpload` and `signature` fields. Values are `FileRef`s; files are stored by the new `upload` prop of `<Form>` (`UploadFile`), with progress. Image uploads are cropped and scaled in the browser; signatures can be drawn or typed. New `acceptsFile` helper and issue codes `fileTooBig`, `fileType` and `fileMissing`.
