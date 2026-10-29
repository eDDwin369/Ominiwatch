import React, { useState, useMemo } from 'react';
import { 
  Settings, 
  Video, 
  MapPin, 
  BrainCircuit, 
  Trash2, 
  HardDrive, 
  Users, 
  Info, 
  Star, 
  LayoutList, 
  LayoutGrid, 
  Plus, 
  Copy, 
  Check, 
  Eye, 
  Pencil, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Filter,
  Play,
  RotateCcw,
  Shield,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { PageHeader } from '../shared/PageHeader';
import { SearchField } from '../shared/SearchField';
import { CustomSmoothDropdown } from '../shared/CustomSmoothDropdown';
import { Modal } from '../shared/Modal';
import { Badge } from '../shared/Badge';
import './AdministrationPage.css';
import '../AccountSettings/AccountSettings.css';
import '../shared/SharedUI.css';

export interface CameraItem {
  id: string;
  name: string;
  isFavorite: boolean;
  stream360Url: string | null;
  streamPtzUrl: string | null;
  onvifStatus: 'online' | 'offline' | 'unsupported';
  createdDate: string;
  type: '360°' | 'PTZ' | 'Fixed';
  location: string;
  status: 'active' | 'inactive';
  fps: number;
  resolution: string;
}

export interface ZoneItem {
  id: string;
  name: string;
  type: string;
  camerasCount: number;
  cameras: string[];
  status: 'active' | 'warning' | 'idle';
  createdDate: string;
}

export interface AIModelItem {
  id: string;
  name: string;
  category: string;
  isEnabled: boolean;
  sensitivity: number;
  assignedCameras: number;
  status: 'active' | 'paused';
}

export interface NVRItem {
  id: string;
  name: string;
  ip: string;
  channelsUsed: number;
  totalChannels: number;
  storageUsedTB: number;
  totalStorageTB: number;
  status: 'online' | 'offline';
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'Superadmin' | 'Security Operator' | 'Viewer';
  status: 'active' | 'suspended';
  lastLogin: string;
}

export interface DeletedItem {
  id: string;
  name: string;
  type: 'Camera' | 'Zone' | 'AI Rule';
  deletedDate: string;
  originalLocation: string;
}

const INITIAL_CAMERAS: CameraItem[] = [
  {
    id: 'cam-01',
    name: 'Chennai Rooftop 360',
    isFavorite: true,
    stream360Url: 'rtsp://allcad-chennai.selfip.com:8554/RTMP_CAM23',
    streamPtzUrl: 'rtsp://allcad-chennai.selfip.com:8554/0b2a40cc-9406-4...',
    onvifStatus: 'unsupported',
    createdDate: '1/5/2026, 1:30:00 PM',
    type: '360°',
    location: 'Outdoor Rooftop',
    status: 'active',
    fps: 30,
    resolution: '4K UHD'
  },
  {
    id: 'cam-02',
    name: 'Street PTZ',
    isFavorite: true,
    stream360Url: 'rtsp://allcad-chennai.selfip.com:8554/RTMP_CAM23',
    streamPtzUrl: 'rtsp://allcad-chennai.selfip.com:8554/0b2a40cc-9406-4...',
    onvifStatus: 'unsupported',
    createdDate: '1/5/2026, 1:30:00 PM',
    type: 'PTZ',
    location: 'West Crossroad',
    status: 'active',
    fps: 30,
    resolution: '4K UHD'
  },
  {
    id: 'cam-03',
    name: 'Server Room',
    isFavorite: false,
    stream360Url: null,
    streamPtzUrl: null,
    onvifStatus: 'unsupported',
    createdDate: '1/5/2026, 1:30:00 PM',
    type: 'Fixed',
    location: 'Main Server Vault',
    status: 'active',
    fps: 60,
    resolution: '4K UHD'
  },
  {
    id: 'cam-04',
    name: 'Warehouse Aisle',
    isFavorite: false,
    stream360Url: null,
    streamPtzUrl: null,
    onvifStatus: 'unsupported',
    createdDate: '1/5/2026, 1:30:00 PM',
    type: 'Fixed',
    location: 'Aisle B3 Hub',
    status: 'active',
    fps: 30,
    resolution: '1080p FHD'
  },
  {
    id: 'cam-05',
    name: 'Main Gate PTZ',
    isFavorite: false,
    stream360Url: null,
    streamPtzUrl: null,
    onvifStatus: 'unsupported',
    createdDate: '1/5/2026, 1:30:00 PM',
    type: 'PTZ',
    location: 'Facility Perimeter',
    status: 'active',
    fps: 60,
    resolution: '4K UHD'
  },
  {
    id: 'cam-06',
    name: 'Cafeteria Counter',
    isFavorite: false,
    stream360Url: null,
    streamPtzUrl: null,
    onvifStatus: 'unsupported',
    createdDate: '1/5/2026, 1:30:00 PM',
    type: 'Fixed',
    location: 'Dining Hall',
    status: 'active',
    fps: 30,
    resolution: '1080p FHD'
  },
  {
    id: 'cam-07',
    name: 'Loading Dock',
    isFavorite: false,
    stream360Url: null,
    streamPtzUrl: null,
    onvifStatus: 'unsupported',
    createdDate: '1/5/2026, 1:30:00 PM',
    type: 'Fixed',
    location: 'Freight Bay 2',
    status: 'active',
    fps: 30,
    resolution: '1080p FHD'
  },
  {
    id: 'cam-08',
    name: 'Perimeter East',
    isFavorite: false,
    stream360Url: null,
    streamPtzUrl: null,
    onvifStatus: 'unsupported',
    createdDate: '1/5/2026, 1:30:00 PM',
    type: 'Fixed',
    location: 'Fence East Sector',
    status: 'active',
    fps: 30,
    resolution: '1080p FHD'
  }
];

const INITIAL_ZONES: ZoneItem[] = [
  { id: 'zone-1', name: 'Main Entrance & Gate', type: 'High Security', camerasCount: 2, cameras: ['Main Gate PTZ', 'Perimeter East'], status: 'active', createdDate: '1/5/2026' },
  { id: 'zone-2', name: 'Server Vault & Infrastructure', type: 'Restricted Area', camerasCount: 1, cameras: ['Server Room'], status: 'active', createdDate: '1/5/2026' },
  { id: 'zone-3', name: 'Logistics & Loading Dock', type: 'Commercial Access', camerasCount: 2, cameras: ['Loading Dock', 'Warehouse Aisle'], status: 'warning', createdDate: '1/5/2026' },
  { id: 'zone-4', name: 'Rooftop & Perimeter', type: 'Facility Boundary', camerasCount: 2, cameras: ['Chennai Rooftop 360', 'Street PTZ'], status: 'active', createdDate: '1/5/2026' }
];

const INITIAL_AI_MODELS: AIModelItem[] = [
  { id: 'ai-1', name: 'Intrusion & Line Crossing Detection', category: 'Perimeter Defense', isEnabled: true, sensitivity: 85, assignedCameras: 4, status: 'active' },
  { id: 'ai-2', name: 'Facial Recognition & Access Verification', category: 'Identity & Access', isEnabled: true, sensitivity: 90, assignedCameras: 2, status: 'active' },
  { id: 'ai-3', name: 'Vehicle License Plate Recognition (LPR)', category: 'Gate Automation', isEnabled: true, sensitivity: 80, assignedCameras: 2, status: 'active' },
  { id: 'ai-4', name: 'PPE Helmet & Vest Compliance Detection', category: 'Workplace Safety', isEnabled: true, sensitivity: 75, assignedCameras: 3, status: 'active' },
  { id: 'ai-5', name: 'Loitering & Abandoned Object Alert', category: 'Behavioral Analysis', isEnabled: false, sensitivity: 60, assignedCameras: 1, status: 'paused' }
];

const INITIAL_NVRS: NVRItem[] = [
  { id: 'nvr-01', name: 'NVR-Master-Chennai-01', ip: '192.168.1.101', channelsUsed: 8, totalChannels: 16, storageUsedTB: 10.8, totalStorageTB: 16, status: 'online' },
  { id: 'nvr-02', name: 'NVR-Secondary-Vault-02', ip: '192.168.1.102', channelsUsed: 4, totalChannels: 8, storageUsedTB: 4.2, totalStorageTB: 8, status: 'online' }
];

const INITIAL_USERS: UserItem[] = [
  { id: 'usr-1', name: 'Edwin Superadmin', email: 'edwin@oomniwatch.ai', role: 'Superadmin', status: 'active', lastLogin: 'Today, 09:20 AM' },
  { id: 'usr-2', name: 'Sarah Jenkins', email: 's.jenkins@oomniwatch.ai', role: 'Security Operator', status: 'active', lastLogin: 'Yesterday, 04:15 PM' },
  { id: 'usr-3', name: 'Alex Rivera', email: 'a.rivera@oomniwatch.ai', role: 'Viewer', status: 'active', lastLogin: 'Oct 26, 2026' }
];

const INITIAL_RECYCLE_BIN: DeletedItem[] = [
  { id: 'del-1', name: 'Old Gate Cam-09', type: 'Camera', deletedDate: '1/4/2026, 11:20 AM', originalLocation: 'South Perimeter' },
  { id: 'del-2', name: 'Cafeteria Patio Zone', type: 'Zone', deletedDate: '1/3/2026, 02:40 PM', originalLocation: 'Outdoor Annex' }
];

const DATE_OPTIONS = [
  { label: 'All Dates', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' }
];

const ONVIF_OPTIONS = [
  { label: 'ONVIF Status', value: 'all' },
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' },
  { label: 'Unsupported', value: 'unsupported' }
];

const ROWS_PER_PAGE_OPTIONS = [
  { label: '10', value: '10' },
  { label: '20', value: '20' },
  { label: '50', value: '50' }
];

type AdminTab = 'camera' | 'zone' | 'ai' | 'recycle' | 'nvr' | 'user';

interface AdministrationPageProps {
  hasUnsavedChanges?: boolean;
  setHasUnsavedChanges?: (value: boolean) => void;
  editProfileOnLoad?: boolean;
  setEditProfileOnLoad?: (value: boolean) => void;
  initialTab?: string;
  defaultAdminTab?: string;
  onAdminTabChange?: (tab: any) => void;
  onNavigate?: (view: string) => void;
}

export function AdministrationPage({
  initialTab
}: AdministrationPageProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (initialTab && ['camera', 'zone', 'ai', 'recycle', 'nvr', 'user'].includes(initialTab)) {
      return initialTab as AdminTab;
    }
    return 'camera';
  });

  // Camera Management State
  const [cameras, setCameras] = useState<CameraItem[]>(INITIAL_CAMERAS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [dateFilter, setDateFilter] = useState('all');
  const [onvifFilter, setOnvifFilter] = useState('all');
  const [rowsPerPage, setRowsPerPage] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Preview State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraItem | null>(null);
  const [previewCamera, setPreviewCamera] = useState<CameraItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'360°' | 'PTZ' | 'Fixed'>('Fixed');
  const [formLocation, setFormLocation] = useState('');
  const [form360Url, setForm360Url] = useState('');
  const [formPtzUrl, setFormPtzUrl] = useState('');

  // Other Tabs State
  const [zones, setZones] = useState<ZoneItem[]>(INITIAL_ZONES);
  const [aiModels, setAiModels] = useState<AIModelItem[]>(INITIAL_AI_MODELS);
  const [nvrs] = useState<NVRItem[]>(INITIAL_NVRS);
  const [users] = useState<UserItem[]>(INITIAL_USERS);
  const [recycleBin, setRecycleBin] = useState<DeletedItem[]>(INITIAL_RECYCLE_BIN);

  // Favorites count
  const favoriteCount = useMemo(() => {
    return cameras.filter(c => c.isFavorite).length;
  }, [cameras]);

  // Filtered cameras
  const filteredCameras = useMemo(() => {
    return cameras.filter(cam => {
      if (filterFavoritesOnly && !cam.isFavorite) {
        return false;
      }
      if (onvifFilter !== 'all' && cam.onvifStatus !== onvifFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          cam.name.toLowerCase().includes(q) ||
          cam.location.toLowerCase().includes(q) ||
          cam.type.toLowerCase().includes(q) ||
          (cam.stream360Url && cam.stream360Url.toLowerCase().includes(q)) ||
          (cam.streamPtzUrl && cam.streamPtzUrl.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [cameras, filterFavoritesOnly, onvifFilter, searchQuery]);

  // Pagination calculation
  const totalItems = filteredCameras.length;
  const pageSize = parseInt(rowsPerPage, 10) || 10;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedCameras = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCameras.slice(start, start + pageSize);
  }, [filteredCameras, currentPage, pageSize]);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCameras(prev => prev.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
  };

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleDeleteCamera = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cam = cameras.find(c => c.id === id);
    if (!cam) return;
    if (window.confirm(`Move "${cam.name}" to Recycle Bin?`)) {
      setCameras(prev => prev.filter(c => c.id !== id));
      setRecycleBin(prev => [
        {
          id: `del-${Date.now()}`,
          name: cam.name,
          type: 'Camera',
          deletedDate: new Date().toLocaleString(),
          originalLocation: cam.location
        },
        ...prev
      ]);
    }
  };

  const handleOpenEdit = (cam: CameraItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCamera(cam);
    setFormName(cam.name);
    setFormType(cam.type);
    setFormLocation(cam.location);
    setForm360Url(cam.stream360Url || '');
    setFormPtzUrl(cam.streamPtzUrl || '');
    setIsAddModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingCamera(null);
    setFormName('');
    setFormType('Fixed');
    setFormLocation('');
    setForm360Url('');
    setFormPtzUrl('');
    setIsAddModalOpen(true);
  };

  const handleSaveCamera = () => {
    if (!formName.trim()) {
      alert('Please provide a camera name');
      return;
    }

    if (editingCamera) {
      setCameras(prev => prev.map(c => {
        if (c.id === editingCamera.id) {
          return {
            ...c,
            name: formName.trim(),
            type: formType,
            location: formLocation.trim() || 'Outdoor Sector',
            stream360Url: form360Url.trim() || null,
            streamPtzUrl: formPtzUrl.trim() || null
          };
        }
        return c;
      }));
    } else {
      const newCam: CameraItem = {
        id: `cam-${Date.now()}`,
        name: formName.trim(),
        isFavorite: false,
        stream360Url: form360Url.trim() || null,
        streamPtzUrl: formPtzUrl.trim() || null,
        onvifStatus: 'unsupported',
        createdDate: new Date().toLocaleString(),
        type: formType,
        location: formLocation.trim() || 'Outdoor Sector',
        status: 'active',
        fps: 30,
        resolution: '1080p FHD'
      };
      setCameras(prev => [newCam, ...prev]);
    }
    setIsAddModalOpen(false);
  };

  const handleRestoreItem = (item: DeletedItem) => {
    setRecycleBin(prev => prev.filter(i => i.id !== item.id));
    if (item.type === 'Camera') {
      const restoredCam: CameraItem = {
        id: `cam-${Date.now()}`,
        name: item.name,
        isFavorite: false,
        stream360Url: null,
        streamPtzUrl: null,
        onvifStatus: 'unsupported',
        createdDate: new Date().toLocaleString(),
        type: 'Fixed',
        location: item.originalLocation,
        status: 'active',
        fps: 30,
        resolution: '1080p FHD'
      };
      setCameras(prev => [restoredCam, ...prev]);
    }
  };

  const handleEmptyRecycleBin = () => {
    if (recycleBin.length === 0) return;
    if (window.confirm('Permanently delete all items in the Recycle Bin? This action cannot be undone.')) {
      setRecycleBin([]);
    }
  };

  return (
    <div className="admin-wrapper figma-account-settings-page-wrapper">
      <div className="admin-container figma-account-settings-container">
        
        {/* Top Header conforming to Base Application */}
        <PageHeader 
          title="Administration" 
          icon={<Settings size={20} />}
        />

        {/* 6 Tab Items conforming to Reference Image */}
        <div className="admin-tabs-bar" role="tablist">
          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'camera' ? 'active' : ''}`}
            onClick={() => setActiveTab('camera')}
          >
            <Video size={16} />
            <span>Camera Management</span>
          </button>

          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'zone' ? 'active' : ''}`}
            onClick={() => setActiveTab('zone')}
          >
            <MapPin size={16} />
            <span>Zone Management</span>
          </button>

          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <BrainCircuit size={16} />
            <span>AI Management</span>
          </button>

          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'recycle' ? 'active' : ''}`}
            onClick={() => setActiveTab('recycle')}
          >
            <Trash2 size={16} />
            <span>Recycle Bin</span>
            {recycleBin.length > 0 && (
              <span style={{ fontSize: '11px', background: 'var(--nested-bg)', padding: '1px 6px', borderRadius: '10px' }}>
                {recycleBin.length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'nvr' ? 'active' : ''}`}
            onClick={() => setActiveTab('nvr')}
          >
            <HardDrive size={16} />
            <span>NVR Management</span>
          </button>

          <button
            type="button"
            className={`admin-tab-item ${activeTab === 'user' ? 'active' : ''}`}
            onClick={() => setActiveTab('user')}
          >
            <Users size={16} />
            <span>User Management</span>
          </button>
        </div>

        {/* TAB 1: CAMERA MANAGEMENT (MATCHING REFERENCE IMAGE) */}
        {activeTab === 'camera' && (
          <div className="admin-content-card">
            
            {/* Header: Title + Info Icon */}
            <div className="admin-card-header">
              <div className="admin-card-title-group">
                <h2 className="admin-card-title">Camera Management</h2>
                <span 
                  className="admin-info-icon" 
                  title="Configure and manage RTSP endpoints, 360° panos, PTZ controls, and ONVIF streams"
                >
                  <Info size={16} />
                </span>
              </div>
              <Badge variant="neutral">
                {cameras.length} Total Cameras
              </Badge>
            </div>

            {/* Toolbar Row: Search, Favorites Filter, View Toggle, Date & ONVIF Dropdowns, + Add Camera */}
            <div className="admin-toolbar">
              
              <div className="admin-toolbar-left">
                {/* Search camera... (Matching reference from other screens) */}
                <SearchField
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search camera..."
                />

                {/* Favorites filter with Badge count */}
                <button
                  type="button"
                  className={`admin-fav-filter-btn ${filterFavoritesOnly ? 'active' : ''}`}
                  onClick={() => setFilterFavoritesOnly(prev => !prev)}
                  title={filterFavoritesOnly ? "Show all cameras" : "Filter favorite cameras"}
                >
                  <Star size={16} fill={filterFavoritesOnly ? "currentColor" : "none"} />
                  <span className="admin-fav-badge">{favoriteCount}</span>
                </button>

                {/* Table / Grid Switch */}
                <div className="admin-view-toggle">
                  <button
                    type="button"
                    className={`admin-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                    title="Table View"
                  >
                    <LayoutList size={16} />
                  </button>
                  <button
                    type="button"
                    className={`admin-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>

                {/* Date Dropdown */}
                <div style={{ minWidth: '135px' }}>
                  <CustomSmoothDropdown
                    label="All Dates"
                    value={dateFilter}
                    onChange={setDateFilter}
                    options={DATE_OPTIONS}
                  />
                </div>

                {/* ONVIF Status Dropdown */}
                <div style={{ minWidth: '150px' }}>
                  <CustomSmoothDropdown
                    label="ONVIF Status"
                    value={onvifFilter}
                    onChange={setOnvifFilter}
                    options={ONVIF_OPTIONS}
                  />
                </div>
              </div>

              {/* Right: + Add Camera Icon-Only Pill Button (Matching Reference Image 3) */}
              <div className="admin-toolbar-right">
                <button
                  type="button"
                  className="admin-add-pill-btn"
                  onClick={handleOpenAdd}
                  title="Add Camera"
                  aria-label="Add Camera"
                >
                  <Plus size={20} strokeWidth={2.6} />
                </button>
              </div>

            </div>

            {/* VIEW MODE: TABLE VIEW (EXACT TABLE FROM REFERENCE IMAGE) */}
            {viewMode === 'table' ? (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '22%' }}>Camera Name</th>
                      <th style={{ width: '28%' }}>360° Streaming URL</th>
                      <th style={{ width: '28%' }}>PTZ Streaming URL</th>
                      <th style={{ width: '8%', textAlign: 'center' }}>ONVIF</th>
                      <th style={{ width: '14%' }}>Created Date</th>
                      <th style={{ width: '8%', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCameras.length > 0 ? (
                      paginatedCameras.map(cam => (
                        <tr key={cam.id}>
                          
                          {/* Camera Name with Video Icon & Favorite Star */}
                          <td>
                            <div className="admin-camera-cell">
                              <Video size={16} className="admin-camera-icon" />
                              <span>{cam.name}</span>
                              <span
                                className="admin-star-wrapper"
                                onClick={(e) => toggleFavorite(cam.id, e)}
                                title={cam.isFavorite ? "Remove favorite" : "Mark as favorite"}
                                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                              >
                                <Star
                                  size={15}
                                  className={`admin-star-icon ${cam.isFavorite ? 'starred' : 'unstarred'}`}
                                />
                              </span>
                            </div>
                          </td>

                          {/* 360° Streaming URL */}
                          <td>
                            {cam.stream360Url ? (
                              <div className="admin-url-cell">
                                <span className="admin-url-text" title={cam.stream360Url}>
                                  {cam.stream360Url}
                                </span>
                                <button
                                  type="button"
                                  className="admin-copy-btn"
                                  onClick={(e) => handleCopy(cam.stream360Url!, `${cam.id}-360`, e)}
                                  title="Copy RTSP URL"
                                >
                                  {copiedId === `${cam.id}-360` ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>

                          {/* PTZ Streaming URL */}
                          <td>
                            {cam.streamPtzUrl ? (
                              <div className="admin-url-cell">
                                <span className="admin-url-text" title={cam.streamPtzUrl}>
                                  {cam.streamPtzUrl}
                                </span>
                                <button
                                  type="button"
                                  className="admin-copy-btn"
                                  onClick={(e) => handleCopy(cam.streamPtzUrl!, `${cam.id}-ptz`, e)}
                                  title="Copy RTSP URL"
                                >
                                  {copiedId === `${cam.id}-ptz` ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>

                          {/* ONVIF */}
                          <td style={{ textAlign: 'center' }}>
                            {cam.onvifStatus === 'online' ? (
                              <Badge variant="success">Online</Badge>
                            ) : cam.onvifStatus === 'offline' ? (
                              <Badge variant="danger">Offline</Badge>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>

                          {/* Created Date */}
                          <td>
                            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                              {cam.createdDate}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div className="admin-actions-cell" style={{ justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="admin-action-btn"
                                onClick={() => setPreviewCamera(cam)}
                                title="Live Preview Stream"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                className="admin-action-btn"
                                onClick={(e) => handleOpenEdit(cam, e)}
                                title="Edit Camera"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                className="admin-action-btn delete"
                                onClick={(e) => handleDeleteCamera(cam.id, e)}
                                title="Delete Camera"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                          No cameras match the current filter or search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* VIEW MODE: GRID VIEW */
              <div className="admin-camera-grid">
                {paginatedCameras.map(cam => (
                  <div key={cam.id} className="admin-grid-card">
                    <div className="admin-grid-thumb">
                      <Video size={36} color="var(--primary)" style={{ opacity: 0.6 }} />
                      <div 
                        style={{ 
                          position: 'absolute', 
                          top: '8px', 
                          right: '8px',
                          display: 'flex', 
                          gap: '6px' 
                        }}
                      >
                        <Badge variant="primary">{cam.type}</Badge>
                      </div>
                      <div 
                        style={{ 
                          position: 'absolute', 
                          bottom: '8px', 
                          left: '8px', 
                          fontSize: '11px', 
                          color: '#ffffff', 
                          background: 'rgba(0,0,0,0.6)', 
                          padding: '2px 6px', 
                          borderRadius: '4px' 
                        }}
                      >
                        {cam.resolution} • {cam.fps}fps
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{cam.name}</span>
                        <Star
                          size={15}
                          className={`admin-star-icon ${cam.isFavorite ? 'starred' : 'unstarred'}`}
                          onClick={(e) => toggleFavorite(cam.id, e)}
                        />
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Location: <strong style={{ color: 'var(--text-secondary)' }}>{cam.location}</strong>
                    </div>

                    {cam.stream360Url && (
                      <div style={{ fontSize: '11.5px', background: 'var(--nested-bg)', padding: '5px 8px', borderRadius: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        360°: {cam.stream360Url}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '10px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cam.createdDate}</span>
                      <div className="admin-actions-cell">
                        <button
                          type="button"
                          className="admin-action-btn"
                          onClick={() => setPreviewCamera(cam)}
                          title="Preview"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="admin-action-btn"
                          onClick={(e) => handleOpenEdit(cam, e)}
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="admin-action-btn delete"
                          onClick={(e) => handleDeleteCamera(cam.id, e)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Row */}
            <div className="admin-pagination">
              <div className="admin-pagination-selector">
                <span>Rows per page:</span>
                <div style={{ width: '70px' }}>
                  <CustomSmoothDropdown
                    label={rowsPerPage}
                    value={rowsPerPage}
                    onChange={(val) => {
                      setRowsPerPage(val);
                      setCurrentPage(1);
                    }}
                    options={ROWS_PER_PAGE_OPTIONS}
                  />
                </div>
              </div>

              <div>
                {totalItems > 0 ? (
                  <span>
                    {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
                  </span>
                ) : (
                  <span>0 of 0</span>
                )}
              </div>

              <div className="admin-pagination-actions">
                <button
                  type="button"
                  className="ai-pagination-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="ai-pagination-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: ZONE MANAGEMENT */}
        {activeTab === 'zone' && (
          <div className="admin-content-card">
            <div className="admin-card-header">
              <div className="admin-card-title-group">
                <h2 className="admin-card-title">Zone Management</h2>
                <span className="admin-info-icon" title="Partition facilities into monitored security zones and assign cameras">
                  <Info size={16} />
                </span>
              </div>
              <Badge variant="primary">{zones.length} Active Zones</Badge>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Zone Name</th>
                    <th>Security Tier</th>
                    <th>Assigned Cameras</th>
                    <th>Camera Feeds</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map(zone => (
                    <tr key={zone.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={16} color="var(--primary)" />
                          <span>{zone.name}</span>
                        </div>
                      </td>
                      <td>
                        <Badge variant="info">{zone.type}</Badge>
                      </td>
                      <td>
                        <strong>{zone.camerasCount}</strong> cameras
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {zone.cameras.map((cam, idx) => (
                            <span key={idx} style={{ fontSize: '11.5px', background: 'var(--nested-bg)', padding: '2px 8px', borderRadius: '4px' }}>
                              {cam}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <Badge variant={zone.status === 'active' ? 'success' : 'warning'}>
                          {zone.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>{zone.createdDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: AI MANAGEMENT */}
        {activeTab === 'ai' && (
          <div className="admin-content-card">
            <div className="admin-card-header">
              <div className="admin-card-title-group">
                <h2 className="admin-card-title">AI Analytics & Model Management</h2>
                <span className="admin-info-icon" title="Configure deep learning vision models, alert triggers, and detection sensitivity">
                  <Info size={16} />
                </span>
              </div>
              <Badge variant="success">All Models Operational</Badge>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>AI Model</th>
                    <th>Category</th>
                    <th>Sensitivity</th>
                    <th>Monitored Feeds</th>
                    <th>State</th>
                    <th style={{ textAlign: 'right' }}>Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {aiModels.map(model => (
                    <tr key={model.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <BrainCircuit size={16} color="var(--primary)" />
                          <span>{model.name}</span>
                        </div>
                      </td>
                      <td>
                        <Badge variant="neutral">{model.category}</Badge>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, minWidth: '80px', height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${model.sensitivity}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{model.sensitivity}%</span>
                        </div>
                      </td>
                      <td>{model.assignedCameras} Streams</td>
                      <td>
                        <Badge variant={model.isEnabled ? 'success' : 'neutral'}>
                          {model.isEnabled ? 'ENABLED' : 'PAUSED'}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="figma-btn-cancel"
                          style={{ padding: '4px 12px', fontSize: '12px' }}
                          onClick={() => {
                            setAiModels(prev => prev.map(m => m.id === model.id ? { ...m, isEnabled: !m.isEnabled } : m));
                          }}
                        >
                          {model.isEnabled ? 'Pause' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: RECYCLE BIN */}
        {activeTab === 'recycle' && (
          <div className="admin-content-card">
            <div className="admin-card-header">
              <div className="admin-card-title-group">
                <h2 className="admin-card-title">Recycle Bin</h2>
                <span className="admin-info-icon" title="View, restore, or permanently remove previously deleted entities">
                  <Info size={16} />
                </span>
              </div>
              {recycleBin.length > 0 && (
                <button
                  type="button"
                  className="figma-btn-cancel"
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  onClick={handleEmptyRecycleBin}
                >
                  Empty Recycle Bin
                </button>
              )}
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Type</th>
                    <th>Original Location</th>
                    <th>Deletion Timestamp</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recycleBin.length > 0 ? (
                    recycleBin.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td><Badge variant="neutral">{item.type}</Badge></td>
                        <td style={{ color: 'var(--text-secondary)' }}>{item.originalLocation}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>{item.deletedDate}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="figma-btn-cancel"
                            style={{ padding: '4px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleRestoreItem(item)}
                          >
                            <RotateCcw size={12} />
                            <span>Restore</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                        Recycle Bin is empty.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: NVR MANAGEMENT */}
        {activeTab === 'nvr' && (
          <div className="admin-content-card">
            <div className="admin-card-header">
              <div className="admin-card-title-group">
                <h2 className="admin-card-title">NVR & Storage Management</h2>
                <span className="admin-info-icon" title="Network Video Recorders, local disk allocation, and channel utilization">
                  <Info size={16} />
                </span>
              </div>
              <Badge variant="primary">{nvrs.length} Connected Units</Badge>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>NVR Device</th>
                    <th>IP Address</th>
                    <th>Channels Active</th>
                    <th>Storage Utilization</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {nvrs.map(nvr => (
                    <tr key={nvr.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <HardDrive size={16} color="var(--primary)" />
                          <span>{nvr.name}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12.5px' }}>{nvr.ip}</td>
                      <td><strong>{nvr.channelsUsed}</strong> / {nvr.totalChannels} Channels</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '200px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <span>{nvr.storageUsedTB} TB used</span>
                            <span>{nvr.totalStorageTB} TB total</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                width: `${(nvr.storageUsedTB / nvr.totalStorageTB) * 100}%`, 
                                height: '100%', 
                                background: 'var(--primary)', 
                                borderRadius: '3px' 
                              }} 
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant={nvr.status === 'online' ? 'success' : 'danger'}>
                          {nvr.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: USER MANAGEMENT */}
        {activeTab === 'user' && (
          <div className="admin-content-card">
            <div className="admin-card-header">
              <div className="admin-card-title-group">
                <h2 className="admin-card-title">User & Role Management</h2>
                <span className="admin-info-icon" title="Manage security personnel access, operator permissions, and audit logs">
                  <Info size={16} />
                </span>
              </div>
              <Badge variant="primary">{users.length} Users Enrolled</Badge>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>System Role</th>
                    <th>Account Status</th>
                    <th>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Users size={16} color="var(--primary)" />
                          <span>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        <Badge variant={u.role === 'Superadmin' ? 'primary' : 'info'}>
                          {u.role}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant="success">ACTIVE</Badge>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>{u.lastLogin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ADD / EDIT CAMERA MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingCamera ? `Edit Camera: ${editingCamera.name}` : "Add New Camera"}
        maxWidth="560px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
          
          <div className="admin-form-group">
            <label className="admin-form-label">Camera Name *</label>
            <input
              type="text"
              className="admin-form-input"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. South Gate PTZ, Loading Bay 360"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Camera Type</label>
              <select
                className="admin-form-input"
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
              >
                <option value="Fixed">Fixed Camera</option>
                <option value="PTZ">PTZ (Pan-Tilt-Zoom)</option>
                <option value="360°">360° Panoramic Fisheye</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Installation Zone</label>
              <input
                type="text"
                className="admin-form-input"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g. Main Entrance, Warehouse Aisle"
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">360° Streaming URL (RTSP / RTMP)</label>
            <input
              type="text"
              className="admin-form-input"
              value={form360Url}
              onChange={(e) => setForm360Url(e.target.value)}
              placeholder="rtsp://allcad-chennai.selfip.com:8554/..."
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">PTZ Streaming URL (RTSP / RTMP)</label>
            <input
              type="text"
              className="admin-form-input"
              value={formPtzUrl}
              onChange={(e) => setFormPtzUrl(e.target.value)}
              placeholder="rtsp://allcad-chennai.selfip.com:8554/..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              className="figma-btn-cancel"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-primary-btn"
              onClick={handleSaveCamera}
            >
              {editingCamera ? 'Save Changes' : 'Add Camera'}
            </button>
          </div>

        </div>
      </Modal>

      {/* LIVE STREAM PREVIEW MODAL */}
      <Modal
        isOpen={Boolean(previewCamera)}
        onClose={() => setPreviewCamera(null)}
        title={previewCamera ? `Live Stream: ${previewCamera.name}` : "Camera Preview"}
        maxWidth="740px"
      >
        {previewCamera && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 0' }}>
            
            {/* Simulated Live Viewport */}
            <div 
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 9',
                borderRadius: '10px',
                background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0b1120 100%)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <Video size={48} color="var(--primary)" style={{ opacity: 0.8, marginBottom: '8px' }} />
              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '15px' }}>
                {previewCamera.name}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                {previewCamera.stream360Url || previewCamera.streamPtzUrl || 'Direct RTSP Connection Established'}
              </div>

              {/* Status badges overlay */}
              <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(239, 68, 68, 0.85)', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }} />
                  LIVE
                </span>
                <span style={{ background: 'rgba(0, 0, 0, 0.65)', color: '#ffffff', fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}>
                  {previewCamera.resolution} • {previewCamera.fps} FPS
                </span>
              </div>
            </div>

            {/* Stream info list */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div style={{ background: 'var(--nested-bg)', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '11.5px', marginBottom: '2px' }}>Camera Type & Zone</div>
                <strong>{previewCamera.type}</strong> — {previewCamera.location}
              </div>
              <div style={{ background: 'var(--nested-bg)', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '11.5px', marginBottom: '2px' }}>Stream Status</div>
                <strong style={{ color: 'var(--success)' }}>Active & Transmitting</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                className="admin-primary-btn"
                onClick={() => setPreviewCamera(null)}
              >
                Close Preview
              </button>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}
