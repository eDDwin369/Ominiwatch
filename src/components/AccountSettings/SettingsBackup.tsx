import { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, RotateCcw, Upload, X } from 'lucide-react';
import { TextField } from '../shared/TextField';
import {
  applyImport,
  downloadSettingsFile,
  factoryReset,
  planImport,
  resetSettings,
  type ImportPlan,
} from '../../utils/settingsTransfer';

type ResetMode = 'settings' | 'factory';

/** Backup & Reset accordion body: export, import (with a confirmation summary) and reset. */
export function SettingsBackup() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [exportedName, setExportedName] = useState('');
  const [importPlan, setImportPlan] = useState<ImportPlan | null>(null);
  const [importError, setImportError] = useState('');
  const [importDone, setImportDone] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetMode, setResetMode] = useState<ResetMode>('settings');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetDone, setResetDone] = useState(false);

  const importOpen = !!importPlan || !!importError;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportDone(false);
    try {
      setImportPlan(planImport(await file.text()));
      setImportError('');
    } catch (err) {
      setImportPlan(null);
      setImportError(err instanceof Error ? err.message : 'This file could not be read.');
    }
  };

  const closeImport = () => {
    setImportPlan(null);
    setImportError('');
  };

  const confirmImport = () => {
    if (!importPlan) return;
    applyImport(importPlan);
    setImportDone(true);
    // Every screen reads its settings on load, so a reload applies the import everywhere.
    setTimeout(() => window.location.reload(), 900);
  };

  const openReset = () => {
    setResetMode('settings');
    setResetConfirm('');
    setResetDone(false);
    setResetOpen(true);
  };

  const canReset = resetMode === 'settings' || resetConfirm.trim().toUpperCase() === 'RESET';

  const confirmReset = () => {
    if (!canReset) return;
    if (resetMode === 'factory') {
      factoryReset();
      setResetDone(true);
      setTimeout(() => window.location.replace(window.location.pathname), 900);
    } else {
      resetSettings();
      setResetDone(true);
      setTimeout(() => window.location.reload(), 900);
    }
  };

  const plan = importPlan;
  const exportedOn = plan ? new Date(plan.file.exportedAt) : null;

  return (
    <>
      <div className="figma-sec-inline-content">
        <p className="as-section-note">
          Move your theme, Global Settings and preferences to another OmniEye app.
          Logos, images and fonts are not included.
        </p>
        <div className="as-advanced-grid">
          <button
            type="button"
            className="figma-btn-outline as-tip"
            data-tip="Download your theme, Global Settings and preferences as a file"
            onClick={() => setExportedName(downloadSettingsFile())}
          >
            <Download size={15} /> Export settings
          </button>
          <button
            type="button"
            className="figma-btn-outline as-tip"
            data-tip="Apply settings from a file exported by another OmniEye app"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={15} /> Import settings
          </button>
          <button
            type="button"
            className="figma-btn-delete-red as-tip"
            data-tip="Reset settings to the defaults, or factory-reset this app"
            onClick={openReset}
          >
            <RotateCcw size={15} /> Reset…
          </button>
        </div>
        {exportedName && (
          <p className="as-section-note as-section-note--ok" role="status">
            <CheckCircle2 size={14} /> Saved {exportedName}
          </p>
        )}
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleFile} />
      </div>

      {/* Import confirmation */}
      {importOpen && (
        <div className="figma-modal-backdrop" onClick={closeImport}>
          <div className="figma-modal-box figma-modal-std" role="dialog" aria-modal="true" aria-labelledby="import-title" onClick={e => e.stopPropagation()}>
            <div className="figma-modal-header">
              <div className="page-title-group">
                <span className="page-title-icon" aria-hidden="true"><Upload size={18} /></span>
                <h3 id="import-title"><span className="brand-gradient-text">Import Settings</span></h3>
              </div>
              <button className="figma-modal-close" aria-label="Close" title="Close" onClick={closeImport}><X size={16} /></button>
            </div>
            <div className="figma-modal-body">
              {importDone ? (
                <div className="figma-success-state">
                  <CheckCircle2 size={42} color="var(--success, #10b981)" />
                  <p>Settings imported. Reloading…</p>
                </div>
              ) : importError ? (
                <p className="figma-modal-error" role="alert">{importError}</p>
              ) : plan && (
                <>
                  <p className="figma-modal-desc">
                    From <strong>{plan.file.source?.host || 'another OmniEye app'}</strong>
                    {exportedOn && !isNaN(exportedOn.getTime()) && <>, exported {exportedOn.toLocaleString()}</>}.
                  </p>
                  <ul className="as-summary-list">
                    <li><span>Theme Studio settings</span><strong>{Object.keys(plan.theme).length}</strong></li>
                    <li><span>Global &amp; account settings</span><strong>{Object.keys(plan.storage).length}</strong></li>
                    <li><span>Saved themes</span><strong>{plan.savedThemes.length}</strong></li>
                    {plan.skipped > 0 && <li><span>Skipped (not recognised)</span><strong>{plan.skipped}</strong></li>}
                  </ul>
                  <p className="figma-modal-desc">
                    Your current settings will be replaced. Logos, images and fonts stay as they are.
                  </p>
                </>
              )}
            </div>
            {!importDone && (
              <div className="figma-modal-footer">
                <button className="figma-btn-modal-cancel" onClick={closeImport}>{importError ? 'Close' : 'Cancel'}</button>
                {plan && <button className="figma-btn-modal-confirm" onClick={confirmImport}>Import settings</button>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reset: settings only, or factory reset */}
      {resetOpen && (
        <div className="figma-modal-backdrop" onClick={() => setResetOpen(false)}>
          <div className="figma-modal-box figma-modal-std figma-modal-danger" role="alertdialog" aria-modal="true" aria-labelledby="reset-title" onClick={e => e.stopPropagation()}>
            <div className="figma-modal-header">
              <div className="page-title-group">
                <span className="page-title-icon page-title-icon--danger" aria-hidden="true"><AlertTriangle size={18} /></span>
                <h3 id="reset-title" className="figma-danger-heading">Reset</h3>
              </div>
              <button className="figma-modal-close" aria-label="Close" title="Close" onClick={() => setResetOpen(false)}><X size={16} /></button>
            </div>
            <div className="figma-modal-body">
              {resetDone ? (
                <div className="figma-success-state">
                  <CheckCircle2 size={42} color="var(--success, #10b981)" />
                  <p>{resetMode === 'factory' ? 'Everything was reset. Signing you out…' : 'Settings were reset. Reloading…'}</p>
                </div>
              ) : (
                <>
                  <div className="as-choice-group" role="radiogroup" aria-label="What to reset">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={resetMode === 'settings'}
                      className={`as-choice ${resetMode === 'settings' ? 'is-selected' : ''}`}
                      onClick={() => setResetMode('settings')}
                    >
                      <span className="as-choice-title">Reset settings only</span>
                      <span className="as-choice-desc">
                        Theme, Global Settings and preferences go back to the defaults. Your profile,
                        help content, reports and license are kept.
                      </span>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={resetMode === 'factory'}
                      className={`as-choice as-choice--danger ${resetMode === 'factory' ? 'is-selected' : ''}`}
                      onClick={() => setResetMode('factory')}
                    >
                      <span className="as-choice-title">Factory reset</span>
                      <span className="as-choice-desc">
                        Erases everything this app stores on this device — settings, profile, help content,
                        reports and license — and signs you out. This cannot be undone.
                      </span>
                    </button>
                  </div>
                  {resetMode === 'factory' && (
                    <div className="figma-modal-field">
                      <TextField
                        label='Type "RESET" to confirm'
                        autoComplete="off"
                        value={resetConfirm}
                        onChange={e => setResetConfirm(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') confirmReset(); }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            {!resetDone && (
              <div className="figma-modal-footer">
                <button className="figma-btn-modal-cancel" onClick={() => setResetOpen(false)}>Cancel</button>
                <button className="figma-btn-modal-danger" disabled={!canReset} onClick={confirmReset}>
                  {resetMode === 'factory' ? 'Factory reset' : 'Reset settings'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
