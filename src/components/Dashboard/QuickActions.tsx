
import { PlusCircle, FileUp, BarChart3, Settings2, Users, BellRing } from 'lucide-react';
import './Dashboard.css';

export function QuickActions() {
  const actions = [
    { icon: <PlusCircle size={24} />, title: 'Create Project', desc: 'Start a new workspace' },
    { icon: <FileUp size={24} />, title: 'Upload Report', desc: 'Import CSV or JSON data' },
    { icon: <BarChart3 size={24} />, title: 'Analytics', desc: 'View global performance' },
    { icon: <Settings2 size={24} />, title: 'Settings', desc: 'Manage your preferences' },
    { icon: <Users size={24} />, title: 'Team', desc: 'Invite or manage members' },
    { icon: <BellRing size={24} />, title: 'Notifications', desc: 'View recent alerts' }
  ];

  return (
    <section className="quick-actions-section">
      <h2 className="section-title">Quick Actions</h2>
      <div className="actions-grid">
        {actions.map((action, idx) => (
          <a key={idx} href="#" className="action-card" onClick={(e) => e.preventDefault()}>
            <div className="action-icon-wrapper">
              {action.icon}
            </div>
            <div className="action-content">
              <h3>{action.title}</h3>
              <p>{action.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
