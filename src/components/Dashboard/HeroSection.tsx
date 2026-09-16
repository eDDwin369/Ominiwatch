
import { Plus, Download, Activity, FolderGit2, FileText, Users, Database, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import './Dashboard.css';

export function HeroSection() {
  const kpis = [
    { label: 'Product Health', value: '98%', icon: <Activity size={18} />, trend: '+2.4%', isPositive: true },
    { label: 'Active Projects', value: '24', icon: <FolderGit2 size={18} />, trend: '+3', isPositive: true },
    { label: 'Total Reports', value: '1,492', icon: <FileText size={18} />, trend: '+124', isPositive: true },
    { label: 'Active Users', value: '8,391', icon: <Users size={18} />, trend: '-12', isPositive: false },
    { label: 'Storage Used', value: '45.2 GB', icon: <Database size={18} />, trend: '+1.2GB', isPositive: false },
    { label: 'Last Sync', value: '2m ago', icon: <Clock size={18} />, trend: 'Healthy', isPositive: true }
  ];

  return (
    <section className="hero-section">
      <div className="hero-header">
        <div>
          <h1 className="hero-title">👋 Welcome back, Edwin</h1>
        </div>
        <div className="hero-actions">
          <button className="btn btn-secondary">
            <Download size={16} /> Import Data
          </button>
          <button className="btn btn-primary">
            <Plus size={16} /> Create Report
          </button>
        </div>
      </div>
      
      <div className="kpi-grid">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="kpi-card">
            <div className="kpi-header">
              <span>{kpi.label}</span>
              <div className="kpi-icon">{kpi.icon}</div>
            </div>
            <div className="kpi-value">{kpi.value}</div>
            <div className={`kpi-trend ${kpi.isPositive ? 'positive' : 'neutral'}`}>
              {kpi.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{kpi.trend}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
