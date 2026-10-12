import React, { useEffect, useRef, useState } from 'react';
import { UserPlus, X, AlertCircle, ArrowLeft, Trash2, Check } from 'lucide-react';
import { URMProvider, URMBuilderRaw, useURMContext } from 'dts-universal-report-module';
import { isValidName } from '../AccountSettings/nameValidation';
import { isValidPhone } from '../AccountSettings/phoneValidation';
import { isValidEmail } from '../AccountSettings/emailValidation';
import { TextField } from '../shared/TextField';
import { CustomSmoothDropdown } from '../shared/CustomSmoothDropdown';
import './ReportsPage.css';

const REPORT_ID = 'test-report';

// URM 1.3.13 persists saved views to localStorage["urm_report_<reportId>"], but its
// restore-on-mount only re-applies the active view's filters + sortStack — not grouping
// or column config. Re-selecting the restored active view once runs the full snapshot
// apply path (handleSelectView), so grouping/columns come back on reload too.
function RestoreActiveView() {
  const ctx = useURMContext();
  const applied = useRef(false);
  const report = ctx.activeReport;
  const viewId: string | undefined = report?.activeViewId;
  const ready = Boolean(report?.schemaLocked && viewId && report?.views?.length);

  useEffect(() => {
    if (applied.current || !ready || !viewId) return;
    applied.current = true;
    ctx.handleSelectView(viewId);
  }, [ready, viewId, ctx]);

  return null;
}

// 1000 dummy users, same column shape as user-management/src/data/users-seed.json.
// Generated (not hand-listed) to keep the file small; deterministic so the table
// is stable across renders.
const FIRST = ['Ishaan', 'Zoya', 'Arjun', 'Aisha', 'Kabir', 'Mia', 'Rohan', 'Sara', 'Vivaan', 'Ava', 'Aditya', 'Leah', 'Dev', 'Noor', 'Karan', 'Elena', 'Aryan', 'Maya', 'Reyansh', 'Nina'];
const LAST = ['Brown', 'Sharma', 'Patel', 'Khan', 'Garcia', 'Chen', 'Nguyen', 'Silva', 'Muller', 'Rossi', 'Kim', 'Lopez', 'Singh', 'Cohen', 'Andersen'];
const DEPARTMENTS = ['Product', 'Operations', 'Finance', 'Engineering', 'Sales', 'Marketing', 'Human Resources', 'Support'];
const ROLES = ['Senior Product Manager', 'Director', 'Accountant', 'Software Engineer', 'Sales Executive', 'Analyst', 'Coordinator', 'Team Lead'];
const STATUSES = ['Full Time', 'Part Time', 'Contract', 'Intern'];
const TITLES = ['Manager', 'Director+', 'Associate', 'Lead', 'Individual Contributor'];
const TERRITORIES = ['Territory North', 'Territory Central', 'Territory South', 'Territory East', 'Territory West'];
const PLACES = [
  { continent: 'North America', country: 'Canada', state: 'Ontario' },
  { continent: 'North America', country: 'USA', state: 'California' },
  { continent: 'Europe', country: 'Germany', state: 'Hesse' },
  { continent: 'Europe', country: 'UK', state: 'England' },
  { continent: 'Asia', country: 'India', state: 'Tamil Nadu' },
  { continent: 'Asia', country: 'Singapore', state: 'Central' },
  { continent: 'South America', country: 'Brazil', state: 'Sao Paulo' },
  { continent: 'Oceania', country: 'Australia', state: 'Victoria' },
];

const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];

// Baseline the Add User form starts from (and resets back to) — used to detect unsaved edits.
const DEFAULT_ADD_USER_FORM = {
  fullName: '',
  username: '',
  email: '',
  phoneNumber: '',
  department: 'Engineering',
  role: 'Software Engineer',
  status: 'Full Time',
  title: 'Individual Contributor',
  territory: 'Territory West',
  continent: 'North America',
  country: 'USA',
  stateProvince: 'California',
};

const MAX_AUSTRALIA = 5;
let australiaCount = 0;

