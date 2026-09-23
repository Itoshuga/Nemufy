import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

type FormFieldProps = ComponentProps<"input"> & {
  label: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
};

export function FormField({
  label,
  error,
  hint,
  icon: Icon,
  id,
  ...props
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <label htmlFor={id} className="block">
      <span className="text-foreground mb-2 block text-xs font-medium">
        {label}
      </span>
      <span
        className="auth-input-shell"
        data-invalid={error ? "true" : undefined}
      >
        {Icon ? <Icon className="auth-input-icon" aria-hidden="true" /> : null}
        <input
          id={id}
          className="auth-input"
          data-with-icon={Icon ? "true" : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...props}
        />
      </span>
      {error ? (
        <span
          id={errorId}
          className="text-destructive mt-1.5 block text-xs"
          role="alert"
        >
          {error}
        </span>
      ) : hint ? (
        <span id={hintId} className="text-subtle mt-1.5 block text-xs">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
