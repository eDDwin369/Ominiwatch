import React, { useEffect, useRef, useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { URMProvider, URMBuilderRaw, useURMContext } from 'dts-universal-report-module';
import { isValidName } from '../AccountSettings/nameValidation';
import { isValidPhone } from '../AccountSettings/phoneValidation';
import { TextField } from '../shared/TextField';
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
  
  // Fields state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [role, setRole] = useState('Software Engineer');
  const [status, setStatus] = useState('Full Time');
  const [title, setTitle] = useState('Individual Contributor');
  const [territory, setTerritory] = useState('Territory West');
  const [continent, setContinent] = useState('North America');
  const [country, setCountry] = useState('USA');
  const [stateProvince, setStateProvince] = useState('California');

  const nameValid = isValidName(fullName);
  // phone is optional here (a placeholder is generated when left blank)
  const phoneValid = phoneNumber.trim() === '' || isValidPhone(phoneNumber);
  // only surface a message once the field has been typed into
  const nameError = fullName.trim() !== '' && !nameValid;
  const phoneError = phoneNumber.trim() !== '' && !phoneValid;
  const formHasErrors = !nameValid || !phoneValid;

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

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (formHasErrors) return;

    const nextId = users.length + 1;
    const seq = String(nextId).padStart(3, '0');
    const first = fullName.split(' ')[0] || 'User';
    const last = fullName.split(' ')[1] || 'New';
    
    const newUser = {
      user_id: `USR-${String(nextId).padStart(4, '0')}`,
      full_name: fullName,
      username: `${first.toLowerCase()}.${last.toLowerCase()}${seq}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${seq}@company.com`,
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
    
    // Reset fields
    setFullName('');
    setPhoneNumber('');
    setDepartment('Engineering');
    setRole('Software Engineer');
    setStatus('Full Time');
    setTitle('Individual Contributor');
    setTerritory('Territory West');
    setContinent('North America');
    setCountry('USA');
    setStateProvince('California');
  };

  useEffect(() => {
    if (!isAddModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAddModalOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen]);

  return (
    <div 
      ref={gridContainerRef}
      className="user-tab-page"
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
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
        >
          <div className="urm-modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="urm-modal-header">
              <div className="urm-modal-header-left">
                <div className="urm-modal-header-icon">
                  <UserPlus size={20} />
                </div>
                <h1 className="urm-modal-title">Add User Details</h1>
              </div>
              <button
                type="button"
                className="urm-modal-close-btn"
                aria-label="Close"
                title="Close"
                onClick={() => setIsAddModalOpen(false)}
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
                  <TextField
                    as="select"
                    label="Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                  />

                  {/* Role */}
                  <TextField
                    as="select"
                    label="Role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    options={ROLES.map((r) => ({ value: r, label: r }))}
                  />

                  {/* Status */}
                  <TextField
                    as="select"
                    label="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    options={STATUSES.map((s) => ({ value: s, label: s }))}
                  />

                  {/* Title */}
                  <TextField
                    as="select"
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    options={TITLES.map((t) => ({ value: t, label: t }))}
                  />

                  {/* Territory */}
                  <TextField
                    as="select"
                    label="Territory"
                    value={territory}
                    onChange={(e) => setTerritory(e.target.value)}
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

              {/* Modal Buttons */}
              <div className="urm-modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="urm-btn-cancel"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={formHasErrors}
                  className="urm-btn-save"
                >
                  SAVE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
