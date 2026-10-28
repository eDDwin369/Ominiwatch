import React from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '../shared/Card';
import { PageHeader } from '../shared/PageHeader';
import { Badge } from '../shared/Badge';
import { BrainCircuit } from 'lucide-react';
import '../AccountSettings/AccountSettings.css';

export function AIAnalysisPage() {
  const models = [
    { name: 'Vehicle & License Plate Recognition (ALPR)', accuracy: '99.2%', latency: '12ms', status: 'Active' },
    { name: 'Facial Identification & Access Verification', accuracy: '98.7%', latency: '18ms', status: 'Active' },
    { name: 'Intrusion Detection & Boundary Crossing', accuracy: '99.5%', latency: '8ms', status: 'Active' },
    { name: 'Loitering & Unattended Object Detection', accuracy: '97.9%', latency: '22ms', status: 'Active' }
  ];

  return (
    <div className="figma-account-settings-page-wrapper">
      <div className="figma-account-settings-container">
        <PageHeader 
          title="AI Analysis" 
          subtitle="Real-time edge neural inference, computer vision analytics, and event classifications"
          icon={<BrainCircuit size={20} />}
        />

        <div className="figma-settings-grid">
          <div className="figma-column-left">
            <Card>
              <CardHeader action={<Badge variant="success">All Models Healthy</Badge>}>
                <CardTitle>Inference Pipelines</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {models.map((m, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-light)',
                        background: 'var(--nested-bg, color-mix(in srgb, var(--text-main) 3%, transparent))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <BrainCircuit size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{m.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Latency: {m.latency} • Precision: {m.accuracy}
                          </div>
                        </div>
                      </div>
                      <Badge variant="primary">{m.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="figma-column-right">
            <Card>
              <CardHeader>
                <CardTitle>Inference Compute Metrics</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>NPU / GPU Utilization</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>44.8%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', borderRadius: '999px', background: 'var(--border-light)', overflow: 'hidden' }}>
                    <div style={{ width: '44.8%', height: '100%', background: 'var(--primary)', borderRadius: '999px' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>Neural VRAM Allocation</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>3.8 / 8.0 GB</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', borderRadius: '999px', background: 'var(--border-light)', overflow: 'hidden' }}>
                    <div style={{ width: '47.5%', height: '100%', background: '#8b5cf6', borderRadius: '999px' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>Real-time FPS Throughput</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>120 FPS</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', borderRadius: '999px', background: 'var(--border-light)', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: '#10b981', borderRadius: '999px' }} />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
