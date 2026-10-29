import React, { useState, useMemo, useEffect } from 'react';
import { 
  BrainCircuit, 
  LayoutGrid, 
  History, 
  RefreshCw, 
  RotateCcw, 
  LayoutList, 
  Info, 
  Image as ImageIcon, 
  Video, 
  CheckCircle2, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  MapPin,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../shared/Card';
import { PageHeader } from '../shared/PageHeader';
import { Badge } from '../shared/Badge';
import { SearchField } from '../shared/SearchField';
import { CustomSmoothDropdown } from '../shared/CustomSmoothDropdown';
import { Modal } from '../shared/Modal';
import '../AccountSettings/AccountSettings.css';
import '../shared/SharedUI.css';

export interface AlertItem {
  id: string;
  name: string;
  type: 'intrusion' | 'vehicle' | 'face' | 'loitering' | 'hazard';
  typeLabel: string;
  source: string;
  zone: string;
  timestamp: string;
  timeRaw: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'new' | 'acknowledged' | 'resolved';
  confidence: string;
  notifiedTo: string;
  notifiedBy: string;
  mediaType: 'image' | 'video';
  description: string;
}

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'ALT-1049',
    name: 'Boundary Intrusion Detected',
    type: 'intrusion',
    typeLabel: 'Intrusion Detection',
    source: 'Perimeter East Camera',
    zone: 'Zone B - Perimeter Fence',
    timestamp: '12:11 AM 29Oct2026',
    timeRaw: '2026-10-29T00:11:00',
    severity: 'critical',
    status: 'new',
    confidence: '99.4%',
    notifiedTo: 'Security Ops Team',
    notifiedBy: 'Neural Edge Node 02',
    mediaType: 'image',
    description: 'Human figure detected crossing secondary perimeter tripwire outside permitted operational hours.'
  },
  {
    id: 'ALT-1048',
    name: 'Unregistered Vehicle Ingress',
    type: 'vehicle',
    typeLabel: 'Vehicle & ALPR',
    source: 'Main Gate PTZ Camera',
    zone: 'Zone A - Entrance Gate',
    timestamp: '11:46 PM 28Oct2026',
    timeRaw: '2026-10-28T23:46:00',
    severity: 'warning',
    status: 'new',
    confidence: '98.8%',
    notifiedTo: 'Gate Security & Dispatch',
    notifiedBy: 'ALPR Optical Engine',
    mediaType: 'image',
    description: 'License plate MH-12-DE-4412 does not match authorized commercial fleet manifest.'
  },
  {
    id: 'ALT-1047',
    name: 'Prolonged Loitering Near Vault',
    type: 'loitering',
    typeLabel: 'Loitering & Crowd',
    source: 'Server Room & Vault',
    zone: 'Zone C - Data Center',
    timestamp: '11:27 PM 28Oct2026',
    timeRaw: '2026-10-28T23:27:00',
    severity: 'warning',
    status: 'new',
    confidence: '97.6%',
    notifiedTo: 'IT Facilities Lead',
    notifiedBy: 'Spatial Motion Inference',
    mediaType: 'video',
    description: 'Individual remained stationary within restricted optical radius for over 8 minutes.'
  },
  {
    id: 'ALT-1046',
    name: 'Unknown Person at Emergency Exit',
    type: 'face',
    typeLabel: 'Face Recognition',
    source: 'East Corridor & Stairwell',
    zone: 'Zone A - Main Building',
    timestamp: '11:19 PM 28Oct2026',
    timeRaw: '2026-10-28T23:19:00',
    severity: 'warning',
    status: 'acknowledged',
    confidence: '96.2%',
    notifiedTo: 'Floor Warden',
    notifiedBy: 'Biometric Access Gate',
    mediaType: 'image',
    description: 'Face signature did not match active badge credentials in corporate identity registry.'
  },
  {
    id: 'ALT-1045',
    name: 'Smoke Signature Detected',
    type: 'hazard',
    typeLabel: 'Fire & Smoke Hazard',
    source: 'Warehouse Aisle Camera',
    zone: 'Zone D - Logistics Warehouse',
    timestamp: '10:58 PM 28Oct2026',
    timeRaw: '2026-10-28T22:58:00',
    severity: 'critical',
    status: 'new',
    confidence: '99.1%',
    notifiedTo: 'Safety Control Room',
    notifiedBy: 'Thermal Optical Classifier',
    mediaType: 'video',
    description: 'Early-stage diffuse smoke plume identified near bay ventilation duct 4B.'
  },
  {
    id: 'ALT-1044',
    name: 'Speed Limit Exceeded (Forklift)',
    type: 'vehicle',
    typeLabel: 'Vehicle & ALPR',
    source: 'Loading Dock Camera',
    zone: 'Zone D - Logistics Warehouse',
    timestamp: '9:51 PM 28Oct2026',
    timeRaw: '2026-10-28T21:51:00',
    severity: 'info',
    status: 'acknowledged',
    confidence: '98.0%',
    notifiedTo: 'Warehouse Supervisor',
    notifiedBy: 'Velocity Tracker AI',
    mediaType: 'image',
    description: 'Vehicle tracked moving at 26 km/h in designated 10 km/h pedestrian crossway.'
  },
  {
    id: 'ALT-1043',
    name: 'Unattended Package Flagged',
    type: 'loitering',
    typeLabel: 'Loitering & Crowd',
    source: 'Cafeteria Counter Camera',
    zone: 'Zone A - Main Building',
    timestamp: '8:40 PM 28Oct2026',
    timeRaw: '2026-10-28T20:40:00',
    severity: 'warning',
    status: 'resolved',
    confidence: '97.2%',
    notifiedTo: 'Building Reception',
    notifiedBy: 'Object Persistence Engine',
    mediaType: 'image',
    description: 'Isolated black backpack left unmonitored at south bench for 25 minutes.'
  },
  {
    id: 'ALT-1042',
    name: 'Perimeter Tripwire Triggered',
    type: 'intrusion',
    typeLabel: 'Intrusion Detection',
    source: 'Perimeter East Camera',
    zone: 'Zone B - Perimeter Fence',
    timestamp: '7:15 PM 28Oct2026',
    timeRaw: '2026-10-28T19:15:00',
    severity: 'info',
    status: 'resolved',
    confidence: '95.5%',
    notifiedTo: 'Field Patrol',
    notifiedBy: 'Neural Edge Node 02',
    mediaType: 'video',
    description: 'Wildlife classification confirmed: stray animal contact with low-voltage sensor.'
  },
  {
    id: 'ALT-1041',
    name: 'After-hours Server Access',
    type: 'face',
    typeLabel: 'Face Recognition',
    source: 'Server Room & Vault',
    zone: 'Zone C - Data Center',
    timestamp: '6:30 PM 28Oct2026',
    timeRaw: '2026-10-28T18:30:00',
    severity: 'info',
    status: 'resolved',
    confidence: '99.8%',
    notifiedTo: 'System Administrator',
    notifiedBy: 'Biometric Access Gate',
    mediaType: 'image',
    description: 'Authorized engineer John Doe verified with valid maintenance ticket.'
  },
  {
    id: 'ALT-1040',
    name: 'Blocked Fire Exit Doorway',
    type: 'hazard',
    typeLabel: 'Fire & Smoke Hazard',
    source: 'East Corridor & Stairwell',
    zone: 'Zone A - Main Building',
    timestamp: '5:04 PM 28Oct2026',
    timeRaw: '2026-10-28T17:04:00',
    severity: 'warning',
    status: 'resolved',
    confidence: '98.9%',
    notifiedTo: 'Compliance Officer',
    notifiedBy: 'Object Persistence Engine',
    mediaType: 'image',
    description: 'Cardboard pallet obstructing emergency stairwell push-bar egress.'
  },
  {
    id: 'ALT-1039',
    name: 'Unauthorized Tailgating Entry',
    type: 'intrusion',
    typeLabel: 'Intrusion Detection',
    source: 'Main Gate PTZ Camera',
    zone: 'Zone A - Entrance Gate',
    timestamp: '4:22 PM 28Oct2026',
    timeRaw: '2026-10-28T16:22:00',
    severity: 'warning',
    status: 'resolved',
    confidence: '97.4%',
    notifiedTo: 'Security Desk',
    notifiedBy: 'Spatial Motion Inference',
    mediaType: 'video',
    description: 'Second individual entered turnstile immediately behind verified badge holder.'
  },
  {
    id: 'ALT-1038',
    name: 'Rooftop Access Hatch Opened',
    type: 'intrusion',
    typeLabel: 'Intrusion Detection',
    source: 'Chennai Rooftop 360',
    zone: 'Zone B - Perimeter Fence',
    timestamp: '2:15 PM 28Oct2026',
    timeRaw: '2026-10-28T14:15:00',
    severity: 'info',
    status: 'resolved',
    confidence: '99.0%',
    notifiedTo: 'Building Ops',
    notifiedBy: 'Neural Edge Node 01',
    mediaType: 'image',
    description: 'Scheduled solar panel inspection access confirmed by facility team.'
  }
];

