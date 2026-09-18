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
  // Dropdown-style caret — off by default for a plain text field (e.g. "Schedule name"
  // has nothing to expand); Account Settings' fields opt in since they show one in Figma.
  showChevron?: boolean;
  // Shows a "{length}/{maxLength}" counter under the field, like MUI's TextField
  // helperText behavior — only takes effect when maxLength is also set.
  counter?: boolean;
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
//
// Border lives on a <fieldset>, label text inside its <legend> — browsers natively
// notch a fieldset's border around its legend, so the border has a genuine gap
// behind the label instead of the label just overlapping a continuous line (which
// visibly crossed through the text). No color-matching patch needed either, so it
// still works on the gradient card backgrounds this sits on. The real <label> stays
// for htmlFor/screen-reader association but is visually hidden — the legend is what
// renders on screen.
export function TextField(props: TextFieldProps) {
  const { label, error, className = '', as = 'input', ...rest } = props;
  const id = useId();
  const [focused, setFocused] = useState(false);

  const isDisabled = !!(rest as { disabled?: boolean }).disabled;
  const wrapperClass = `tf-wrapper ${focused ? 'tf-focused' : ''} ${error ? 'tf-error' : ''} ${isDisabled ? 'tf-disabled' : ''}`.trim();
  const fieldClass = `tf-field ${className}`.trim();

  if (as !== 'select') {
    const { showChevron, counter, maxLength, value, ...inputRest } = rest as InputProps;
    const counterText = counter && maxLength != null ? `${String(value ?? '').length}/${maxLength}` : undefined;
    const inputWrapperClass = `${wrapperClass} ${showChevron ? '' : 'tf-no-chevron'}`.trim();
    return (
      <div className={fieldClass}>
        <div className={inputWrapperClass}>
          <fieldset className="tf-outline" aria-hidden="true">
            <legend className="tf-legend">{label}</legend>
          </fieldset>
          <label htmlFor={id} className="tf-sr-label">{label}</label>
          <input
            id={id}
            value={value}
            maxLength={maxLength}
            {...(inputRest as InputHTMLAttributes<HTMLInputElement>)}
            onFocus={(e) => { setFocused(true); (inputRest as InputHTMLAttributes<HTMLInputElement>).onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); (inputRest as InputHTMLAttributes<HTMLInputElement>).onBlur?.(e); }}
            className="tf-input"
          />
          {showChevron && <ChevronDown size={14} className="tf-chevron" />}
        </div>
        {error ? <span className="tf-error-text">{error}</span> : counterText ? <span className="tf-counter">{counterText}</span> : null}
      </div>
    );
  }

  const { options, ...selectRest } = rest as SelectProps;
  return (
    <div className={fieldClass}>
      <div className={wrapperClass}>
        <fieldset className="tf-outline" aria-hidden="true">
          <legend className="tf-legend">{label}</legend>
        </fieldset>
        <label htmlFor={id} className="tf-sr-label">{label}</label>
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
