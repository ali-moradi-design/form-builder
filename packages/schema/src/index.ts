/**
 * Version of the form document format that this package describes.
 *
 * Every form document stores the version it was written with in its
 * `schemaVersion` field. Documents with an older version are upgraded by
 * `migrate` from `@formweave/engine` before they are used.
 *
 * @since 0.1.0
 */
export const SCHEMA_VERSION = 1 as const;
