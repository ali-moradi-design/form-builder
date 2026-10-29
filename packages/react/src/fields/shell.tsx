import type { ReactNode } from "react";
import type { FieldRendererProps } from "../renderers.js";

/**
 * Props of {@link FieldShell}.
 *
 * @since 0.2.0
 */
export interface FieldShellProps {
  /** The renderer props of the field. */
  readonly props: FieldRendererProps;
  /** The control: an input, a list of choices, and so on. */
  readonly children: ReactNode;
  /**
   * Render the label as a `<legend>` in a `<fieldset>`, for groups of controls
   * such as radio buttons.
   *
   * @defaultValue `false`
   */
  readonly asFieldset?: boolean | undefined;
}

/**
 * Shared frame of a field: label, required mark, control, help and error.
 * Custom renderers can use it to look like the built-in ones.
 *
 * @param shellProps - See {@link FieldShellProps}.
 * @returns The field frame.
 * @since 0.2.0
 */
export function FieldShell({ props, children, asFieldset }: FieldShellProps): ReactNode {
  const { id, label, help, error, state, describedBy, field } = props;
  const width = field.node.width ?? "full";
  const labelContent = (
    <>
      {label}
      {state.required && (
        <span className="fc-required" aria-hidden="true">
          *
        </span>
      )}
    </>
  );
  const messages = (
    <div id={describedBy} className="fc-messages">
      {help && <p className="fc-help">{help}</p>}
      {error && (
        <p className="fc-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
  if (asFieldset) {
    return (
      <fieldset
        className="fc-field"
        data-width={width}
        data-invalid={error ? "" : undefined}
        aria-describedby={describedBy}
        disabled={state.disabled}
      >
        <legend className="fc-label">{labelContent}</legend>
        {children}
        {messages}
      </fieldset>
    );
  }
  return (
    <div className="fc-field" data-width={width} data-invalid={error ? "" : undefined}>
      <label className="fc-label" htmlFor={id}>
        {labelContent}
      </label>
      {children}
      {messages}
    </div>
  );
}

/**
 * Accessibility and state attributes shared by single controls.
 *
 * @param p - The renderer props.
 * @returns Attributes to spread on the control.
 * @since 0.2.0
 */
export function controlProps(p: FieldRendererProps): {
  id: string;
  name: string;
  "aria-describedby": string;
  "aria-invalid": boolean;
  "aria-required": boolean;
  disabled: boolean;
  onBlur: () => void;
} {
  return {
    id: p.id,
    name: p.name,
    "aria-describedby": p.describedBy,
    "aria-invalid": p.error !== undefined,
    "aria-required": p.state.required,
    disabled: p.state.disabled,
    onBlur: p.onBlur,
  };
}
