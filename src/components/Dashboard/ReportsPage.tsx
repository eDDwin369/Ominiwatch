import { URMBuilder } from 'dts-universal-report-module';

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
  return <URMBuilder data={dummyUsers} reportName="User" reportId="base-app-users" />;
}
