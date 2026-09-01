import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function FormField({
  id,
  label,
  value,
  onChange,
  error,
  className = "",
  ...inputProps
}: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-2 w-full rounded-[3px] border bg-cream px-4 py-3 text-sm text-ink outline-none transition-colors ${
          error ? "border-[#8f2d2d]" : "border-forest-900/15 focus:border-gold"
        }`}
        {...inputProps}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[0.78rem] text-[#8f2d2d]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface FormTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function FormTextarea({
  id,
  label,
  value,
  onChange,
  error,
  className = "",
  ...textareaProps
}: FormTextareaProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-forest-950">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-2 min-h-[7.5rem] w-full resize-y rounded-[3px] border bg-cream px-4 py-3 text-sm text-ink outline-none transition-colors ${
          error ? "border-[#8f2d2d]" : "border-forest-900/15 focus:border-gold"
        }`}
        {...textareaProps}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[0.78rem] text-[#8f2d2d]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface CheckboxFieldProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  children: ReactNode;
}

export function CheckboxField({ id, checked, onChange, error, children }: CheckboxFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 h-4 w-4 shrink-0 accent-forest-900"
        />
        <span>{children}</span>
      </label>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[0.78rem] text-[#8f2d2d]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