const dummyUsers = Array.from({ length: 1000 }, (_, idx) => {
  const n = idx + 1;
  const first = pick(FIRST, idx);
  const last = pick(LAST, idx * 3 + 1);
  let place = pick(PLACES, idx);
  // Cap Australia entries at 5; overflow goes to the next place in the list
  if (place.country === 'Australia') {
    if (australiaCount < MAX_AUSTRALIA) {
      australiaCount++;
    } else {
      place = pick(PLACES, idx + 1);
    }
  }
  const seq = String(n).padStart(3, '0');
  return {
    user_id: `USR-${String(n).padStart(4, '0')}`,
    full_name: `${first} ${last}`,
    username: `${first.toLowerCase()}.${last.toLowerCase()}${seq}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${seq}@company.com`,
    phone_number: `+1-555-${1000 + n}`,
    department: pick(DEPARTMENTS, idx),
    role: pick(ROLES, idx),
    status: pick(STATUSES, idx),
    continent: place.continent,
    country: place.country,
    state_province: place.state,
    title: pick(TITLES, idx),
    territory: pick(TERRITORIES, idx),
  };
});

// Theme comes from the root StudioTheme provider (theme-bridge.tsx).
export function ReportsPage() {
  const [users, setUsers] = useState(dummyUsers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  // Fields state
  const [fullName, setFullName] = useState(DEFAULT_ADD_USER_FORM.fullName);
  const [username, setUsername] = useState(DEFAULT_ADD_USER_FORM.username);
  const [email, setEmail] = useState(DEFAULT_ADD_USER_FORM.email);
  const [phoneNumber, setPhoneNumber] = useState(DEFAULT_ADD_USER_FORM.phoneNumber);
  const [department, setDepartment] = useState(DEFAULT_ADD_USER_FORM.department);
  const [role, setRole] = useState(DEFAULT_ADD_USER_FORM.role);
  const [status, setStatus] = useState(DEFAULT_ADD_USER_FORM.status);
  const [title, setTitle] = useState(DEFAULT_ADD_USER_FORM.title);
  const [territory, setTerritory] = useState(DEFAULT_ADD_USER_FORM.territory);
  const [continent, setContinent] = useState(DEFAULT_ADD_USER_FORM.continent);
  const [country, setCountry] = useState(DEFAULT_ADD_USER_FORM.country);
  const [stateProvince, setStateProvince] = useState(DEFAULT_ADD_USER_FORM.stateProvince);

  const hasUnsavedChanges =
    JSON.stringify({
      fullName,
      username,
      email,
      phoneNumber,
      department,
      role,
      status,
      title,
      territory,
      continent,
      country,
      stateProvince,
    }) !== JSON.stringify(DEFAULT_ADD_USER_FORM);

  const resetAddUserForm = () => {
    setFullName(DEFAULT_ADD_USER_FORM.fullName);
    setUsername(DEFAULT_ADD_USER_FORM.username);
    setEmail(DEFAULT_ADD_USER_FORM.email);
    setPhoneNumber(DEFAULT_ADD_USER_FORM.phoneNumber);
    setDepartment(DEFAULT_ADD_USER_FORM.department);
    setRole(DEFAULT_ADD_USER_FORM.role);
    setStatus(DEFAULT_ADD_USER_FORM.status);
    setTitle(DEFAULT_ADD_USER_FORM.title);
    setTerritory(DEFAULT_ADD_USER_FORM.territory);
    setContinent(DEFAULT_ADD_USER_FORM.continent);
    setCountry(DEFAULT_ADD_USER_FORM.country);
    setStateProvince(DEFAULT_ADD_USER_FORM.stateProvince);
  };

  const requestCloseAddModal = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedConfirm(true);
    } else {
      setIsAddModalOpen(false);
    }
  };

  const handleDiscardAddUser = () => {
    setShowUnsavedConfirm(false);
    setIsAddModalOpen(false);
    resetAddUserForm();
  };

  const nameValid = isValidName(fullName);
  // phone, username and email are optional here — a placeholder is generated when left blank
  const phoneValid = phoneNumber.trim() === '' || isValidPhone(phoneNumber);
  const emailValid = email.trim() === '' || isValidEmail(email);
  // only surface a message once the field has been typed into
  const nameError = fullName.trim() !== '' && !nameValid;
  const phoneError = phoneNumber.trim() !== '' && !phoneValid;
  const emailError = email.trim() !== '' && !emailValid;
  const formHasErrors = !nameValid || !phoneValid || !emailValid;

  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    const assignTitles = () => {
      const elements = container.querySelectorAll<HTMLElement>('td, th, .urm-item-title');
      elements.forEach((el) => {
        if (!el.getAttribute('title')) {
          const text = el.textContent?.trim();
          if (text) {
            el.setAttribute('title', text);
          }
        }
      });

      // Ensure the "New Report" button is labeled "New User"
      const newButtons = container.querySelectorAll<HTMLElement>('[aria-label="New Report"], [aria-label="New User"], [title="New Report"]');
      newButtons.forEach((btn) => {
        if (btn.getAttribute('aria-label') !== 'New User') {
          btn.setAttribute('aria-label', 'New User');
        }
        if (btn.getAttribute('title') === 'New Report') {
          btn.setAttribute('title', 'New User');
        }
      });
    };

    assignTitles();

    const observer = new MutationObserver(() => {
      assignTitles();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Ensure gap between blue gradient header and filter condition controls in modals
    const adjustFilterModalGap = () => {
      const closeButtons = document.querySelectorAll<HTMLElement>('.MuiPaper-root [aria-label="Close"]');
      closeButtons.forEach((btn) => {
        const header = btn.closest('.MuiPaper-root > div');
        if (header) {
          const body = header.nextElementSibling as HTMLElement | null;
          if (body && body.style.paddingTop !== '20px') {
            body.style.setProperty('padding-top', '20px', 'important');
          }
        }
      });
    };

    // Replace "New Report" tooltip text in document.body whenever MUI renders a tooltip popper
    const replaceTooltipText = () => {
      const tooltips = document.querySelectorAll<HTMLElement>('.MuiTooltip-tooltip');
      tooltips.forEach((t) => {
        if (t.textContent?.trim() === 'New Report') {
          t.textContent = 'New User';
        }
      });
    };

    replaceTooltipText();
    adjustFilterModalGap();

    const bodyObserver = new MutationObserver(() => {
      replaceTooltipText();
      adjustFilterModalGap();
    });

    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('td, th, .urm-item-title');
      if (target && !target.getAttribute('title')) {
        const text = target.textContent?.trim();
        if (text) {
          target.setAttribute('title', text);
        }
      }
      replaceTooltipText();
    };

    container.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseover', replaceTooltipText, true);

    const handleNewClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('[aria-label="New User"], [aria-label="New Report"]');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        setIsAddModalOpen(true);
      }
    };
    container.addEventListener('click', handleNewClick, true);

    return () => {
      observer.disconnect();
      bodyObserver.disconnect();
      container.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseover', replaceTooltipText, true);
      container.removeEventListener('click', handleNewClick, true);
    };
  }, [users]);

  const submitNewUser = () => {
    if (formHasErrors) return;

    const nextId = users.length + 1;
    const seq = String(nextId).padStart(3, '0');
    const first = fullName.split(' ')[0] || 'User';
    const last = fullName.split(' ')[1] || 'New';
    
    const newUser = {
      user_id: `USR-${String(nextId).padStart(4, '0')}`,
      full_name: fullName,
      username: username.trim() || `${first.toLowerCase()}.${last.toLowerCase()}${seq}`,
      email: email.trim() || `${first.toLowerCase()}.${last.toLowerCase()}${seq}@company.com`,
      phone_number: phoneNumber || `+1-555-${1000 + nextId}`,
      department,
      role,
      status,
      continent,
      country,
      state_province: stateProvince,
      title,
      territory,
    };

    setUsers([newUser, ...users]); // Prepend new user
    setIsAddModalOpen(false);
    resetAddUserForm();
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    submitNewUser();
  };

  useEffect(() => {
    if (!isAddModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showUnsavedConfirm) {
        setShowUnsavedConfirm(false);
      } else {
        requestCloseAddModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen, showUnsavedConfirm, hasUnsavedChanges]);

  return (
    <div 
      ref={gridContainerRef}
      className="user-tab-page"
      data-hms-context="reports-builder"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        // Background is set in ReportsPage.css (.user-tab-page) via !important —
        // the soft page gradient, same recipe as Account Settings.
        padding: 0,
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      <URMProvider
        key={users.length}
        data={users}
        reportId={REPORT_ID}
        reportName="Test"
        mode="builder"
        config={{
          defaultViewMode: 'list',
          viewOptions: ['list', 'grid']
        }}
      >
        <RestoreActiveView />
        <URMBuilderRaw hasExternalData={true} />
      </URMProvider>

      {/* Modal for adding user */}
      {isAddModalOpen && (
        <div
          className="urm-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) requestCloseAddModal();
          }}
        >
          <div className="urm-modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="urm-modal-header">
              <div className="urm-modal-header-left">
                <span className="page-title-icon" aria-hidden="true">
                  <UserPlus size={20} />
                </span>
                <h2 className="urm-modal-title brand-gradient-text">Add User Details</h2>
              </div>
              <button
                type="button"
                className="urm-modal-close-btn"
                aria-label="Close"
                title="Close"
                onClick={requestCloseAddModal}
              >
                <X size={18} strokeWidth={2.25} />
              </button>
            </div>

            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, margin: 0 }}>
              <div className="urm-modal-body">
                {/* Grid Layout for Fields */}
                <div className="urm-modal-grid">
                  
                  {/* Full Name */}
                  <TextField
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                    error={nameError ? 'Enter a valid full name (letters only, 2–60 characters)' : undefined}
                  />

                  {/* Username */}
                  <TextField
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="john.doe001"
                  />

                  {/* Email */}
                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe001@company.com"
                    error={emailError ? 'Enter a valid email address' : undefined}
                  />

                  {/* Phone Number */}
                  <TextField
                    label="Phone Number"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1-555-0199"
                    error={phoneError ? 'Enter a valid phone number (7–15 digits, optional leading +)' : undefined}
                  />

                  {/* Department */}
                  <CustomSmoothDropdown
                    label="Department"
                    value={department}
                    onChange={setDepartment}
                    options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                  />

                  {/* Role */}
                  <CustomSmoothDropdown
                    label="Role"
                    value={role}
                    onChange={setRole}
                    options={ROLES.map((r) => ({ value: r, label: r }))}
                  />

                  {/* Status */}
                  <CustomSmoothDropdown
                    label="Status"
                    value={status}
                    onChange={setStatus}
                    options={STATUSES.map((s) => ({ value: s, label: s }))}
                  />

                  {/* Title */}
                  <CustomSmoothDropdown
                    label="Title"
                    value={title}
                    onChange={setTitle}
                    options={TITLES.map((t) => ({ value: t, label: t }))}
                  />

                  {/* Territory */}
                  <CustomSmoothDropdown
                    label="Territory"
                    value={territory}
                    onChange={setTerritory}
                    options={TERRITORIES.map((t) => ({ value: t, label: t }))}
                  />

                  {/* Continent */}
                  <TextField
                    label="Continent"
                    value={continent}
                    onChange={(e) => setContinent(e.target.value)}
                    placeholder="e.g. Europe"
                  />

                  {/* Country */}
                  <TextField
                    label="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. UK"
                  />

                  {/* State/Province */}
                  <TextField
                    label="State/Province"
                    value={stateProvince}
                    onChange={(e) => setStateProvince(e.target.value)}
                    placeholder="e.g. London"
                  />

                </div>
              </div>
            </form>

            {showUnsavedConfirm && (
              <div className="urm-confirm-backdrop" onClick={() => setShowUnsavedConfirm(false)}>
                <div
                  className="urm-confirm"
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="urm-confirm-title"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="page-title-group">
                    <span className="page-title-icon" aria-hidden="true">
                      <AlertCircle size={18} />
                    </span>
                    <h3 id="urm-confirm-title" className="urm-confirm-title brand-gradient-text">
                      Unsaved changes
                    </h3>
                  </div>
                  <p className="urm-confirm-text">
                    You have unsaved changes. Save them before closing Add User Details?
                  </p>
                  <div className="urm-confirm-actions">
                    <button
                      type="button"
                      className="gs-confirm-btn shell-btn-icon"
                      data-tip="Cancel — keep editing"
                      aria-label="Cancel — keep editing"
                      onClick={() => setShowUnsavedConfirm(false)}
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <button
                      type="button"
                      className="gs-confirm-btn shell-btn-icon shell-btn-icon--danger"
                      data-tip="Discard changes"
                      aria-label="Discard changes"
                      onClick={handleDiscardAddUser}
                    >
                      <Trash2 size={17} />
                    </button>
                    <button
                      type="button"
                      className="gs-confirm-btn gs-top-btn-save shell-btn-icon shell-btn-icon--success"
                      data-tip="Save changes"
                      aria-label="Save changes"
                      autoFocus
                      disabled={formHasErrors}
                      onClick={() => {
                        setShowUnsavedConfirm(false);
                        submitNewUser();
                      }}
                    >
                      <Check size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
