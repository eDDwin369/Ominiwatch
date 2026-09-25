import React, { useEffect, useRef, useState } from 'react';
import { URMProvider, URMBuilderRaw, useURMContext } from 'dts-universal-report-module';
import { isValidName } from '../AccountSettings/nameValidation';
import { isValidPhone } from '../AccountSettings/phoneValidation';
import { Dropdown } from '../shared/Dropdown';
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

const dummyUsers = Array.from({ length: 1000 }, (_, idx) => {
  const n = idx + 1;
  const first = pick(FIRST, idx);
  const last = pick(LAST, idx * 3 + 1);
  const place = pick(PLACES, idx);
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

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('td, th, .urm-item-title');
      if (target && !target.getAttribute('title')) {
        const text = target.textContent?.trim();
        if (text) {
          target.setAttribute('title', text);
        }
      }
    };

    container.addEventListener('mouseover', handleMouseOver);

    const handleNewClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('[aria-label="New Report"]');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        setIsAddModalOpen(true);
      }
    };
    container.addEventListener('click', handleNewClick, true);

    return () => {
      observer.disconnect();
      container.removeEventListener('mouseover', handleMouseOver);
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

  return (
    <div 
      ref={gridContainerRef}
      className="user-tab-page"
      style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        background: 'var(--bg-dashboard, var(--dash-canvas-bg))',
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <form onSubmit={handleAddUser} style={{
            background: 'var(--bg-card)',
            padding: '28px',
            borderRadius: '16px',
            width: '600px',
            maxWidth: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem' }}>Add User Details</h3>
            
            {/* Grid Layout for Fields */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px 20px'
            }}>
              
              {/* Full Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  aria-invalid={nameError}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${nameError ? 'var(--danger)' : 'var(--border-light)'}`,
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                />
                {nameError && (
                  <span style={{ fontSize: '11px', color: 'var(--danger)' }}>
                    Enter a valid full name (letters only, 2–60 characters)
                  </span>
                )}
              </div>

              {/* Phone Number */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1-555-0199"
                  aria-invalid={phoneError}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${phoneError ? 'var(--danger)' : 'var(--border-light)'}`,
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                />
                {phoneError && (
                  <span style={{ fontSize: '11px', color: 'var(--danger)' }}>
                    Enter a valid phone number (7–15 digits, optional leading +)
                  </span>
                )}
              </div>

              {/* Department */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Department</label>
                <Dropdown variant="rect" value={department} onChange={setDepartment} options={DEPARTMENTS} />
              </div>

              {/* Role */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Role</label>
                <Dropdown variant="rect" value={role} onChange={setRole} options={ROLES} />
              </div>

              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</label>
                <Dropdown variant="rect" value={status} onChange={setStatus} options={STATUSES} />
              </div>

              {/* Title */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Title</label>
                <Dropdown variant="rect" value={title} onChange={setTitle} options={TITLES} />
              </div>

              {/* Territory */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Territory</label>
                <Dropdown variant="rect" value={territory} onChange={setTerritory} options={TERRITORIES} />
              </div>

              {/* Continent */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Continent</label>
                <input 
                  type="text" 
                  value={continent}
                  onChange={(e) => setContinent(e.target.value)}
                  placeholder="e.g. Europe"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Country */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Country</label>
                <input 
                  type="text" 
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. UK"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                />
              </div>

              {/* State/Province */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>State/Province</label>
                <input 
                  type="text" 
                  value={stateProvince}
                  onChange={(e) => setStateProvince(e.target.value)}
                  placeholder="e.g. London"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                />
              </div>

            </div>

            {/* Modal Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formHasErrors}
                className="btn btn-primary"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
