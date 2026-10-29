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
  AlertTriangle,
  Boxes
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

export interface ZoneRecord {
  id: string;
  cameraName: string;
  isFavorite: boolean;
  streamingUrl: string;
  zone: string;
  useCase: string;
  detectionActive: boolean;
}

const INITIAL_ZONE_RECORDS: ZoneRecord[] = [
  { id: 'ZN-001', cameraName: 'Cafeteria Counter', isFavorite: false, streamingUrl: '--', zone: '--', useCase: '--', detectionActive: false },
  { id: 'ZN-002', cameraName: 'Chennai Rooftop 360', isFavorite: true, streamingUrl: '--', zone: '--', useCase: '--', detectionActive: true },
  { id: 'ZN-003', cameraName: 'Loading Dock', isFavorite: false, streamingUrl: '--', zone: '--', useCase: '--', detectionActive: false },
  { id: 'ZN-004', cameraName: 'Main Gate PTZ', isFavorite: false, streamingUrl: '--', zone: '--', useCase: '--', detectionActive: false },
  { id: 'ZN-005', cameraName: 'Perimeter East', isFavorite: false, streamingUrl: '--', zone: '--', useCase: '--', detectionActive: false },
  { id: 'ZN-006', cameraName: 'Server Room', isFavorite: false, streamingUrl: '--', zone: '--', useCase: '--', detectionActive: false },
  { id: 'ZN-007', cameraName: 'Street PTZ', isFavorite: true, streamingUrl: '--', zone: '--', useCase: '--', detectionActive: true },
  { id: 'ZN-008', cameraName: 'Warehouse Aisle', isFavorite: false, streamingUrl: '--', zone: '--', useCase: '--', detectionActive: false }
];

export interface AIUseCaseItem {
  id: string;
  name: string;
  cameraName: string;
  model: string;
  sensitivity: number;
  status: 'active' | 'inactive';
  createdDate: string;
}

const USE_CASE_OPTIONS = [
  { label: 'All Use Cases', value: 'all' },
  { label: 'Perimeter Defense', value: 'Perimeter Defense' },
  { label: 'Identity & Access', value: 'Identity & Access' },
  { label: 'Gate Automation', value: 'Gate Automation' },
  { label: 'Workplace Safety', value: 'Workplace Safety' },
  { label: 'Behavioral Analysis', value: 'Behavioral Analysis' }
];

const RECYCLE_TYPE_OPTIONS = [
  { label: 'All Types', value: 'all' },
  { label: 'Camera', value: 'Camera' },
  { label: 'Zone', value: 'Zone' },
  { label: 'AI Rule', value: 'AI Rule' }
];

const RECYCLE_EXPIRY_OPTIONS = [
  { label: 'All Expiry', value: 'all' },
  { label: '< 7 Days', value: '7' },
  { label: '< 14 Days', value: '14' },
  { label: '< 30 Days', value: '30' }
];

