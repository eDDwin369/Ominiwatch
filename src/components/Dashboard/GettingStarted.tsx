
import { Check } from 'lucide-react';
import './Dashboard.css';

export function GettingStarted() {
  const steps = [
    { label: 'Branding', status: 'completed' },
    { label: 'Theme', status: 'completed' },
    { label: 'Import Data', status: 'current' },
    { label: 'Workspace', status: 'pending' },
    { label: 'Invite Team', status: 'pending' }
  ];

  // Calculate progress width
  const currentIdx = steps.findIndex(s => s.status === 'current');
  const progressWidth = currentIdx >= 0 ? `${(currentIdx / (steps.length - 1)) * 100}%` : '100%';

  return (
    <section className="getting-started-section">
      <div className="stepper-card">
        <div className="stepper-header">
          <h2 className="stepper-title">Getting Started</h2>
          <span className="stepper-progress">Step {currentIdx + 1} of {steps.length}</span>
        </div>
        
        <div className="steps-container">
          <div className="steps-line">
            <div className="steps-line-active" style={{ width: progressWidth }}></div>
          </div>
          
          {steps.map((step, idx) => (
            <div key={idx} className={`step-item ${step.status}`}>
              <div className="step-indicator">
                {step.status === 'completed' ? <Check size={16} /> : (idx + 1)}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
