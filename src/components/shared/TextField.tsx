import { useId, useState, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import './TextField.css';

type BaseProps = {
  label: string;
  error?: string;
  className?: string;
};

type InputProps = BaseProps & {
  as?: 'input';
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>;

type SelectProps = BaseProps & {
  as: 'select';
  options: { value: string; label: string }[];
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'>;

type TextFieldProps = InputProps | SelectProps;

// Floating-label boxed field — ported from the Figma reusable TextField export
// (resuableTextField/src/components/TextField.tsx), re-themed onto this app's own
// CSS vars (--border-light/--text-main/--danger) instead of Tailwind. Transparent
// background (no fill) so it blends into whatever card surface it sits on, e.g.
// Account Settings' per-preset Figma gradient card.
export function TextField(props: TextFieldProps) {
  const { label, error, className = '', as = 'input', ...rest } = props;
  const id = useId();
  const [focused, setFocused] = useState(false);

  const isDisabled = !!(rest as { disabled?: boolean }).disabled;
  const wrapperClass = `tf-wrapper ${focused ? 'tf-focused' : ''} ${error ? 'tf-error' : ''} ${isDisabled ? 'tf-disabled' : ''}`.trim();
  const fieldClass = `tf-field ${className}`.trim();

  if (as === 'select') {
    const { options, ...selectRest } = rest as SelectProps;
    return (
      <div className={fieldClass}>
        <div className={wrapperClass}>
          <label htmlFor={id} className="tf-label">{label}</label>
          <select
            id={id}
            {...(selectRest as SelectHTMLAttributes<HTMLSelectElement>)}
            onFocus={(e) => { setFocused(true); (selectRest as SelectHTMLAttributes<HTMLSelectElement>).onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); (selectRest as SelectHTMLAttributes<HTMLSelectElement>).onBlur?.(e); }}
            className="tf-select"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="tf-chevron" />
        </div>
        {error && <span className="tf-error-text">{error}</span>}
      </div>
    );
  }

  return (
    <div className={fieldClass}>
      <div className={wrapperClass}>
        <label htmlFor={id} className="tf-label">{label}</label>
        <input
          id={id}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          onFocus={(e) => { setFocused(true); (rest as InputHTMLAttributes<HTMLInputElement>).onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); (rest as InputHTMLAttributes<HTMLInputElement>).onBlur?.(e); }}
          className="tf-input"
        />
        <ChevronDown size={14} className="tf-chevron" />
      </div>
      {error && <span className="tf-error-text">{error}</span>}
    </div>
  );
}
