import React, { useState } from 'react';
import { URMViewer } from 'dts-universal-report-module';

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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* Custom Button for Adding Users */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>Users</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          style={{
            background: 'var(--primary)',
            color: 'var(--on-accent, #fff)',
            border: 'none',
            padding: '8px 18px',
            borderRadius: '20px',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <span>+ Add User Details</span>
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <URMProvider
          key={users.length}
          data={users}
          reportId={REPORT_ID}
          reportName="User"
          mode="viewer"
        >
          <RestoreActiveView />
          <URMViewerRaw />
        </URMProvider>
      </div>

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
                <select 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Role */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Role</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Title */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Title</label>
                <select 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                >
                  {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Territory */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Territory</label>
                <select 
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                >
                  {TERRITORIES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
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
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formHasErrors}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'var(--on-accent, #fff)',
                  cursor: formHasErrors ? 'not-allowed' : 'pointer',
                  opacity: formHasErrors ? 0.6 : 1,
                  fontWeight: 600
                }}
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