const TIME_OPTIONS = [
  { label: 'All time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 24 Hours', value: '24h' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' }
];

const SOURCE_OPTIONS = [
  { label: 'All Sub-sources', value: 'all' },
  { label: 'Perimeter East Camera', value: 'Perimeter East Camera' },
  { label: 'Main Gate PTZ Camera', value: 'Main Gate PTZ Camera' },
  { label: 'Server Room & Vault', value: 'Server Room & Vault' },
  { label: 'East Corridor & Stairwell', value: 'East Corridor & Stairwell' },
  { label: 'Warehouse Aisle Camera', value: 'Warehouse Aisle Camera' },
  { label: 'Loading Dock Camera', value: 'Loading Dock Camera' },
  { label: 'Cafeteria Counter Camera', value: 'Cafeteria Counter Camera' },
  { label: 'Chennai Rooftop 360', value: 'Chennai Rooftop 360' }
];

const ZONE_OPTIONS = [
  { label: 'All Zones', value: 'all' },
  { label: 'Zone A - Main Building', value: 'Zone A - Main Building' },
  { label: 'Zone B - Perimeter Fence', value: 'Zone B - Perimeter Fence' },
  { label: 'Zone C - Data Center', value: 'Zone C - Data Center' },
  { label: 'Zone D - Logistics Warehouse', value: 'Zone D - Logistics Warehouse' }
];

const TYPE_OPTIONS = [
  { label: 'All Alert Types', value: 'all' },
  { label: 'Intrusion Detection', value: 'intrusion' },
  { label: 'Vehicle & ALPR', value: 'vehicle' },
  { label: 'Loitering & Crowd', value: 'loitering' },
  { label: 'Face Recognition', value: 'face' },
  { label: 'Fire & Smoke Hazard', value: 'hazard' }
];

export function AIAnalysisPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal inspection
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Current timestamp & refresh animation
  const [currentTime, setCurrentTime] = useState('Thu, Oct 29, 2026, 08:34:10 AM');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-US', { hour12: true });
    
    setTimeout(() => {
      setCurrentTime(formatted);
      setIsRefreshing(false);
    }, 450);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setTimeRange('all');
    setSourceFilter('all');
    setZoneFilter('all');
    setTypeFilter('all');
    setCurrentPage(1);
  };

  const handleAcknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a));
    if (selectedAlert && selectedAlert.id === id) {
      setSelectedAlert(prev => prev ? { ...prev, status: 'acknowledged' } : null);
    }
  };

  // Filtered list
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // Tab filter: Alert History tab shows all past & resolved/acknowledged items; Dashboard focuses on active/recent
      if (activeTab === 'history' && alert.status === 'new') {
        // Can show all in history or filter as appropriate
      }

      if (sourceFilter !== 'all' && alert.source !== sourceFilter) {
        return false;
      }
      if (zoneFilter !== 'all' && alert.zone !== zoneFilter) {
        return false;
      }
      if (typeFilter !== 'all' && alert.type !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          alert.id.toLowerCase().includes(q) ||
          alert.name.toLowerCase().includes(q) ||
          alert.source.toLowerCase().includes(q) ||
          alert.zone.toLowerCase().includes(q) ||
          alert.notifiedTo.toLowerCase().includes(q) ||
          alert.notifiedBy.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [alerts, activeTab, sourceFilter, zoneFilter, typeFilter, searchQuery]);

  // Pagination calculation
  const totalItems = filteredAlerts.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredAlerts.slice(start, start + rowsPerPage);
  }, [filteredAlerts, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sourceFilter, zoneFilter, typeFilter, timeRange, rowsPerPage]);

  const criticalCount = useMemo(() => {
    return alerts.filter(a => a.severity === 'critical' && a.status === 'new').length;
  }, [alerts]);

  return (
    <div className="figma-account-settings-page-wrapper" style={{ paddingBottom: '32px' }}>
      <div className="figma-account-settings-container">
        
        {/* Top Header conforming to Base Application */}
        <PageHeader 
          title="AI Analysis" 
          subtitle="Real-time edge neural inference, computer vision analytics, and event classifications"
          icon={<BrainCircuit size={20} />}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant="primary">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Sparkles size={13} />
                  <span>Neural Inference Active</span>
                </span>
              </Badge>
            </div>
          }
        />

        {/* Navigation Tabs conforming to Base Application */}
        <div className="flashback-tabs-container">
          <button
            type="button"
            className={`flashback-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="flashback-tab-icon-badge">
              <LayoutGrid size={16} />
            </div>
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            className={`flashback-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <div className="flashback-tab-icon-badge">
              <History size={16} />
            </div>
            <span>Alert History</span>
          </button>
        </div>

        {/* TAB CONTENT: DASHBOARD & HISTORY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SECTION 1: ALERT OVERVIEW */}
          <Card>
            <CardHeader
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {/* Time Badge with Refresh Button */}
                  <div 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'var(--nested-bg, color-mix(in srgb, var(--text-main) 4%, transparent))',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '5px 12px',
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <span>{currentTime}</span>
                    <button
                      type="button"
                      onClick={handleRefresh}
                      title="Refresh alert counts"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px',
                        transition: 'transform 0.4s ease'
                      }}
                    >
                      <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
                    </button>
                  </div>

                  {/* Table/Grid Switch */}
                  <div 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'var(--nested-bg, color-mix(in srgb, var(--text-main) 4%, transparent))',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '3px'
                    }}
                  >
                    <button
                      type="button"
                      className={`figma-btn-cancel ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')}
                      title="Grid View"
                      style={{
                        padding: '4px 10px',
                        height: '28px',
                        borderRadius: '6px',
                        background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                        color: viewMode === 'grid' ? '#ffffff' : 'var(--text-muted)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      <LayoutGrid size={14} />
                      <span>Grid</span>
                    </button>
                    <button
                      type="button"
                      className={`figma-btn-cancel ${viewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setViewMode('table')}
                      title="Table View"
                      style={{
                        padding: '4px 10px',
                        height: '28px',
                        borderRadius: '6px',
                        background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                        color: viewMode === 'table' ? '#ffffff' : 'var(--text-muted)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      <LayoutList size={14} />
                      <span>Table</span>
                    </button>
                  </div>
                </div>
              }
            >
              <CardTitle gradient={false}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '16px' }}>
                    Alert Overview
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardBody>
              {/* 3 Summary Cards */}
              <div className="ai-summary-grid">
                
                {/* 1. AI Alerts */}
                <div className="ai-summary-card ai-card-active">
                  <div className="ai-summary-header">
                    <div className="ai-summary-value">{filteredAlerts.length}</div>
                    <Badge variant={criticalCount > 0 ? "danger" : "primary"}>
                      {criticalCount} critical
                    </Badge>
                  </div>
                  <div>
                    <div className="ai-summary-label">AI Alerts</div>
                    <div className="ai-summary-trend">
                      <span>↑ 12% vs prior</span>
                    </div>
                  </div>
                </div>

                {/* 2. IoT Alerts */}
                <div className="ai-summary-card ai-card-iot">
                  <div className="ai-summary-header">
                    <div className="ai-summary-value">0</div>
                    <Badge variant="neutral">Upcoming Feature</Badge>
                  </div>
                  <div>
                    <div className="ai-summary-label">IoT Alerts</div>
                    <div className="ai-summary-trend">
                      <span>↑ 0% vs prior</span>
                    </div>
                  </div>
                </div>

                {/* 3. System Alerts */}
                <div className="ai-summary-card ai-card-system">
                  <div className="ai-summary-header">
                    <div className="ai-summary-value">0</div>
                    <Badge variant="neutral">Upcoming Feature</Badge>
                  </div>
                  <div>
                    <div className="ai-summary-label">System Alerts</div>
                    <div className="ai-summary-trend">
                      <span>↑ 0% vs prior</span>
                    </div>
                  </div>
                </div>

              </div>
            </CardBody>
          </Card>

          {/* SECTION 2: AI ALERTS LIST / GRID & CONTROLS */}
          <Card>
            <CardHeader
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge variant="neutral">
                    {totalItems} total alerts
                  </Badge>
                </div>
              }
            >
              <CardTitle gradient={false}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '16px' }}>
                    {activeTab === 'dashboard' ? 'AI Alerts' : 'Historical Alerts Log'}
                  </span>
                  <Badge variant="primary">Alert history</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardBody>
              
              {/* Controls Bar: Search, Filters, View Modes, Reset */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '20px'
                }}
              >
                {/* Left Controls: Search, Quick Tooltip, Dropdown Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  
                  {/* Search Input */}
                  <SearchField 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ID, Alert Name, Source, Zone..."
                  />

                  {/* Tooltip info */}
                  <span 
                    title="Search by incident ID, classification, camera name, or assigned zone" 
                    style={{ cursor: 'help', color: 'var(--text-muted)' }}
                  >
                    <Info size={16} />
                  </span>

                  {/* Time Range */}
                  <div style={{ width: '135px' }}>
                    <CustomSmoothDropdown 
                      label="Time Range"
                      value={timeRange}
                      onChange={setTimeRange}
                      options={TIME_OPTIONS}
                    />
                  </div>

                  {/* Sub-sources */}
                  <div style={{ width: '150px' }}>
                    <CustomSmoothDropdown 
                      label="Sub-sources"
                      value={sourceFilter}
                      onChange={setSourceFilter}
                      options={SOURCE_OPTIONS}
                    />
                  </div>

                  {/* Zones */}
                  <div style={{ width: '145px' }}>
                    <CustomSmoothDropdown 
                      label="Zones"
                      value={zoneFilter}
                      onChange={setZoneFilter}
                      options={ZONE_OPTIONS}
                    />
                  </div>

                  {/* Alert types */}
                  <div style={{ width: '150px' }}>
                    <CustomSmoothDropdown 
                      label="Alert types"
                      value={typeFilter}
                      onChange={setTypeFilter}
                      options={TYPE_OPTIONS}
                    />
                  </div>
                </div>

                {/* Right Controls: Filter Action & Reset Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="figma-btn-cancel"
                    onClick={() => setIsFilterModalOpen(true)}
                    title="Open Advanced Filter Modal"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      fontSize: '13px'
                    }}
                  >
                    <Filter size={14} />
                    <span>Filter</span>
                  </button>

                  <button
                    type="button"
                    className="figma-btn-cancel"
                    onClick={handleResetFilters}
                    title="Reset all search queries and dropdown filters"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      fontSize: '13px'
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>Reset Filters</span>
                  </button>
                </div>
              </div>

              {/* VIEW 1: GRID MODE */}
              {viewMode === 'grid' && (
                filteredAlerts.length > 0 ? (
                  <div className="ai-alert-grid">
                    {paginatedAlerts.map(alert => (
                      <div 
                        key={alert.id}
                        className="ai-alert-card"
                        onClick={() => setSelectedAlert(alert)}
                        title={`Click to inspect ${alert.name}`}
                      >
                        {/* Media Preview Box */}
                        <div className="ai-alert-preview">
                          <div className="ai-alert-media-badge">
                            {alert.mediaType === 'video' ? <Video size={14} /> : <ImageIcon size={14} />}
                          </div>

                          {/* Center Graphic */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.35 }}>
                            <ImageIcon size={36} color="var(--text-muted)" strokeWidth={1.5} />
                          </div>

                          {/* Severity Pill */}
                          <div className={`ai-alert-severity-dot ${alert.severity}`}>
                            <span 
                              style={{ 
                                width: '6px', 
                                height: '6px', 
                                borderRadius: '50%', 
                                background: '#ffffff',
                                display: 'inline-block' 
                              }} 
                            />
                            <span>{alert.severity.toUpperCase()}</span>
                          </div>
                        </div>

                        {/* Card Info Body */}
                        <div className="ai-alert-body">
                          <div className="ai-alert-title" style={{ color: alert.severity === 'critical' ? 'var(--danger, #ef4444)' : 'var(--text-main)' }}>
                            {alert.name}
                          </div>
                          <div className="ai-alert-time">
                            {alert.timestamp}
                          </div>
                          <div className="ai-alert-meta">
                            <MapPin size={11} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {alert.source}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Empty state */
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '50%', 
                      background: 'color-mix(in srgb, var(--primary) 12%, transparent)', 
                      color: 'var(--primary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '14px'
                    }}>
                      <BrainCircuit size={24} />
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                      No matching alerts found
                    </div>
                    <div style={{ fontSize: '13px', maxWidth: '380px', margin: '0 auto 16px' }}>
                      Try adjusting your search criteria or clearing filters to view all AI classifications.
                    </div>
                    <button type="button" className="figma-btn-save" onClick={handleResetFilters}>
                      Reset All Filters
                    </button>
                  </div>
                )
              )}

              {/* VIEW 2: TABLE MODE */}
              {viewMode === 'table' && (
                filteredAlerts.length > 0 ? (
                  <div className="ai-table-container">
                    <table className="ai-table">
                      <thead>
                        <tr>
                          <th>Media</th>
                          <th>Alert ID</th>
                          <th>Event Name</th>
                          <th>Camera Source</th>
                          <th>Zone</th>
                          <th>Timestamp</th>
                          <th>Severity</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAlerts.map(alert => (
                          <tr key={alert.id}>
                            <td>
                              <div 
                                style={{
                                  width: '40px',
                                  height: '28px',
                                  borderRadius: '4px',
                                  background: 'radial-gradient(circle, #1e293b 0%, #030712 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  cursor: 'pointer'
                                }}
                                onClick={() => setSelectedAlert(alert)}
                              >
                                {alert.mediaType === 'video' ? <Video size={13} /> : <ImageIcon size={13} />}
                              </div>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{alert.id}</td>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{alert.name}</div>
                              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{alert.typeLabel}</div>
                            </td>
                            <td>{alert.source}</td>
                            <td>{alert.zone}</td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>{alert.timestamp}</td>
                            <td>
                              <Badge 
                                variant={
                                  alert.severity === 'critical' ? 'danger' : 
                                  alert.severity === 'warning' ? 'warning' : 'primary'
                                }
                              >
                                {alert.severity}
                              </Badge>
                            </td>
                            <td>
                              <Badge 
                                variant={
                                  alert.status === 'resolved' ? 'success' :
                                  alert.status === 'acknowledged' ? 'neutral' : 'outline'
                                }
                              >
                                {alert.status}
                              </Badge>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="figma-btn-cancel"
                                  style={{ padding: '4px 8px', height: '28px' }}
                                  onClick={() => setSelectedAlert(alert)}
                                  title="View alert snapshot & diagnostics"
                                >
                                  <Eye size={13} />
                                </button>
                                {alert.status === 'new' && (
                                  <button
                                    type="button"
                                    className="figma-btn-save"
                                    style={{ padding: '4px 8px', height: '28px', fontSize: '12px' }}
                                    onClick={() => handleAcknowledgeAlert(alert.id)}
                                    title="Acknowledge alert"
                                  >
                                    <CheckCircle2 size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    No alerts match the active table query.
                  </div>
                )
              )}

              {/* PAGINATION BAR */}
              {totalItems > 0 && (
                <div className="ai-pagination">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Rows per page:</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => setRowsPerPage(Number(e.target.value))}
                      style={{
                        background: 'var(--nested-bg, var(--bg-card))',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '12px',
                        color: 'var(--text-main)',
                        cursor: 'pointer'
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div>
                    {Math.min((currentPage - 1) * rowsPerPage + 1, totalItems)}–{Math.min(currentPage * rowsPerPage, totalItems)} of {totalItems}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      className="ai-pagination-btn"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      title="Previous Page"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      className="ai-pagination-btn"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      title="Next Page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

            </CardBody>
          </Card>
        </div>

        {/* MODAL 1: ALERT SNAPSHOT & DETAIL INSPECTION */}
        {selectedAlert && (
          <Modal
            isOpen={Boolean(selectedAlert)}
            onClose={() => setSelectedAlert(null)}
            title={`Incident Inspection: ${selectedAlert.id}`}
            maxWidth="680px"
            footer={
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedAlert.status === 'new' && (
                  <button 
                    type="button"
                    className="figma-btn-save" 
                    onClick={() => handleAcknowledgeAlert(selectedAlert.id)}
                  >
                    <CheckCircle2 size={14} style={{ marginRight: '6px' }} />
                    Acknowledge Alert
                  </button>
                )}
                <button 
                  type="button"
                  className="figma-btn-cancel" 
                  onClick={() => setSelectedAlert(null)}
                >
                  Close Inspection
                </button>
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Media Preview Stage */}
              <div
                style={{
                  height: '320px',
                  borderRadius: '10px',
                  background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #030712 100%)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                  <Badge variant={selectedAlert.severity === 'critical' ? 'danger' : 'warning'}>
                    {selectedAlert.severity.toUpperCase()}
                  </Badge>
                  <Badge variant="neutral">
                    {selectedAlert.confidence} Confidence
                  </Badge>
                </div>

                <div style={{ textAlign: 'center', color: '#fff' }}>
                  {selectedAlert.mediaType === 'video' ? (
                    <Video size={48} style={{ color: 'var(--primary)', marginBottom: '10px' }} />
                  ) : (
                    <ImageIcon size={48} style={{ color: 'var(--primary)', marginBottom: '10px' }} />
                  )}
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>Optical Snapshot Buffer</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '4px' }}>
                    Frame captured at {selectedAlert.timestamp}
                  </div>
                </div>
              </div>

              {/* Metadata Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div className="figma-card-nested" style={{ borderRadius: '8px' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Incident Name</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                    {selectedAlert.name}
                  </div>
                </div>

                <div className="figma-card-nested" style={{ borderRadius: '8px' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Camera Source</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                    {selectedAlert.source}
                  </div>
                </div>

                <div className="figma-card-nested" style={{ borderRadius: '8px' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Assigned Zone</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                    {selectedAlert.zone}
                  </div>
                </div>

                <div className="figma-card-nested" style={{ borderRadius: '8px' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Inference Engine</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                    {selectedAlert.notifiedBy}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                <strong>Description:</strong> {selectedAlert.description}
              </div>
            </div>
          </Modal>
        )}

        {/* MODAL 2: ADVANCED FILTER DIALOG */}
        {isFilterModalOpen && (
          <Modal
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            title="Advanced Alert Filters"
            maxWidth="520px"
            footer={
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button"
                  className="figma-btn-save" 
                  onClick={() => setIsFilterModalOpen(false)}
                >
                  Apply Filters
                </button>
                <button 
                  type="button"
                  className="figma-btn-cancel" 
                  onClick={handleResetFilters}
                >
                  Reset All
                </button>
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="figma-label">Time Window</label>
                <CustomSmoothDropdown 
                  label="Time Range"
                  value={timeRange}
                  onChange={setTimeRange}
                  options={TIME_OPTIONS}
                />
              </div>

              <div>
                <label className="figma-label">Optical Source</label>
                <CustomSmoothDropdown 
                  label="Sub-source"
                  value={sourceFilter}
                  onChange={setSourceFilter}
                  options={SOURCE_OPTIONS}
                />
              </div>

              <div>
                <label className="figma-label">Monitored Zone</label>
                <CustomSmoothDropdown 
                  label="Zone"
                  value={zoneFilter}
                  onChange={setZoneFilter}
                  options={ZONE_OPTIONS}
                />
              </div>

              <div>
                <label className="figma-label">Classification Type</label>
                <CustomSmoothDropdown 
                  label="Alert Type"
                  value={typeFilter}
                  onChange={setTypeFilter}
                  options={TYPE_OPTIONS}
                />
              </div>
            </div>
          </Modal>
        )}

      </div>
    </div>
  );
}
