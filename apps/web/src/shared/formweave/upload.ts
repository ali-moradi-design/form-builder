import type { UploadFile } from "@formweave/react";

/**
 * Uploads to a published form's upload API, reporting progress. The server
 * checks size and type again and keeps the file until the answers name it.
 */
export function uploadTo(slug: string): UploadFile {
  return (file, { field, onProgress }) =>
    new Promise((resolve, reject) => {
      const body = new FormData();
      body.append("file", file, file.name ?? "file");
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `/api/forms/${encodeURIComponent(slug)}/uploads?field=${encodeURIComponent(field)}`,
      );
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(e.loaded / e.total);
      };
      xhr.onload = () => {
        if (xhr.status === 201)
          resolve(JSON.parse(xhr.responseText) as Awaited<ReturnType<UploadFile>>);
        else reject(new Error(`Upload failed (${String(xhr.status)}).`));
      };
      xhr.onerror = () => {
        reject(new Error("Upload failed."));
      };
      xhr.send(body);
    });
}

/**
 * Keeps files in the page only, for the builder's preview: nothing is sent,
 * and the "reference" is a local id.
 */
export const previewUpload: UploadFile = (file) =>
  Promise.resolve({
    id: `preview-${crypto.randomUUID()}`,
    name: file.name ?? "file",
    size: file.size,
    type: file.type,
  });
