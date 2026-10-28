import React from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '../shared/Card';
import { PageHeader } from '../shared/PageHeader';
import { Badge } from '../shared/Badge';
import { Radio, Camera } from 'lucide-react';
import '../AccountSettings/AccountSettings.css';

export function LiveMonitoringPage() {
  const dummyCameras = [
    { id: 'CAM-01', name: 'Main Entrance & Perimeter', status: 'Active', fps: '30 FPS', res: '4K UHD' },
    { id: 'CAM-02', name: 'Loading Dock & Logistics', status: 'Active', fps: '30 FPS', res: '1080p HD' },
    { id: 'CAM-03', name: 'Server Room & Data Vault', status: 'Active', fps: '60 FPS', res: '4K UHD' },
    { id: 'CAM-04', name: 'East Corridor & Stairwell', status: 'Active', fps: '30 FPS', res: '1080p HD' }
  ];

  return (
    <div className="figma-account-settings-page-wrapper">
      <div className="figma-account-settings-container">
        <PageHeader 
          title="Live Monitoring" 
          subtitle="Real-time multi-channel optical feeds and camera monitoring"
          icon={<Radio size={20} />}
          actions={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Badge variant="success">All Feeds Online</Badge>
            </div>
          }
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          {dummyCameras.map(cam => (
            <Card key={cam.id}>
              <CardHeader action={<Badge variant="primary">{cam.fps}</Badge>}>
                <CardTitle gradient={false}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Camera size={18} style={{ color: 'var(--primary)' }} />
                    <span>{cam.name}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardBody>
                {/* Video Feed Placeholder Surface */}
                <div style={{
                  height: '240px',
                  borderRadius: '8px',
                  background: 'color-mix(in srgb, var(--bg-dashboard) 90%, black)',
                  border: '1px solid var(--border-light)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  marginBottom: '14px'
                }}>
                  {/* Subtle Grid / Scan lines */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.5) 100%)',
                    pointerEvents: 'none'
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#10b981',
                    fontWeight: 600
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                    REC • {cam.id}
                  </div>

                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#ffffff',
                    fontWeight: 500
                  }}>
                    {cam.res}
                  </div>

                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Radio size={32} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>Live Optical Stream Active</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>Codec: H.265 / HEVC</span>
                  <span>Bitrate: 4.8 Mbps</span>
                  <span>Audio: Monitored</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