const RECYCLE_DATE_OPTIONS = [
  { label: 'All deleted items', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' }
];

const USER_ROLE_OPTIONS = [
  { label: 'All Roles', value: 'all' },
  { label: 'Superadmin', value: 'Superadmin' },
  { label: 'Security Operator', value: 'Security Operator' },
  { label: 'Viewer', value: 'Viewer' }
];

const USER_STATUS_OPTIONS = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' }
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

  // ZONE MANAGEMENT STATE (Matching Reference Screenshot 1)
  const [zoneRecords, setZoneRecords] = useState<ZoneRecord[]>(INITIAL_ZONE_RECORDS);
  const [zoneSearch, setZoneSearch] = useState('');
  const [zoneFavOnly, setZoneFavOnly] = useState(false);
  const [zoneViewMode, setZoneViewMode] = useState<'table' | 'grid'>('table');
  const [zoneDateFilter, setZoneDateFilter] = useState('all');
  const [zoneUseCaseFilter, setZoneUseCaseFilter] = useState('all');
  const [zoneRowsPerPage, setZoneRowsPerPage] = useState('10');
  const [zoneCurrentPage, setZoneCurrentPage] = useState(1);

  const toggleZoneDetection = (id: string) => {
    setZoneRecords(prev => prev.map(item => item.id === id ? { ...item, detectionActive: !item.detectionActive } : item));
  };

  const resetZoneFilters = () => {
    setZoneSearch('');
    setZoneFavOnly(false);
    setZoneDateFilter('all');
    setZoneUseCaseFilter('all');
    setZoneCurrentPage(1);
  };

  const filteredZoneRecords = useMemo(() => {
    return zoneRecords.filter(item => {
      if (zoneFavOnly && !item.isFavorite) return false;
      if (zoneSearch.trim()) {
        const q = zoneSearch.toLowerCase();
        const match = 
          item.cameraName.toLowerCase().includes(q) || 
          item.id.toLowerCase().includes(q) || 
          item.zone.toLowerCase().includes(q) || 
          item.useCase.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [zoneRecords, zoneFavOnly, zoneSearch]);

  const zonePageSize = parseInt(zoneRowsPerPage, 10) || 10;
  const totalZonePages = Math.ceil(filteredZoneRecords.length / zonePageSize) || 1;
  const paginatedZoneRecords = useMemo(() => {
    const start = (zoneCurrentPage - 1) * zonePageSize;
    return filteredZoneRecords.slice(start, start + zonePageSize);
  }, [filteredZoneRecords, zoneCurrentPage, zonePageSize]);

  // AI MANAGEMENT STATE (Matching Reference Screenshot 2)
  const [aiSubTab, setAiSubTab] = useState<'models' | 'usecase' | 'rules'>('usecase');
  const [aiSearch, setAiSearch] = useState('');
  const [aiFavOnly, setAiFavOnly] = useState(false);
  const [aiViewMode, setAiViewMode] = useState<'table' | 'grid'>('table');
  const [aiDateFilter, setAiDateFilter] = useState('all');
  const [aiUseCaseFilter, setAiUseCaseFilter] = useState('all');
  const [useCases, setUseCases] = useState<AIUseCaseItem[]>([]);
  const [isAddUseCaseOpen, setIsAddUseCaseOpen] = useState(false);
  const [newUseCaseName, setNewUseCaseName] = useState('');
  const [newUseCaseCamera, setNewUseCaseCamera] = useState('Chennai Rooftop 360');
  const [newUseCaseModel, setNewUseCaseModel] = useState('Intrusion & Line Crossing Detection');

  const handleCreateUseCase = () => {
    if (!newUseCaseName.trim()) {
      alert('Please enter a Use Case Name');
      return;
    }
    const newCase: AIUseCaseItem = {
      id: `UC-${Date.now().toString().slice(-4)}`,
      name: newUseCaseName.trim(),
      cameraName: newUseCaseCamera,
      model: newUseCaseModel,
      sensitivity: 85,
      status: 'active',
      createdDate: new Date().toLocaleDateString()
    };
    setUseCases(prev => [newCase, ...prev]);
    setNewUseCaseName('');
    setIsAddUseCaseOpen(false);
  };

  // RECYCLE BIN STATE (Matching Reference Screenshot 3)
  const [recycleSearch, setRecycleSearch] = useState('');
  const [recycleTypeFilter, setRecycleTypeFilter] = useState('all');
  const [recycleExpiryFilter, setRecycleExpiryFilter] = useState('all');
  const [recycleDateFilter, setRecycleDateFilter] = useState('all');
  const [recycleItems, setRecycleItems] = useState<DeletedItem[]>([]);

  const resetRecycleFilters = () => {
    setRecycleSearch('');
    setRecycleTypeFilter('all');
    setRecycleExpiryFilter('all');
    setRecycleDateFilter('all');
  };

  const handleEmptyBinAction = () => {
    if (recycleItems.length === 0) return;
    if (window.confirm('Permanently delete all items from Recycle Bin?')) {
      setRecycleItems([]);
    }
  };

  const handleRestoreRecycleItem = (item: DeletedItem) => {
    setRecycleItems(prev => prev.filter(i => i.id !== item.id));
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

  // USER MANAGEMENT STATE (Matching Reference Screenshot 4)
  const [userSubTab, setUserSubTab] = useState<'users' | 'roles'>('users');
  const [userSearch, setUserSearch] = useState('');
  const [userFavOnly, setUserFavOnly] = useState(false);
  const [userViewMode, setUserViewMode] = useState<'table' | 'grid'>('table');
  const [userDateFilter, setUserDateFilter] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Superadmin' | 'Security Operator' | 'Viewer'>('Security Operator');

  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
      if (userStatusFilter !== 'all' && u.status !== userStatusFilter) return false;
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
      }
      return true;
    });
  }, [usersList, userRoleFilter, userStatusFilter, userSearch]);

  const handleAddUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      alert('Please fill in user name and email');
      return;
    }
    const newUser: UserItem = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      status: 'active',
      lastLogin: 'Just now'
    };
    setUsersList(prev => [newUser, ...prev]);
    setNewUserName('');
    setNewUserEmail('');
    setIsAddUserOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    setUsersList(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div className="admin-wrapper figma-account-settings-page-wrapper">
      <div className="admin-container figma-account-settings-container">
        
        {/* Top Header conforming to Base Application */}
        <PageHeader 
          title="Administration" 
          icon={<Settings size={20} />}
        />

        {/* 6 Tab Items conforming to Application UI Standards */}
        <div className="flashback-tabs-container" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'camera'}
            className={`flashback-tab-btn ${activeTab === 'camera' ? 'active' : ''}`}
            onClick={() => setActiveTab('camera')}
          >
            <span className="flashback-tab-icon-badge">
              <Video size={16} />
            </span>
            <span>Camera Management</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'zone'}
            className={`flashback-tab-btn ${activeTab === 'zone' ? 'active' : ''}`}
            onClick={() => setActiveTab('zone')}
          >
            <span className="flashback-tab-icon-badge">
              <MapPin size={16} />
            </span>
            <span>Zone Management</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ai'}
            className={`flashback-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <span className="flashback-tab-icon-badge">
              <BrainCircuit size={16} />
            </span>
            <span>AI Management</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'recycle'}
            className={`flashback-tab-btn ${activeTab === 'recycle' ? 'active' : ''}`}
            onClick={() => setActiveTab('recycle')}
          >
            <span className="flashback-tab-icon-badge">
              <Trash2 size={16} />
            </span>
            <span>Recycle Bin</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'nvr'}
            className={`flashback-tab-btn ${activeTab === 'nvr' ? 'active' : ''}`}
            onClick={() => setActiveTab('nvr')}
          >
            <span className="flashback-tab-icon-badge">
              <HardDrive size={16} />
            </span>
            <span>NVR Management</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'user'}
            className={`flashback-tab-btn ${activeTab === 'user' ? 'active' : ''}`}
            onClick={() => setActiveTab('user')}
          >
            <span className="flashback-tab-icon-badge">
              <Users size={16} />
            </span>
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

        {/* TAB 2: ZONE MANAGEMENT (MATCHING REFERENCE SCREENSHOT 1) */}
        {activeTab === 'zone' && (
          <div className="admin-content-card">
            
            {/* Header: Coral Title + Info Icon */}
            <div className="admin-card-header">
              <div className="admin-card-title-coral">
                <span>Manage Zones</span>
                <span className="admin-info-icon" title="Partition facilities into monitored security zones and assign cameras">
                  <Info size={16} />
                </span>
              </div>
            </div>

            {/* Toolbar */}
            <div className="admin-toolbar">
              <div className="admin-toolbar-left">
                <SearchField
                  value={zoneSearch}
                  onChange={(e) => setZoneSearch(e.target.value)}
                  placeholder="Search zones..."
                />

                {/* Favorites filter with Badge count */}
                <button
                  type="button"
                  className={`admin-fav-filter-btn ${zoneFavOnly ? 'active' : ''}`}
                  onClick={() => setZoneFavOnly(prev => !prev)}
                  title={zoneFavOnly ? "Show all zones" : "Filter favorite cameras"}
                >
                  <Star size={16} fill={zoneFavOnly ? "#f59e0b" : "none"} color={zoneFavOnly ? "#f59e0b" : "currentColor"} />
                  <span className="admin-fav-badge">{zoneRecords.filter(r => r.isFavorite).length}</span>
                </button>

                {/* View Mode Toggle */}
                <div className="admin-view-toggle">
                  <button
                    type="button"
                    className={`admin-view-btn ${zoneViewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setZoneViewMode('table')}
                    title="List View"
                  >
                    <LayoutList size={16} />
                  </button>
                  <button
                    type="button"
                    className={`admin-view-btn ${zoneViewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setZoneViewMode('grid')}
                    title="Grid View"
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>

                {/* Date Dropdown */}
                <div style={{ minWidth: '135px' }}>
                  <CustomSmoothDropdown
                    label="All Dates"
                    value={zoneDateFilter}
                    onChange={setZoneDateFilter}
                    options={DATE_OPTIONS}
                  />
                </div>

                {/* All Use Cases Dropdown */}
                <div style={{ minWidth: '160px' }}>
                  <CustomSmoothDropdown
                    label="All Use Cases"
                    value={zoneUseCaseFilter}
                    onChange={setZoneUseCaseFilter}
                    options={USE_CASE_OPTIONS}
                  />
                </div>
              </div>

              {/* Reset Filters on Right */}
              <div className="admin-toolbar-right">
                <button
                  type="button"
                  className="admin-reset-btn"
                  onClick={resetZoneFilters}
                  title="Reset Filters"
                >
                  <RotateCcw size={14} />
                  <span>Reset Filters</span>
                </button>
              </div>
            </div>

            {/* Table or Grid */}
            {zoneViewMode === 'table' ? (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ color: '#4338ca', fontWeight: 600 }}>ID</th>
                      <th style={{ color: '#4338ca', fontWeight: 600 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span>Camera Name</span>
                          <span>↑</span>
                        </div>
                      </th>
                      <th style={{ color: '#4338ca', fontWeight: 600 }}>Streaming URL</th>
                      <th style={{ color: '#4338ca', fontWeight: 600 }}>Zone</th>
                      <th style={{ color: '#4338ca', fontWeight: 600 }}>Use Case</th>
                      <th style={{ color: '#4338ca', fontWeight: 600 }}>Detection Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedZoneRecords.map(item => (
                      <tr key={item.id}>
                        <td style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '13px' }}>
                          {item.id}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Video size={16} color="var(--text-muted)" />
                            <span style={{ fontWeight: 500 }}>{item.cameraName}</span>
                            {item.isFavorite && (
                              <Star size={14} fill="#f59e0b" color="#f59e0b" />
                            )}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.streamingUrl}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.zone}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.useCase}</td>
                        <td>
                          <div className="admin-detection-cell">
                            <span className={`admin-status-pill ${item.detectionActive ? 'active' : 'inactive'}`}>
                              {item.detectionActive ? 'Active' : 'Inactive'}
                            </span>
                            <label className="admin-toggle-switch">
                              <input
                                type="checkbox"
                                checked={item.detectionActive}
                                onChange={() => toggleZoneDetection(item.id)}
                              />
                              <span className="admin-toggle-slider" />
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-camera-grid">
                {paginatedZoneRecords.map(item => (
                  <div key={item.id} className="admin-grid-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#4338ca' }}>{item.id}</span>
                      <div className="admin-detection-cell">
                        <span className={`admin-status-pill ${item.detectionActive ? 'active' : 'inactive'}`}>
                          {item.detectionActive ? 'Active' : 'Inactive'}
                        </span>
                        <label className="admin-toggle-switch">
                          <input
                            type="checkbox"
                            checked={item.detectionActive}
                            onChange={() => toggleZoneDetection(item.id)}
                          />
                          <span className="admin-toggle-slider" />
                        </label>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Video size={16} color="var(--primary)" />
                      <strong style={{ fontSize: '14px' }}>{item.cameraName}</strong>
                      {item.isFavorite && <Star size={14} fill="#f59e0b" color="#f59e0b" />}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>Zone: {item.zone}</div>
                      <div>Use Case: {item.useCase}</div>
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
                    label={zoneRowsPerPage}
                    value={zoneRowsPerPage}
                    onChange={(val) => {
                      setZoneRowsPerPage(val);
                      setZoneCurrentPage(1);
                    }}
                    options={ROWS_PER_PAGE_OPTIONS}
                  />
                </div>
              </div>

              <div>
                <span>
                  {filteredZoneRecords.length > 0 
                    ? `1–${filteredZoneRecords.length} of ${filteredZoneRecords.length}`
                    : '0 of 0'
                  }
                </span>
              </div>

              <div className="admin-pagination-actions">
                <button
                  type="button"
                  className="ai-pagination-btn"
                  disabled={zoneCurrentPage <= 1}
                  onClick={() => setZoneCurrentPage(prev => Math.max(1, prev - 1))}
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="ai-pagination-btn"
                  disabled={zoneCurrentPage >= totalZonePages}
                  onClick={() => setZoneCurrentPage(prev => Math.min(totalZonePages, prev + 1))}
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: AI MANAGEMENT (MATCHING REFERENCE SCREENSHOT 2) */}
        {activeTab === 'ai' && (
          <div className="admin-content-card">
            
            {/* Header: Coral Title + Info Icon */}
            <div className="admin-card-header" style={{ marginBottom: '-4px' }}>
              <div className="admin-card-title-coral">
                <span>AI Management</span>
                <span className="admin-info-icon" title="Configure deep learning vision models, alert triggers, and detection sensitivity">
                  <Info size={16} />
                </span>
              </div>
            </div>

            {/* Sub-tabs: AI Models | Configure Use Case | Alert Rules */}
            <div className="admin-subtabs-bar" role="tablist">
              <button
                type="button"
                className={`admin-subtab-btn ${aiSubTab === 'models' ? 'active' : ''}`}
                onClick={() => setAiSubTab('models')}
              >
                AI Models
              </button>
              <button
                type="button"
                className={`admin-subtab-btn ${aiSubTab === 'usecase' ? 'active' : ''}`}
                onClick={() => setAiSubTab('usecase')}
              >
                Configure Use Case
              </button>
              <button
                type="button"
                className={`admin-subtab-btn ${aiSubTab === 'rules' ? 'active' : ''}`}
                onClick={() => setAiSubTab('rules')}
              >
                Alert Rules
              </button>
            </div>

            {/* SUBTAB: Configure Use Case (Screenshot 2) */}
            {aiSubTab === 'usecase' && (
              <>
                <div className="admin-card-header" style={{ marginTop: '2px' }}>
                  <div className="admin-card-title-coral" style={{ fontSize: '15px' }}>
                    <span>Manage Use Case</span>
                    <span className="admin-info-icon" title="Manage AI analytical tasks and detection rules">
                      <Info size={15} />
                    </span>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="admin-toolbar">
                  <div className="admin-toolbar-left">
                    <SearchField
                      value={aiSearch}
                      onChange={(e) => setAiSearch(e.target.value)}
                      placeholder="Search use case..."
                    />

                    <button
                      type="button"
                      className={`admin-fav-filter-btn ${aiFavOnly ? 'active' : ''}`}
                      onClick={() => setAiFavOnly(prev => !prev)}
                      title="Filter favorites"
                    >
                      <Star size={16} fill={aiFavOnly ? "#f59e0b" : "none"} color={aiFavOnly ? "#f59e0b" : "currentColor"} />
                    </button>

                    <div className="admin-view-toggle">
                      <button
                        type="button"
                        className={`admin-view-btn ${aiViewMode === 'table' ? 'active' : ''}`}
                        onClick={() => setAiViewMode('table')}
                      >
                        <LayoutList size={16} />
                      </button>
                      <button
                        type="button"
                        className={`admin-view-btn ${aiViewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setAiViewMode('grid')}
                      >
                        <LayoutGrid size={16} />
                      </button>
                    </div>

                    <div style={{ minWidth: '135px' }}>
                      <CustomSmoothDropdown
                        label="All Dates"
                        value={aiDateFilter}
                        onChange={setAiDateFilter}
                        options={DATE_OPTIONS}
                      />
                    </div>

                    <div style={{ minWidth: '160px' }}>
                      <CustomSmoothDropdown
                        label="All Use Cases"
                        value={aiUseCaseFilter}
                        onChange={setAiUseCaseFilter}
                        options={USE_CASE_OPTIONS}
                      />
                    </div>
                  </div>

                  <div className="admin-toolbar-right">
                    <button
                      type="button"
                      className="admin-blue-btn"
                      onClick={() => setIsAddUseCaseOpen(true)}
                    >
                      <Plus size={16} strokeWidth={2.5} />
                      <span>New Use Case</span>
                    </button>
                  </div>
                </div>

                {/* Empty State matching Screenshot 2 */}
                {useCases.length === 0 ? (
                  <div className="admin-empty-state-box">
                    <div className="admin-empty-icon-wrap">
                      <Boxes size={68} strokeWidth={1.3} />
                    </div>
                    <p className="admin-empty-title">No use cases available.</p>
                  </div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ color: '#4338ca', fontWeight: 600 }}>Use Case ID</th>
                          <th style={{ color: '#4338ca', fontWeight: 600 }}>Use Case Name</th>
                          <th style={{ color: '#4338ca', fontWeight: 600 }}>Assigned Camera</th>
                          <th style={{ color: '#4338ca', fontWeight: 600 }}>AI Vision Model</th>
                          <th style={{ color: '#4338ca', fontWeight: 600 }}>Sensitivity</th>
                          <th style={{ color: '#4338ca', fontWeight: 600 }}>Status</th>
                          <th style={{ color: '#4338ca', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {useCases.map(uc => (
                          <tr key={uc.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{uc.id}</td>
                            <td style={{ fontWeight: 600 }}>{uc.name}</td>
                            <td>{uc.cameraName}</td>
                            <td><Badge variant="neutral">{uc.model}</Badge></td>
                            <td>{uc.sensitivity}%</td>
                            <td>
                              <Badge variant={uc.status === 'active' ? 'success' : 'neutral'}>
                                {uc.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="admin-action-btn delete"
                                onClick={() => setUseCases(prev => prev.filter(c => c.id !== uc.id))}
                                title="Delete Use Case"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* SUBTAB: AI Models */}
            {aiSubTab === 'models' && (
              <div className="admin-table-wrapper" style={{ marginTop: '12px' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ color: '#4338ca', fontWeight: 600 }}>AI Model</th>
                      <th style={{ color: '#4338ca', fontWeight: 600 }}>Category</th>
                      <th style={{ color: '#4338ca', fontWeight: 600 }}>Sensitivity</th>
                      <th style={{ color: '#4338ca', fontWeight: 600 }}>Monitored Feeds</th>
                      <th style={{ color: '#4338ca', fontWeight: 600 }}>State</th>
                      <th style={{ color: '#4338ca', fontWeight: 600, textAlign: 'right' }}>Toggle</th>
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
            )}

            {/* SUBTAB: Alert Rules */}
            {aiSubTab === 'rules' && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Activity size={36} color="var(--primary)" style={{ opacity: 0.7, marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px' }}>Automated Detection Rules</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  All AI notification pipelines and alert webhook triggers are actively syncing.
                </p>
              </div>
            )}

          </div>
        )}

        {/* TAB 4: RECYCLE BIN (MATCHING REFERENCE SCREENSHOT 3) */}
        {activeTab === 'recycle' && (
          <div className="admin-content-card">
            
            {/* Header: Coral Title + Info Icon */}
            <div className="admin-card-header">
              <div className="admin-card-title-coral">
                <span>Recycle Bin</span>
                <span className="admin-info-icon" title="View, restore, or permanently remove previously deleted entities">
                  <Info size={16} />
                </span>
              </div>
            </div>

            {/* Toolbar */}
            <div className="admin-toolbar">
              <div className="admin-toolbar-left">
                <SearchField
                  value={recycleSearch}
                  onChange={(e) => setRecycleSearch(e.target.value)}
                  placeholder="Search recycle bin..."
                />

                <div style={{ minWidth: '135px' }}>
                  <CustomSmoothDropdown
                    label="All Types"
                    value={recycleTypeFilter}
                    onChange={setRecycleTypeFilter}
                    options={RECYCLE_TYPE_OPTIONS}
                  />
                </div>

                <div style={{ minWidth: '135px' }}>
                  <CustomSmoothDropdown
                    label="All Expiry"
                    value={recycleExpiryFilter}
                    onChange={setRecycleExpiryFilter}
                    options={RECYCLE_EXPIRY_OPTIONS}
                  />
                </div>

                <div style={{ minWidth: '175px' }}>
                  <CustomSmoothDropdown
                    label="All deleted items"
                    value={recycleDateFilter}
                    onChange={setRecycleDateFilter}
                    options={RECYCLE_DATE_OPTIONS}
                  />
                </div>
              </div>

              <div className="admin-toolbar-right">
                <button
                  type="button"
                  className={`admin-empty-bin-btn ${recycleItems.length > 0 ? 'active' : ''}`}
                  disabled={recycleItems.length === 0}
                  onClick={handleEmptyBinAction}
                >
                  <Trash2 size={14} />
                  <span>Empty Bin</span>
                </button>

                <button
                  type="button"
                  className="admin-reset-btn"
                  onClick={resetRecycleFilters}
                >
                  <RotateCcw size={14} />
                  <span>Reset Filters</span>
                </button>
              </div>
            </div>

            {/* Table or Empty State (Screenshot 3) */}
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ color: '#4338ca', fontWeight: 600 }}>Item Name</th>
                    <th style={{ color: '#4338ca', fontWeight: 600 }}>Type</th>
                    <th style={{ color: '#4338ca', fontWeight: 600 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>Deleted Date</span>
                        <span>↓</span>
                      </div>
                    </th>
                    <th style={{ color: '#4338ca', fontWeight: 600 }}>Days Remaining</th>
                    <th style={{ color: '#4338ca', fontWeight: 600 }}>Original Location</th>
                    {recycleItems.length > 0 && <th style={{ color: '#4338ca', fontWeight: 600, textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {recycleItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 0 }}>
                        <div className="admin-empty-state-box" style={{ padding: '60px 20px', minHeight: '230px' }}>
                          <div className="admin-empty-icon-wrap">
                            <Trash2 size={46} strokeWidth={1.4} />
                          </div>
                          <p className="admin-empty-title">No data is present.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recycleItems.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td><Badge variant="neutral">{item.type}</Badge></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>{item.deletedDate}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>30 days</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{item.originalLocation}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="figma-btn-cancel"
                            style={{ padding: '4px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleRestoreRecycleItem(item)}
                          >
                            <RotateCcw size={12} />
                            <span>Restore</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="admin-pagination">
              <div className="admin-pagination-selector">
                <span>Rows per page:</span>
                <div style={{ width: '70px' }}>
                  <CustomSmoothDropdown
                    label="10"
                    value="10"
                    onChange={() => {}}
                    options={ROWS_PER_PAGE_OPTIONS}
                  />
                </div>
              </div>

              <div>
                <span>{recycleItems.length > 0 ? `1–${recycleItems.length} of ${recycleItems.length}` : '0–0 of 0'}</span>
              </div>

              <div className="admin-pagination-actions">
                <button type="button" className="ai-pagination-btn" disabled title="Previous">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" className="ai-pagination-btn" disabled title="Next">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: NVR MANAGEMENT */}
        {activeTab === 'nvr' && (
          <div className="admin-content-card">
            <div className="admin-card-header">
              <div className="admin-card-title-coral">
                <span>NVR & Storage Management</span>
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
                    <th style={{ color: '#4338ca', fontWeight: 600 }}>NVR Device</th>
                    <th style={{ color: '#4338ca', fontWeight: 600 }}>IP Address</th>
                    <th style={{ color: '#4338ca', fontWeight: 600 }}>Channels Active</th>
                    <th style={{ color: '#4338ca', fontWeight: 600 }}>Storage Utilization</th>
                    <th style={{ color: '#4338ca', fontWeight: 600 }}>State</th>
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

        {/* TAB 6: USER MANAGEMENT (MATCHING REFERENCE SCREENSHOT 4) */}
        {activeTab === 'user' && (
          <div className="admin-content-card">
            
            {/* Header: Coral Title + Info Icon */}
            <div className="admin-card-header" style={{ marginBottom: '-4px' }}>
              <div className="admin-card-title-coral">
                <span>User Management</span>
                <span className="admin-info-icon" title="Manage security personnel access, operator permissions, and audit logs">
                  <Info size={16} />
                </span>
              </div>
            </div>

            {/* Sub-tabs: Users | Roles & Permissions */}
            <div className="admin-subtabs-bar" role="tablist">
              <button
                type="button"
                className={`admin-subtab-btn ${userSubTab === 'users' ? 'active' : ''}`}
                onClick={() => setUserSubTab('users')}
              >
                Users
              </button>
              <button
                type="button"
                className={`admin-subtab-btn ${userSubTab === 'roles' ? 'active' : ''}`}
                onClick={() => setUserSubTab('roles')}
              >
                Roles & Permissions
              </button>
            </div>

            {/* SUBTAB: Users */}
            {userSubTab === 'users' && (
              <>
                {/* Toolbar */}
                <div className="admin-toolbar">
                  <div className="admin-toolbar-left">
                    <SearchField
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users..."
                    />

                    <button
                      type="button"
                      className={`admin-fav-filter-btn ${userFavOnly ? 'active' : ''}`}
                      onClick={() => setUserFavOnly(prev => !prev)}
                      title="Filter favorites"
                    >
                      <Star size={16} fill={userFavOnly ? "#f59e0b" : "none"} color={userFavOnly ? "#f59e0b" : "currentColor"} />
                    </button>

                    <div className="admin-view-toggle">
                      <button
                        type="button"
                        className={`admin-view-btn ${userViewMode === 'table' ? 'active' : ''}`}
                        onClick={() => setUserViewMode('table')}
                      >
                        <LayoutList size={16} />
                      </button>
                      <button
                        type="button"
                        className={`admin-view-btn ${userViewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setUserViewMode('grid')}
                      >
                        <LayoutGrid size={16} />
                      </button>
                    </div>

                    <div style={{ minWidth: '135px' }}>
                      <CustomSmoothDropdown
                        label="All Dates"
                        value={userDateFilter}
                        onChange={setUserDateFilter}
                        options={DATE_OPTIONS}
                      />
                    </div>

                    <div style={{ minWidth: '135px' }}>
                      <CustomSmoothDropdown
                        label="All Roles"
                        value={userRoleFilter}
                        onChange={setUserRoleFilter}
                        options={USER_ROLE_OPTIONS}
                      />
                    </div>

                    <div style={{ minWidth: '135px' }}>
                      <CustomSmoothDropdown
                        label="All Status"
                        value={userStatusFilter}
                        onChange={setUserStatusFilter}
                        options={USER_STATUS_OPTIONS}
                      />
                    </div>
                  </div>

                  <div className="admin-toolbar-right">
                    <button
                      type="button"
                      className="admin-blue-btn"
                      onClick={() => setIsAddUserOpen(true)}
                    >
                      <Plus size={16} strokeWidth={2.5} />
                      <span>Add User</span>
                    </button>
                  </div>
                </div>

                {/* Content: Empty state or Table matching Screenshot 4 */}
                {filteredUsers.length === 0 ? (
                  <div className="admin-empty-state-box" style={{ border: '1px solid var(--border-light)', borderRadius: '10px' }}>
                    <p className="admin-empty-title">No users found.</p>
                  </div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ color: '#4338ca', fontWeight: 600 }}>User</th>
                          <th style={{ color: '#4338ca', fontWeight: 600 }}>Email</th>
                          <th style={{ color: '#4338ca', fontWeight: 600 }}>System Role</th>
                          <th style={{ color: '#4338ca', fontWeight: 600 }}>Account Status</th>
                          <th style={{ color: '#4338ca', fontWeight: 600 }}>Last Active</th>
                          <th style={{ color: '#4338ca', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(u => (
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
                              <span className={`admin-status-pill ${u.status === 'active' ? 'active' : 'inactive'}`}>
                                {u.status === 'active' ? 'Active' : 'Suspended'}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>{u.lastLogin}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="admin-action-btn delete"
                                onClick={() => handleDeleteUser(u.id)}
                                title="Remove User"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination footer */}
                <div className="admin-pagination">
                  <div className="admin-pagination-selector">
                    <span>Rows per page:</span>
                    <div style={{ width: '70px' }}>
                      <CustomSmoothDropdown
                        label="10"
                        value="10"
                        onChange={() => {}}
                        options={ROWS_PER_PAGE_OPTIONS}
                      />
                    </div>
                  </div>

                  <div>
                    <span>{filteredUsers.length > 0 ? `1–${filteredUsers.length} of ${filteredUsers.length}` : '0–0 of 0'}</span>
                  </div>

                  <div className="admin-pagination-actions">
                    <button type="button" className="ai-pagination-btn" disabled title="Previous">
                      <ChevronLeft size={16} />
                    </button>
                    <button type="button" className="ai-pagination-btn" disabled title="Next">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* SUBTAB: Roles & Permissions */}
            {userSubTab === 'roles' && (
              <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ background: 'var(--nested-bg)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Shield size={18} color="var(--primary)" />
                      <strong style={{ fontSize: '14px' }}>Superadmin</strong>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                      Full organizational governance, configuration management, user provisioning, and audit logs.
                    </p>
                    <Badge variant="primary">Full Permissions</Badge>
                  </div>

                  <div style={{ background: 'var(--nested-bg)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Shield size={18} color="#2563eb" />
                      <strong style={{ fontSize: '14px' }}>Security Operator</strong>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                      Live monitoring, PTZ joystick operations, alert incident triage, and playback verification.
                    </p>
                    <Badge variant="info">Operator Level</Badge>
                  </div>

                  <div style={{ background: 'var(--nested-bg)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Shield size={18} color="#6b7280" />
                      <strong style={{ fontSize: '14px' }}>Viewer</strong>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                      Read-only live video stream inspection and general facility dashboard reporting.
                    </p>
                    <Badge variant="neutral">Read Only</Badge>
                  </div>
                </div>
              </div>
            )}

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

      {/* ADD NEW USE CASE MODAL (FOR SCREENSHOT 2) */}
      <Modal
        isOpen={isAddUseCaseOpen}
        onClose={() => setIsAddUseCaseOpen(false)}
        title="Configure New AI Use Case"
        maxWidth="520px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 0' }}>
          <div className="admin-form-group">
            <label className="admin-form-label">Use Case Name *</label>
            <input
              type="text"
              className="admin-form-input"
              value={newUseCaseName}
              onChange={(e) => setNewUseCaseName(e.target.value)}
              placeholder="e.g. Roof Perimeter Breach Alert"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Target Camera Feed</label>
            <select
              className="admin-form-input"
              value={newUseCaseCamera}
              onChange={(e) => setNewUseCaseCamera(e.target.value)}
            >
              {cameras.map(c => (
                <option key={c.id} value={c.name}>{c.name} ({c.type})</option>
              ))}
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">AI Analytical Model</label>
            <select
              className="admin-form-input"
              value={newUseCaseModel}
              onChange={(e) => setNewUseCaseModel(e.target.value)}
            >
              <option value="Intrusion & Line Crossing Detection">Intrusion & Line Crossing Detection</option>
              <option value="Facial Recognition & Access Verification">Facial Recognition & Access Verification</option>
              <option value="Vehicle License Plate Recognition (LPR)">Vehicle License Plate Recognition (LPR)</option>
              <option value="PPE Helmet & Vest Compliance Detection">PPE Helmet & Vest Compliance Detection</option>
              <option value="Loitering & Abandoned Object Alert">Loitering & Abandoned Object Alert</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              className="figma-btn-cancel"
              onClick={() => setIsAddUseCaseOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-blue-btn"
              onClick={handleCreateUseCase}
            >
              Create Use Case
            </button>
          </div>
        </div>
      </Modal>

      {/* ADD USER MODAL (FOR SCREENSHOT 4) */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Add New System User"
        maxWidth="500px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 0' }}>
          <div className="admin-form-group">
            <label className="admin-form-label">Full Name *</label>
            <input
              type="text"
              className="admin-form-input"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="e.g. Johnathan Miller"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Email Address *</label>
            <input
              type="email"
              className="admin-form-input"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="e.g. j.miller@oomniwatch.ai"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Assigned Role</label>
            <select
              className="admin-form-input"
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as any)}
            >
              <option value="Security Operator">Security Operator (Monitoring & Alerts)</option>
              <option value="Viewer">Viewer (Read-Only)</option>
              <option value="Superadmin">Superadmin (Full Control)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              className="figma-btn-cancel"
              onClick={() => setIsAddUserOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-blue-btn"
              onClick={handleAddUser}
            >
              Add User
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
