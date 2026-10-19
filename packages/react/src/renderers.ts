import type { CompiledField, FieldState } from "@formweave/engine";
import type { FileRef } from "@formweave/engine/fields";
import type { Locale } from "@formweave/schema";
import type { ComponentType, ReactNode, Ref } from "react";

/**
 * Everything a field renderer needs to draw one field.
 *
 * Renderers are plain components: draw the label, the control and the
 * messages, and pass `value` and `onChange` through. Accessibility wiring
 * (`id`, `aria-describedby`, `aria-invalid`) comes ready-made.
 *
 * @since 0.2.0
 */
export interface FieldRendererProps {
  /** The compiled field, including its node and parsed settings. */
  readonly field: CompiledField;
  /** Visible, required and disabled state. */
  readonly state: FieldState;
  /** Reader's locale. */
  readonly locale: Locale;
  /** Form's default locale, used when a text has no entry for `locale`. */
  readonly fallbackLocale: Locale;
  /** Id for the control; the label's `htmlFor` should point to it. */
  readonly id: string;
  /** Name of the value (the field key). */
  readonly name: string;
  /** Label text in the reader's locale. */
  readonly label: string;
  /** Help text in the reader's locale, or `""`. */
  readonly help: string;
  /** Placeholder in the reader's locale, or `""`. */
  readonly placeholder: string;
  /** Error message to show, or `undefined` when the value is fine. */
  readonly error: string | undefined;
  /** Id of the element holding help and error text, for `aria-describedby`. */
  readonly describedBy: string;
  /** Current value. */
  readonly value: unknown;
  /**
   * Reports a new value.
   *
   * @param value - The new value.
   */
  readonly onChange: (value: unknown) => void;
  /** Marks the field as touched. */
  readonly onBlur: () => void;
  /** Ref for the control, so the form can focus it on error. */
  readonly inputRef: Ref<HTMLElement>;
  /** Rendered child fields, for container types such as groups. */
  readonly children?: ReactNode;
  /** Row controls, for row types such as repeaters. */
  readonly rows?: RowsApi | undefined;
  /** Stores a file and returns its reference, from the form's `upload` prop. */
  readonly upload?: UploadFile | undefined;
}

/**
 * Stores one file (on your server, a storage bucket, …) and returns its
 * reference. Called by file, image and signature fields.
 *
 * @param file - The file or image to store.
 * @param info - The field key and a callback for progress from 0 to 1.
 * @returns The stored file's reference; `url` may be added for previews.
 * @since 0.6.0
 */
export type UploadFile = (
  file: Blob & { readonly name?: string },
  info: { readonly field: string; readonly onProgress?: (done: number) => void },
) => Promise<FileRef & { readonly url?: string }>;

/**
 * What a row type's renderer (such as a repeater) gets to draw its rows.
 *
 * @since 0.6.0
 */
export interface RowsApi {
  /** A stable React key for each row, in order. */
  readonly keys: readonly string[];
  /** Whether another row may be added (below `maxRows`). */
  readonly canAdd: boolean;
  /** Whether a row may be removed (above `minRows`). */
  readonly canRemove: boolean;
  /** Most rows allowed. */
  readonly max: number;
  /** Adds an empty row at the end. */
  readonly add: () => void;
  /**
   * Removes a row.
   *
   * @param index - The row's position.
   */
  readonly remove: (index: number) => void;
  /**
   * Moves a row.
   *
   * @param from - Its position now.
   * @param to - Its new position.
   */
  readonly move: (from: number, to: number) => void;
  /**
   * Renders the fields of one row.
   *
   * @param index - The row's position.
   * @returns The row's fields.
   */
  readonly render: (index: number) => ReactNode;
}

/**
 * Draws one field type.
 *
 * @since 0.2.0
 */
export interface FieldRenderer {
  /** The field `type` it draws, for example `"shortText"`. */
  readonly type: string;
  /** The component. */
  readonly component: ComponentType<FieldRendererProps>;
}

/**
 * Connects a field type to the component that draws it.
 *
 * @param type - The field type.
 * @param component - The component.
 * @returns The renderer.
 * @since 0.2.0
 */
export function defineRenderer(
  type: string,
  component: ComponentType<FieldRendererProps>,
): FieldRenderer {
  return { type, component };
}

/**
 * Renderers available to a form, looked up by field type.
 *
 * @since 0.2.0
 */
export type RendererMap = ReadonlyMap<string, ComponentType<FieldRendererProps>>;

/**
 * Builds a {@link RendererMap}. Pass only the renderers your forms use to keep
 * the bundle small; a later renderer replaces an earlier one for the same type.
 *
 * @param renderers - The renderers.
 * @returns The map.
 * @since 0.2.0
 */
export function createRenderers(renderers: Iterable<FieldRenderer>): RendererMap {
  const map = new Map<string, ComponentType<FieldRendererProps>>();
  for (const r of renderers) map.set(r.type, r.component);
  return map;
}
