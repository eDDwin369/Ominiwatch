import { useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, X } from 'lucide-react';
import { TextField } from '../shared/TextField';
import { CustomSmoothDropdown } from '../shared/CustomSmoothDropdown';

const STORAGE_KEY = 'omnieye_license';
const KEY_PATTERN = /^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/;
const EDITIONS = ['Standard', 'Professional', 'Enterprise'];

export interface License {
  licensee: string;
  edition: string;
  key: string;
  seats: string;
  expiresOn: string; // yyyy-mm-dd
}

const EMPTY: License = { licensee: '', edition: 'Professional', key: '', seats: '', expiresOn: '' };

export function loadLicense(): License | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

/** Formats as XXXX-XXXX-XXXX-XXXX while typing. */
function formatKey(value: string) {
  const chars = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
  return chars.match(/.{1,4}/g)?.join('-') ?? '';
}

/** yyyy-mm-dd as a local date (a bare date string would be parsed as UTC midnight). */
const localDate = (ymd: string) => new Date(`${ymd}T00:00:00`);

function validate(l: License) {
  const errors: Partial<Record<keyof License, string>> = {};
  if (!l.licensee.trim()) errors.licensee = 'Required';
  if (!KEY_PATTERN.test(l.key)) errors.key = 'Use the format XXXX-XXXX-XXXX-XXXX';
  const seats = Number(l.seats);
  if (!Number.isInteger(seats) || seats < 1 || seats > 100000) errors.seats = 'Enter a whole number from 1 to 100000';
  if (!l.expiresOn || isNaN(localDate(l.expiresOn).getTime())) errors.expiresOn = 'Pick a date';
  return errors;
}

export function licenseStatus(expiresOn: string): { label: string; tone: 'ok' | 'warn' | 'error' } {
  // valid through the end of the expiry day
  const days = Math.ceil((localDate(expiresOn).getTime() + 86_400_000 - Date.now()) / 86_400_000) - 1;
  if (days < 0) return { label: 'Expired', tone: 'error' };
  if (days === 0) return { label: 'Expires today', tone: 'warn' };
  if (days <= 30) return { label: `Expires in ${days} day${days === 1 ? '' : 's'}`, tone: 'warn' };
  return { label: 'Active', tone: 'ok' };
}

/** License dialog (same pattern as the 2FA / Change Password dialogs): view, add and edit. */
export function LicenseModal({ onClose, onSaved }: { onClose: () => void; onSaved?: (l: License) => void }) {
  const [license, setLicense] = useState<License | null>(loadLicense);
  // No license yet → open straight into the add form.
  const [draft, setDraft] = useState<License | null>(() => (loadLicense() ? null : { ...EMPTY }));
  const [touched, setTouched] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const errors = draft ? validate(draft) : {};
  const hasErrors = Object.keys(errors).length > 0;
  const show = (field: keyof License) => (touched || draft?.[field] ? errors[field] : undefined);

  const change = (field: keyof License, value: string) => setDraft(d => (d ? { ...d, [field]: value } : d));

  const save = () => {
    setTouched(true);
    if (!draft || hasErrors) return;
    const clean = { ...draft, licensee: draft.licensee.trim(), seats: String(Number(draft.seats)) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    setLicense(clean);
    setDraft(null);
    onSaved?.(clean);
  };

  // Cancel returns to the details; with no license yet there is nothing to return to.
  const cancel = () => (license ? setDraft(null) : onClose());

  const copyKey = async () => {
    if (!license) return;
    try {
      await navigator.clipboard.writeText(license.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the key can still be revealed and selected */
    }
  };

  const st = license ? licenseStatus(license.expiresOn) : null;
  const maskedKey = license ? license.key.replace(/[A-Z0-9](?=[A-Z0-9-]{5})/g, '•') : '';

  return (
    <div className="figma-modal-backdrop" onClick={onClose}>
      <div className="figma-modal-box figma-modal-std" role="dialog" aria-modal="true" aria-labelledby="license-title" onClick={e => e.stopPropagation()}>
        <div className="figma-modal-header">
          <div className="page-title-group">
            <span className="page-title-icon" aria-hidden="true"><KeyRound size={18} /></span>
            <h3 id="license-title">
              <span className="brand-gradient-text">{draft ? (license ? 'Edit License' : 'Add License') : 'License'}</span>
            </h3>
          </div>
          <button className="figma-modal-close" aria-label="Close" title="Close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="figma-modal-body">
          {draft ? (
            <>
              <p className="figma-modal-desc">
                Enter the details from your license certificate. The key is formatted as you type.
              </p>
              <div className="as-license-form">
                <TextField
                  label="Licensed to"
                  value={draft.licensee}
                  maxLength={80}
                  error={show('licensee')}
                  onChange={e => change('licensee', e.target.value)}
                />
                <CustomSmoothDropdown
                  label="Edition"
                  value={draft.edition}
                  onChange={v => change('edition', v)}
                  options={EDITIONS.map(e => ({ label: e, value: e }))}
                />
                <TextField
                  label="Seats"
                  inputMode="numeric"
                  value={draft.seats}
                  error={show('seats')}
                  onChange={e => change('seats', e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <TextField
                  label="License key"
                  value={draft.key}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  autoComplete="off"
                  spellCheck={false}
                  error={show('key')}
                  onChange={e => change('key', formatKey(e.target.value))}
                />
                <TextField
                  label="Valid until"
                  type="date"
                  value={draft.expiresOn}
                  error={show('expiresOn')}
                  onChange={e => change('expiresOn', e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') save(); }}
                />
              </div>
            </>
          ) : license && st && (
            <dl className="as-license-rows">
              <div><dt>Licensed to</dt><dd>{license.licensee}</dd></div>
              <div><dt>Edition</dt><dd>{license.edition}</dd></div>
              <div>
                <dt>License key</dt>
                <dd className="as-license-key">
                  <span>{revealed ? license.key : maskedKey}</span>
                  <button
                    type="button"
                    className="shell-btn-icon"
                    data-tip={revealed ? 'Hide key' : 'Show key'}
                    aria-label={revealed ? 'Hide key' : 'Show key'}
                    onClick={() => setRevealed(r => !r)}
                  >
                    {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    className="shell-btn-icon"
                    data-tip={copied ? 'Copied' : 'Copy key'}
                    aria-label="Copy key"
                    onClick={copyKey}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </dd>
              </div>
              <div><dt>Seats</dt><dd>{Number(license.seats).toLocaleString()}</dd></div>
              <div>
                <dt>Valid until</dt>
                <dd>
                  {localDate(license.expiresOn).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  <span className={`figma-log-status as-status-${st.tone}`}>{st.label}</span>
                </dd>
              </div>
            </dl>
          )}
        </div>

        <div className="figma-modal-footer">
          {draft ? (
            <>
              <button className="figma-btn-modal-cancel" onClick={cancel}>Cancel</button>
              <button className="figma-btn-modal-confirm" onClick={save} disabled={touched && hasErrors}>
                Save License
              </button>
            </>
          ) : (
            <>
              <button className="figma-btn-modal-cancel" onClick={onClose}>Close</button>
              <button
                className="figma-btn-modal-confirm"
                onClick={() => { setDraft({ ...(license ?? EMPTY) }); setTouched(false); }}
              >
                Edit License
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
