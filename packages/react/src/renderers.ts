import type { CompiledField, FieldState } from "@formweave/engine";
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
