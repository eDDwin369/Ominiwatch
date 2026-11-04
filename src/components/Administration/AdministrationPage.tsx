import React, { useState, useMemo, useEffect } from 'react';
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
  Calendar, 
  Filter,
  Play,
  RotateCcw,
  Shield,
  Activity,
  AlertTriangle,
  Boxes,
  MoreVertical
} from 'lucide-react';
import { PageHeader } from '../shared/PageHeader';
import { SearchField } from '../shared/SearchField';
import { CustomSmoothDropdown } from '../shared/CustomSmoothDropdown';
import { RowsPerPageSelector } from '../shared/RowsPerPageSelector';
import { Modal } from '../shared/Modal';
import { Badge } from '../shared/Badge';
import { TextField } from '../shared/TextField';
import { Button } from '../shared/Button';
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
  isFavorite: boolean;
  hasStar?: boolean;
  modelFile: string;
  accuracy: number;
  description: string;
  uploadedOn: string;
  category?: string;
  isEnabled?: boolean;
  sensitivity?: number;
  assignedCameras?: number;
  status?: 'active' | 'paused';
}

export interface NVRChannelItem {
  id: string;
  nvrId: string;
  channelNo: string;
  cameraName: string;
  ipAddress: string;
  resolution: string;
  fps: number;
  bitrate: string;
  status: 'online' | 'recording' | 'standby' | 'offline';
  storageUsed: string;
}

export interface NVRItem {
  id: string;
  name: string;
  ip: string;
  brand?: string;
  channelsUsed: number;
  totalChannels: number;
  storageUsedTB: number;
  totalStorageTB: number;
  storageUsedGB: number;
  totalStorageGB: number;
  retentionDays: number;
  storageThreshold: number;
  fifoDelete: number;
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
  {
    id: 'UC-1004',
    name: 'ANPR',
    isFavorite: false,
    hasStar: true,
    modelFile: 'anpr_v1.pt',
    accuracy: 88,
    description: 'Reads license plates at gates and checkpoints.',
    uploadedOn: '26Aug26',
    isEnabled: true,
    status: 'active'
  },
  {
    id: 'UC-1002',
    name: 'Face Recognition',
    isFavorite: true,
    hasStar: true,
    modelFile: 'face_recognition_v2.onnx',
    accuracy: 96,
    description: 'Matches detected faces against enrolled identities.',
    uploadedOn: '7Jul26',
    isEnabled: true,
    status: 'active'
  },
  {
    id: 'UC-1005',
    name: 'Intrusion Detection',
    isFavorite: false,
    hasStar: false,
    modelFile: 'intrusion_v1.pt',
    accuracy: 90,
    description: 'Raises alerts when movement crosses a tripwire.',
    uploadedOn: '24Sep26',
    isEnabled: true,
    status: 'active'
  },
  {
    id: 'UC-1006',
    name: 'PPE Compliance',
    isFavorite: false,
    hasStar: false,
    modelFile: 'ppe_compliance_v1.pt',
    accuracy: 86,
    description: 'Checks helmets and vests in the loading bay.',
    uploadedOn: '23Oct26',
    isEnabled: true,
    status: 'active'
  },
  {
    id: 'UC-1001',
    name: 'Person Detection',
    isFavorite: true,
    hasStar: true,
    modelFile: 'person_detection_v3.pt',
    accuracy: 94,
    description: 'Detects people in restricted and public zones.',
    uploadedOn: '7Jun26',
    isEnabled: true,
    status: 'active'
  },
  {
    id: 'UC-1003',
    name: 'Vehicle Detection',
    isFavorite: false,
    hasStar: false,
    modelFile: 'vehicle_detection_v2.pt',
    accuracy: 91,
    description: 'Detects cars, vans and trucks in parking areas.',
    uploadedOn: '1Aug26',
    isEnabled: true,
    status: 'active'
  }
];

const INITIAL_NVRS: NVRItem[] = [
  { 
    id: 'nvr-01', 
    name: 'NVR-Master-Chennai-01', 
    ip: '192.168.1.101', 
    brand: 'Hikvision',
    channelsUsed: 8, 
    totalChannels: 16, 
    storageUsedTB: 10.8, 
    totalStorageTB: 16, 
    storageUsedGB: 150, 
    totalStorageGB: 500,
    retentionDays: 30,
    storageThreshold: 90,
    fifoDelete: 10,
    status: 'online' 
  },
  { 
    id: 'nvr-02', 
    name: 'NVR-Secondary-Vault-02', 
    ip: '192.168.1.102', 
    brand: 'Dahua Technology',
    channelsUsed: 4, 
    totalChannels: 8, 
    storageUsedTB: 4.2, 
    totalStorageTB: 8, 
    storageUsedGB: 85, 
    totalStorageGB: 250,
    retentionDays: 14,
    storageThreshold: 85,
    fifoDelete: 10,
    status: 'online' 
  },
  { 
    id: 'nvr-03', 
    name: 'NVR-Warehouse-Bay-03', 
    ip: '192.168.1.103', 
    brand: 'Uniview',
    channelsUsed: 12, 
    totalChannels: 16, 
    storageUsedTB: 8.4, 
    totalStorageTB: 12, 
    storageUsedGB: 320, 
    totalStorageGB: 500,
    retentionDays: 45,
    storageThreshold: 90,
    fifoDelete: 10,
    status: 'online' 
  },
  { 
    id: 'nvr-04', 
    name: 'NVR-Perimeter-Gate-04', 
    ip: '192.168.1.104', 
    brand: 'Axis Communications',
    channelsUsed: 6, 
    totalChannels: 8, 
    storageUsedTB: 6.1, 
    totalStorageTB: 8, 
    storageUsedGB: 210, 
    totalStorageGB: 300,
    retentionDays: 60,
    storageThreshold: 80,
    fifoDelete: 15,
    status: 'online' 
  },
  { 
    id: 'nvr-05', 
    name: 'NVR-Logistics-Hub-05', 
    ip: '192.168.1.105', 
    brand: 'Hanwha Vision',
    channelsUsed: 14, 
    totalChannels: 32, 
    storageUsedTB: 14.5, 
    totalStorageTB: 24, 
    storageUsedGB: 410, 
    totalStorageGB: 600,
    retentionDays: 90,
    storageThreshold: 85,
    fifoDelete: 10,
    status: 'online' 
  },
  { 
    id: 'nvr-06', 
    name: 'NVR-Cafeteria-Public-06', 
    ip: '192.168.1.106', 
    brand: 'Hikvision',
    channelsUsed: 5, 
    totalChannels: 8, 
    storageUsedTB: 3.8, 
    totalStorageTB: 6, 
    storageUsedGB: 115, 
    totalStorageGB: 200,
    retentionDays: 21,
    storageThreshold: 85,
    fifoDelete: 10,
    status: 'online' 
  },
  { 
    id: 'nvr-07', 
    name: 'NVR-Rooftop-PTZ-07', 
    ip: '192.168.1.107', 
    brand: 'Bosch Security',
    channelsUsed: 8, 
    totalChannels: 16, 
    storageUsedTB: 7.2, 
    totalStorageTB: 10, 
    storageUsedGB: 275, 
    totalStorageGB: 400,
    retentionDays: 30,
    storageThreshold: 90,
    fifoDelete: 10,
    status: 'online' 
  },
  { 
    id: 'nvr-08', 
    name: 'NVR-Backup-Server-08', 
    ip: '192.168.1.108', 
    brand: 'Dahua Technology',
    channelsUsed: 16, 
    totalChannels: 32, 
    storageUsedTB: 18.0, 
    totalStorageTB: 32, 
    storageUsedGB: 450, 
    totalStorageGB: 800,
    retentionDays: 120,
    storageThreshold: 95,
    fifoDelete: 5,
    status: 'online' 
  }
];

const INITIAL_NVR_CHANNELS: NVRChannelItem[] = [
  { id: 'ch-01', nvrId: 'nvr-01', channelNo: 'CH-01', cameraName: 'Chennai Rooftop 360', ipAddress: '192.168.1.201', resolution: '4K UHD', fps: 30, bitrate: '4096 kbps', status: 'recording', storageUsed: '24.5 GB' },
  { id: 'ch-02', nvrId: 'nvr-01', channelNo: 'CH-02', cameraName: 'Street PTZ', ipAddress: '192.168.1.202', resolution: '4K UHD', fps: 30, bitrate: '4096 kbps', status: 'recording', storageUsed: '21.8 GB' },
  { id: 'ch-03', nvrId: 'nvr-01', channelNo: 'CH-03', cameraName: 'Server Room', ipAddress: '192.168.1.203', resolution: '1080p', fps: 60, bitrate: '2048 kbps', status: 'online', storageUsed: '18.2 GB' },
  { id: 'ch-04', nvrId: 'nvr-01', channelNo: 'CH-04', cameraName: 'Warehouse Aisle', ipAddress: '192.168.1.204', resolution: '1080p', fps: 30, bitrate: '2048 kbps', status: 'online', storageUsed: '15.4 GB' },
  { id: 'ch-05', nvrId: 'nvr-01', channelNo: 'CH-05', cameraName: 'Loading Bay Gate', ipAddress: '192.168.1.205', resolution: '1080p', fps: 30, bitrate: '2048 kbps', status: 'online', storageUsed: '19.1 GB' },
  { id: 'ch-06', nvrId: 'nvr-01', channelNo: 'CH-06', cameraName: 'Reception Lobby', ipAddress: '192.168.1.206', resolution: '1080p', fps: 25, bitrate: '1536 kbps', status: 'recording', storageUsed: '14.2 GB' },
  { id: 'ch-07', nvrId: 'nvr-01', channelNo: 'CH-07', cameraName: 'Perimeter Fence North', ipAddress: '192.168.1.207', resolution: '2K QHD', fps: 30, bitrate: '3072 kbps', status: 'standby', storageUsed: '22.0 GB' },
  { id: 'ch-08', nvrId: 'nvr-01', channelNo: 'CH-08', cameraName: 'East Parking Lot', ipAddress: '192.168.1.208', resolution: '1080p', fps: 30, bitrate: '2048 kbps', status: 'online', storageUsed: '14.8 GB' },
  { id: 'ch-09', nvrId: 'nvr-02', channelNo: 'CH-01', cameraName: 'Vault Entry', ipAddress: '192.168.1.211', resolution: '4K UHD', fps: 30, bitrate: '4096 kbps', status: 'recording', storageUsed: '28.0 GB' },
  { id: 'ch-10', nvrId: 'nvr-02', channelNo: 'CH-02', cameraName: 'Vault Interior', ipAddress: '192.168.1.212', resolution: '4K UHD', fps: 30, bitrate: '4096 kbps', status: 'recording', storageUsed: '25.5 GB' },
  { id: 'ch-11', nvrId: 'nvr-02', channelNo: 'CH-03', cameraName: 'Safe Deposit Corridor', ipAddress: '192.168.1.213', resolution: '1080p', fps: 30, bitrate: '2048 kbps', status: 'online', storageUsed: '16.2 GB' },
  { id: 'ch-12', nvrId: 'nvr-02', channelNo: 'CH-04', cameraName: 'Emergency Exit West', ipAddress: '192.168.1.214', resolution: '1080p', fps: 25, bitrate: '1536 kbps', status: 'standby', storageUsed: '15.3 GB' }
];

const NVR_BRAND_OPTIONS = [
  { label: 'Hikvision', value: 'Hikvision' },
  { label: 'Dahua Technology', value: 'Dahua Technology' },
  { label: 'Axis Communications', value: 'Axis Communications' },
  { label: 'Hanwha Vision', value: 'Hanwha Vision' },
  { label: 'Uniview (UNV)', value: 'Uniview (UNV)' },
  { label: 'Bosch Security', value: 'Bosch Security' },
  { label: 'Honeywell', value: 'Honeywell' },
  { label: 'Generic ONVIF', value: 'Generic ONVIF' }
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
  { id: 'ZN-001', cameraName: 'Cafeteria Counter', isFavorite: false, streamingUrl: 'rtsp://192.168.1.101:554/ch1/main', zone: 'Cafeteria & Dining', useCase: 'Person Detection', detectionActive: false },
  { id: 'ZN-002', cameraName: 'Chennai Rooftop 360', isFavorite: true, streamingUrl: 'rtsp://allcad-chennai.selfip.com:8554/RTMP_CAM23', zone: 'Rooftop Perimeter', useCase: 'Intrusion Detection', detectionActive: true },
  { id: 'ZN-003', cameraName: 'Loading Dock', isFavorite: false, streamingUrl: 'rtsp://192.168.1.103:554/ch3/stream', zone: 'Logistics Bay North', useCase: 'PPE Compliance', detectionActive: false },
  { id: 'ZN-004', cameraName: 'Main Gate PTZ', isFavorite: false, streamingUrl: 'rtsp://allcad-chennai.selfip.com:8554/0b2a40cc-9406-4074-9549-cbe113b10b0e', zone: 'Main Entrance Gate', useCase: 'ANPR', detectionActive: false },
  { id: 'ZN-005', cameraName: 'Perimeter East', isFavorite: false, streamingUrl: 'rtsp://192.168.1.105:554/ch5/live', zone: 'East Boundary Fence', useCase: 'Intrusion Detection', detectionActive: false },
  { id: 'ZN-006', cameraName: 'Server Room Vault', isFavorite: true, streamingUrl: 'rtsp://192.168.1.106:554/ch6/vault', zone: 'Data Center Vault', useCase: 'Face Recognition', detectionActive: true },
  { id: 'ZN-007', cameraName: 'Street PTZ', isFavorite: true, streamingUrl: 'rtsp://allcad-chennai.selfip.com:8554/0b2a40cc-9406-4074-9549-cbe113b10b0e', zone: 'West Crossroad', useCase: 'Vehicle Detection', detectionActive: true },
  { id: 'ZN-008', cameraName: 'Warehouse Aisle', isFavorite: false, streamingUrl: 'rtsp://192.168.1.108:554/ch8/safety', zone: 'Central Warehouse', useCase: 'PPE Compliance', detectionActive: false }
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
  { label: 'Person Detection', value: 'Person Detection' },
  { label: 'Intrusion Detection', value: 'Intrusion Detection' },
  { label: 'PPE Compliance', value: 'PPE Compliance' },
  { label: 'ANPR', value: 'ANPR' },
  { label: 'Face Recognition', value: 'Face Recognition' },
  { label: 'Vehicle Detection', value: 'Vehicle Detection' }
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
  initialTab,
  onAdminTabChange
}: AdministrationPageProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (initialTab && ['camera', 'zone', 'ai', 'recycle', 'nvr', 'user'].includes(initialTab)) {
      return initialTab as AdminTab;
    }
    return 'camera';
  });

  // Keep activeTab in sync whenever initialTab prop changes (e.g., from sidebar navigation)
  useEffect(() => {
    if (initialTab && ['camera', 'zone', 'ai', 'recycle', 'nvr', 'user'].includes(initialTab)) {
      setActiveTab(initialTab as AdminTab);
    }
  }, [initialTab]);

  // Camera Management State
  const [cameras, setCameras] = useState<CameraItem[]>(INITIAL_CAMERAS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [dateFilter, setDateFilter] = useState('all');
  const [onvifFilter, setOnvifFilter] = useState('all');
  const [rowsPerPage, setRowsPerPage] = useState('5');
  const [currentPage, setCurrentPage] = useState(1);
  const [cameraSortOrder, setCameraSortOrder] = useState<'asc' | 'desc'>('asc');

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
  const [nvrs, setNvrs] = useState<NVRItem[]>(INITIAL_NVRS);
  const [selectedNvrId, setSelectedNvrId] = useState<string>('nvr-01');
  const selectedNvr = useMemo(() => {
    return nvrs.find(n => n.id === selectedNvrId) || nvrs[0];
  }, [nvrs, selectedNvrId]);

  const [nvrName, setNvrName] = useState(selectedNvr.name);
  const [nvrIp, setNvrIp] = useState(selectedNvr.ip);
  const [nvrBrand, setNvrBrand] = useState(selectedNvr.brand || 'Hikvision');
  const [retentionDays, setRetentionDays] = useState(String(selectedNvr.retentionDays || 30));
  const [storageThreshold, setStorageThreshold] = useState(String(selectedNvr.storageThreshold || 90));
  const [fifoDelete, setFifoDelete] = useState(String(selectedNvr.fifoDelete ?? 10));
  const [nvrFeedback, setNvrFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [nvrErrors, setNvrErrors] = useState<Record<string, string | undefined>>({});
  const [selectedNvrIds, setSelectedNvrIds] = useState<string[]>([]);

  // Add NVR Modal State
  const [isAddNvrModalOpen, setIsAddNvrModalOpen] = useState(false);
  const [newNvrName, setNewNvrName] = useState('');
  const [newNvrIp, setNewNvrIp] = useState('');
  const [newNvrBrand, setNewNvrBrand] = useState('Hikvision');
  const [newNvrError, setNewNvrError] = useState('');

  // Delete Single NVR Modal State
  const [nvrToDelete, setNvrToDelete] = useState<NVRItem | null>(null);

  const areAllNvrsSelected = nvrs.length > 0 && nvrs.every(n => selectedNvrIds.includes(n.id));

  const handleToggleAllNvrs = () => {
    if (areAllNvrsSelected) {
      setSelectedNvrIds([]);
    } else {
      setSelectedNvrIds(nvrs.map(n => n.id));
    }
  };

  const handleToggleNvr = (id: string) => {
    setSelectedNvrIds(prev => 
      prev.includes(id) ? prev.filter(nId => nId !== id) : [...prev, id]
    );
  };

  const handleAddNvr = () => {
    if (!newNvrName.trim()) {
      setNewNvrError('NVR Name is required');
      return;
    }
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!newNvrIp.trim() || !ipPattern.test(newNvrIp.trim())) {
      setNewNvrError('Please enter a valid IP address (e.g. 192.168.1.100)');
      return;
    }
    const newId = `nvr-0${nvrs.length + 1}`;
    const createdNvr: NVRItem = {
      id: newId,
      name: newNvrName.trim(),
      ip: newNvrIp.trim(),
      brand: newNvrBrand,
      channelsUsed: 0,
      totalChannels: 16,
      storageUsedTB: 0,
      totalStorageTB: 16,
      storageUsedGB: 0,
      totalStorageGB: 500,
      retentionDays: 30,
      storageThreshold: 90,
      fifoDelete: 10,
      status: 'online'
    };
    setNvrs(prev => [...prev, createdNvr]);
    setSelectedNvrId(newId);
    setIsAddNvrModalOpen(false);
    setNewNvrName('');
    setNewNvrIp('');
    setNewNvrBrand('Hikvision');
    setNewNvrError('');
    setNvrFeedback({ type: 'success', message: `NVR "${createdNvr.name}" added successfully.` });
    setTimeout(() => setNvrFeedback(null), 4000);
  };

  const handleConfirmDeleteSingleNvr = () => {
    if (!nvrToDelete) return;
    const remaining = nvrs.filter(n => n.id !== nvrToDelete.id);
    setNvrs(remaining);
    if (selectedNvrId === nvrToDelete.id && remaining.length > 0) {
      setSelectedNvrId(remaining[0].id);
    }
    setNvrFeedback({ type: 'success', message: `NVR "${nvrToDelete.name}" deleted successfully.` });
    setNvrToDelete(null);
    setTimeout(() => setNvrFeedback(null), 4000);
  };

  useEffect(() => {
    setNvrName(selectedNvr.name);
    setNvrIp(selectedNvr.ip);
    setNvrBrand(selectedNvr.brand || 'Hikvision');
    setRetentionDays(String(selectedNvr.retentionDays || 30));
    setStorageThreshold(String(selectedNvr.storageThreshold || 90));
    setFifoDelete(String(selectedNvr.fifoDelete ?? 10));
    setNvrErrors({});
  }, [selectedNvrId]);

  const handleSaveNvrSettings = () => {
    const errors: Record<string, string> = {};
    const days = parseInt(retentionDays, 10);
    if (isNaN(days) || days <= 0) {
      errors.retention = 'Retention period must be greater than 0';
    }
    const threshold = parseInt(storageThreshold, 10);
    if (isNaN(threshold) || threshold < 1 || threshold > 100) {
      errors.threshold = 'Threshold must be between 1% and 100%';
    }
    const fifoVal = parseInt(fifoDelete, 10);
    if (isNaN(fifoVal) || fifoVal < 1 || fifoVal > 100) {
      errors.fifo = 'FIFO threshold must be between 1% and 100%';
    }

    if (Object.keys(errors).length > 0) {
      setNvrErrors(errors);
      return;
    }

    setNvrs(prev => prev.map(item => {
      if (item.id === selectedNvrId) {
        return {
          ...item,
          name: nvrName.trim(),
          ip: nvrIp.trim(),
          brand: nvrBrand,
          retentionDays: days,
          storageThreshold: threshold,
          fifoDelete: fifoVal
        };
      }
      return item;
    }));

    setNvrFeedback({
      type: 'success',
      message: 'NVR configuration and storage settings saved successfully.'
    });
    setTimeout(() => {
      setNvrFeedback(null);
    }, 4000);
  };

  const handleConfirmDeleteRecordings = () => {
    setNvrs(prev => prev.map(item => {
      if (item.id === selectedNvrId) {
        return {
          ...item,
          storageUsedGB: 0,
          storageUsedTB: 0
        };
      }
      return item;
    }));
    setIsDeleteModalOpen(false);
    setNvrFeedback({
      type: 'success',
      message: `All recordings for ${selectedNvr.name} have been permanently deleted.`
    });
    setTimeout(() => {
      setNvrFeedback(null);
    }, 4000);
  };
  const [users] = useState<UserItem[]>(INITIAL_USERS);
  const [recycleBin, setRecycleBin] = useState<DeletedItem[]>(INITIAL_RECYCLE_BIN);

  // Favorites count
  const favoriteCount = useMemo(() => {
    return cameras.filter(c => c.isFavorite).length;
  }, [cameras]);

  // Filtered cameras
  const filteredCameras = useMemo(() => {
    const list = cameras.filter(cam => {
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

    return [...list].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return cameraSortOrder === 'asc' ? cmp : -cmp;
    });
  }, [cameras, filterFavoritesOnly, onvifFilter, searchQuery, cameraSortOrder]);

  // Pagination calculation
  const totalItems = filteredCameras.length;
  const pageSize = parseInt(rowsPerPage, 10) || 5;
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
  const [zoneRowsPerPage, setZoneRowsPerPage] = useState('5');
  const [zoneCurrentPage, setZoneCurrentPage] = useState(1);
  const [zoneSortOrder, setZoneSortOrder] = useState<'asc' | 'desc'>('asc');

  const toggleZoneDetection = (id: string) => {
    setZoneRecords(prev => prev.map(item => item.id === id ? { ...item, detectionActive: !item.detectionActive } : item));
  };

  const toggleZoneFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setZoneRecords(prev => prev.map(item => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item));
  };

  const resetZoneFilters = () => {
    setZoneSearch('');
    setZoneFavOnly(false);
    setZoneDateFilter('all');
    setZoneUseCaseFilter('all');
    setZoneSortOrder('asc');
    setZoneCurrentPage(1);
  };

  const filteredZoneRecords = useMemo(() => {
    const list = zoneRecords.filter(item => {
      if (zoneFavOnly && !item.isFavorite) return false;
      if (zoneUseCaseFilter !== 'all' && item.useCase !== zoneUseCaseFilter) return false;
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

    return [...list].sort((a, b) => {
      const cmp = a.cameraName.localeCompare(b.cameraName);
      return zoneSortOrder === 'asc' ? cmp : -cmp;
    });
  }, [zoneRecords, zoneFavOnly, zoneSearch, zoneUseCaseFilter, zoneSortOrder]);

  const zonePageSize = parseInt(zoneRowsPerPage, 10) || 5;
  const totalZonePages = Math.ceil(filteredZoneRecords.length / zonePageSize) || 1;
  const paginatedZoneRecords = useMemo(() => {
    const start = (zoneCurrentPage - 1) * zonePageSize;
    return filteredZoneRecords.slice(start, start + zonePageSize);
  }, [filteredZoneRecords, zoneCurrentPage, zonePageSize]);

  // AI MANAGEMENT STATE (Matching Reference Screenshot 2)
  const [aiSubTab, setAiSubTab] = useState<'models' | 'usecase' | 'rules'>('models');
  const [aiModelSortOrder, setAiModelSortOrder] = useState<'asc' | 'desc'>('asc');

  const toggleAiModelFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAiModels(prev => prev.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m));
  };

  const sortedAiModels = useMemo(() => {
    return [...aiModels].sort((a, b) => {
      return aiModelSortOrder === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });
  }, [aiModels, aiModelSortOrder]);
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
  const [recycleItems, setRecycleItems] = useState<DeletedItem[]>(INITIAL_RECYCLE_BIN);
  const [recycleRowsPerPage, setRecycleRowsPerPage] = useState('5');
  const [recycleCurrentPage, setRecycleCurrentPage] = useState(1);

  const resetRecycleFilters = () => {
    setRecycleSearch('');
    setRecycleTypeFilter('all');
    setRecycleExpiryFilter('all');
    setRecycleDateFilter('all');
    setRecycleCurrentPage(1);
  };

  const filteredRecycleItems = useMemo(() => {
    return recycleItems.filter(item => {
      if (recycleTypeFilter !== 'all' && item.type !== recycleTypeFilter) return false;
      if (recycleSearch.trim()) {
        const q = recycleSearch.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.originalLocation.toLowerCase().includes(q);
      }
      return true;
    });
  }, [recycleItems, recycleTypeFilter, recycleSearch]);

  const recyclePageSize = parseInt(recycleRowsPerPage, 10) || 5;
  const totalRecyclePages = Math.ceil(filteredRecycleItems.length / recyclePageSize) || 1;
  const paginatedRecycleItems = useMemo(() => {
    const start = (recycleCurrentPage - 1) * recyclePageSize;
    return filteredRecycleItems.slice(start, start + recyclePageSize);
  }, [filteredRecycleItems, recycleCurrentPage, recyclePageSize]);

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
  const [usersList, setUsersList] = useState<UserItem[]>(INITIAL_USERS);
  const [userRowsPerPage, setUserRowsPerPage] = useState('5');
  const [userCurrentPage, setUserCurrentPage] = useState(1);
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

  const userPageSize = parseInt(userRowsPerPage, 10) || 5;
  const totalUserPages = Math.ceil(filteredUsers.length / userPageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (userCurrentPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userCurrentPage, userPageSize]);

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

  const currentSubTabConfig = useMemo(() => {
    switch (activeTab) {
      case 'camera':
        return { label: 'Camera Management', icon: <Video size={20} /> };
      case 'zone':
        return { label: 'Zone Management', icon: <MapPin size={20} /> };
      case 'ai':
        return { label: 'AI Management', icon: <BrainCircuit size={20} /> };
      case 'recycle':
        return { label: 'Recycle Bin', icon: <Trash2 size={20} /> };
      case 'nvr':
        return { label: 'NVR Management', icon: <HardDrive size={20} /> };
      case 'user':
        return { label: 'User Management', icon: <Users size={20} /> };
      default:
        return { label: 'Camera Management', icon: <Video size={20} /> };
    }
  }, [activeTab]);

  return (
    <div className="admin-wrapper figma-account-settings-page-wrapper">
      <div className="admin-container figma-account-settings-container">
        
        {/* Top Header conforming to Base Application with subtabs displaying next to it */}
        <PageHeader 
          title="Administration" 
          icon={<Settings size={20} />}
          subItem={{
            label: currentSubTabConfig.label,
            icon: currentSubTabConfig.icon
          }}
        />

        {/* TAB 1: CAMERA MANAGEMENT */}
        {activeTab === 'camera' && (
          <div className="admin-tab-pane">
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
                      <th 
                        className="admin-th admin-th-sortable" 
                        style={{ width: '22%' }}
                        onClick={() => setCameraSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        title={`Sort by Camera Name (${cameraSortOrder === 'asc' ? 'Descending' : 'Ascending'})`}
                      >
                        <div className="admin-th-content">
                          <span>Camera Name</span>
                          <span className="admin-sort-indicator">{cameraSortOrder === 'asc' ? '↑' : '↓'}</span>
                        </div>
                      </th>
                      <th className="admin-th" style={{ width: '28%' }}>360° Streaming URL</th>
                      <th className="admin-th" style={{ width: '28%' }}>PTZ Streaming URL</th>
                      <th className="admin-th" style={{ width: '8%', textAlign: 'center' }}>ONVIF</th>
                      <th className="admin-th" style={{ width: '14%' }}>Created Date</th>
                      <th className="admin-th" style={{ width: '8%', textAlign: 'right' }}>Actions</th>
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
              <RowsPerPageSelector
                value={parseInt(rowsPerPage, 10) || 5}
                onChange={(val) => {
                  setRowsPerPage(String(val));
                  setCurrentPage(1);
                }}
                options={[5, 10, 15, 25]}
              />
            </div>

          </div>
        )}

        {/* TAB 2: ZONE MANAGEMENT */}
        {activeTab === 'zone' && (
          <div className="admin-tab-pane">
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
                      <th className="admin-th">ID</th>
                      <th 
                        className="admin-th admin-th-sortable"
                        onClick={() => setZoneSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        title={`Sort by Camera Name (${zoneSortOrder === 'asc' ? 'Descending' : 'Ascending'})`}
                      >
                        <div className="admin-th-content">
                          <span>Camera Name</span>
                          <span className="admin-sort-indicator">{zoneSortOrder === 'asc' ? '↑' : '↓'}</span>
                        </div>
                      </th>
                      <th className="admin-th">Streaming URL</th>
                      <th className="admin-th">Zone</th>
                      <th className="admin-th">Use Case</th>
                      <th className="admin-th">Detection Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedZoneRecords.map(item => (
                      <tr key={item.id}>
                        <td className="admin-cell-id">
                          {item.id}
                        </td>
                        <td>
                          <div className="admin-cell-camera">
                            <Video size={16} className="admin-camera-icon" />
                            <span>{item.cameraName}</span>
                            {item.isFavorite && (
                              <button
                                type="button"
                                className="admin-star-btn"
                                onClick={(e) => toggleZoneFavorite(item.id, e)}
                                title="Favorite camera"
                              >
                                <Star size={14} fill="var(--warning, #f59e0b)" color="var(--warning, #f59e0b)" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.streamingUrl}>
                          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {item.streamingUrl}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: 500 }}>
                          {item.zone}
                        </td>
                        <td>
                          <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '12.5px' }}>
                            {item.useCase}
                          </span>
                        </td>
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
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>{item.id}</span>
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
              <RowsPerPageSelector
                value={parseInt(zoneRowsPerPage, 10) || 5}
                onChange={(val) => {
                  setZoneRowsPerPage(String(val));
                  setZoneCurrentPage(1);
                }}
                options={[5, 10, 15, 25]}
              />
            </div>

          </div>
        )}

        {/* TAB 3: AI MANAGEMENT */}
        {activeTab === 'ai' && (
          <div className="admin-tab-pane">
            {/* Sub-tabs: AI Models | Configure Use Case | Alert Rules */}
            <div className="admin-subtabs-bar" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={aiSubTab === 'models'}
                className={`admin-subtab-btn ${aiSubTab === 'models' ? 'active' : ''}`}
                onClick={() => setAiSubTab('models')}
              >
                <span className="admin-subtab-icon-badge">
                  <BrainCircuit size={16} />
                </span>
                <span>AI Models</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={aiSubTab === 'usecase'}
                className={`admin-subtab-btn ${aiSubTab === 'usecase' ? 'active' : ''}`}
                onClick={() => setAiSubTab('usecase')}
              >
                <span className="admin-subtab-icon-badge">
                  <Boxes size={16} />
                </span>
                <span>Configure Use Case</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={aiSubTab === 'rules'}
                className={`admin-subtab-btn ${aiSubTab === 'rules' ? 'active' : ''}`}
                onClick={() => setAiSubTab('rules')}
              >
                <span className="admin-subtab-icon-badge">
                  <AlertTriangle size={16} />
                </span>
                <span>Alert Rules</span>
              </button>
            </div>

            {/* SUBTAB: Configure Use Case */}
            {aiSubTab === 'usecase' && (
              <>
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
                      className="admin-add-pill-btn"
                      onClick={() => setIsAddUseCaseOpen(true)}
                      title="New Use Case"
                      aria-label="New Use Case"
                    >
                      <Plus size={20} strokeWidth={2.6} />
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
                          <th className="admin-th">Use Case ID</th>
                          <th className="admin-th">Use Case Name</th>
                          <th className="admin-th">Assigned Camera</th>
                          <th className="admin-th">AI Vision Model</th>
                          <th className="admin-th">Sensitivity</th>
                          <th className="admin-th">Status</th>
                          <th className="admin-th" style={{ textAlign: 'right' }}>Actions</th>
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

            {/* SUBTAB: AI Models (Matching Reference Table Image) */}
            {aiSubTab === 'models' && (
              <div className="admin-table-wrapper" style={{ marginTop: '4px' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="admin-th" style={{ width: '110px' }}>ID</th>
                      <th 
                        className="admin-th admin-th-sortable" 
                        style={{ width: '22%' }}
                        onClick={() => setAiModelSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        title={`Sort by Use Case (${aiModelSortOrder === 'asc' ? 'Descending' : 'Ascending'})`}
                      >
                        <div className="admin-th-content">
                          <span>AI Detection Use Case</span>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{aiModelSortOrder === 'asc' ? '\u2191' : '\u2193'}</span>
                        </div>
                      </th>
                      <th className="admin-th" style={{ width: '18%' }}>Model File</th>
                      <th className="admin-th" style={{ width: '16%' }}>Detection Accuracy</th>
                      <th className="admin-th" style={{ width: '28%' }}>Description</th>
                      <th className="admin-th" style={{ width: '110px' }}>Uploaded On</th>
                      <th className="admin-th" style={{ width: '70px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAiModels.map(model => (
                      <tr key={model.id}>
                        <td style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '13px' }}>
                          {model.id}
                        </td>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '13.5px' }}>
                              {model.name}
                            </span>
                            {model.isFavorite ? (
                              <span
                                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                                onClick={(e) => toggleAiModelFavorite(model.id, e)}
                                title="Remove from favorites"
                              >
                                <Star 
                                  size={14} 
                                  fill="#f59e0b" 
                                  color="#f59e0b" 
                                  style={{ flexShrink: 0 }}
                                />
                              </span>
                            ) : model.hasStar ? (
                              <span
                                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                                onClick={(e) => toggleAiModelFavorite(model.id, e)}
                                title="Add to favorites"
                              >
                                <Star 
                                  size={14} 
                                  color="var(--text-muted, #94a3b8)" 
                                  style={{ flexShrink: 0 }}
                                />
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                            {model.modelFile}
                          </span>
                        </td>
                        <td>
                          <span className="admin-accuracy-badge">
                            {model.accuracy}%
                          </span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.4 }}>
                            {model.description}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                            {model.uploadedOn}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="admin-action-btn admin-btn-dots"
                            title="Actions"
                            aria-label={`Actions for ${model.name}`}
                          >
                            <MoreVertical size={16} />
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
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={36} color="var(--primary)" style={{ opacity: 0.7, marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px' }}>Automated Detection Rules</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  All AI notification pipelines and alert webhook triggers are actively syncing.
                </p>
              </div>
            )}

            {/* Consistent Pagination Footer across all tabs */}
            <div className="admin-pagination">
              <RowsPerPageSelector
                value={5}
                onChange={() => {}}
                options={[5, 10, 15, 25]}
              />
            </div>

          </div>
        )}

        {/* TAB 4: RECYCLE BIN */}
        {activeTab === 'recycle' && (
          <div className="admin-tab-pane">
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
                    <th className="admin-th">Item Name</th>
                    <th className="admin-th">Type</th>
                    <th className="admin-th">
                      <div className="admin-th-content">
                        <span>Deleted Date</span>
                        <span className="admin-sort-indicator">↓</span>
                      </div>
                    </th>
                    <th className="admin-th">Days Remaining</th>
                    <th className="admin-th">Original Location</th>
                    {recycleItems.length > 0 && <th className="admin-th" style={{ textAlign: 'right' }}>Actions</th>}
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
                    paginatedRecycleItems.map(item => (
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
              <RowsPerPageSelector
                value={parseInt(recycleRowsPerPage, 10) || 5}
                onChange={(val) => {
                  setRecycleRowsPerPage(String(val));
                  setRecycleCurrentPage(1);
                }}
                options={[5, 10, 15, 25]}
              />
            </div>

          </div>
        )}

        {/* TAB 5: NVR MANAGEMENT (Two-Column Configuration Layout) */}
        {activeTab === 'nvr' && (
          <div className="admin-tab-pane" style={{ overflowY: 'auto' }}>
            {nvrFeedback && (
              <div className={`nvr-feedback-banner ${nvrFeedback.type}`}>
                {nvrFeedback.message}
              </div>
            )}

            <div className="nvr-layout-grid">
              
              {/* LEFT CARD: NVR CONFIGURATION */}
              <div className="nvr-card">
                <div className="nvr-card-header">
                  <h3 className="nvr-card-title">NVR Configuration</h3>
                  <button
                    type="button"
                    className="nvr-btn-add-icon"
                    onClick={() => {
                      setNewNvrName('');
                      setNewNvrIp('');
                      setNewNvrBrand('Hikvision');
                      setNewNvrError('');
                      setIsAddNvrModalOpen(true);
                    }}
                    title="Add NVR"
                    aria-label="Add NVR"
                  >
                    <Plus size={18} strokeWidth={2.4} />
                  </button>
                </div>

                <div className="nvr-form-body">
                  <div className="nvr-table-section">
                    <div className="admin-table-wrapper" style={{ maxHeight: '490px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th className="admin-th admin-th-checkbox">
                              <input
                                type="checkbox"
                                className="admin-table-checkbox"
                                checked={areAllNvrsSelected}
                                onChange={handleToggleAllNvrs}
                                title="Select all NVRs"
                                aria-label="Select all NVRs"
                              />
                            </th>
                            <th className="admin-th">NVR Name</th>
                            <th className="admin-th">NVR IP</th>
                            <th className="admin-th">NVR Brand</th>
                            <th className="admin-th" style={{ width: '60px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {nvrs.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                No NVR systems configured. Click the + button above to add one.
                              </td>
                            </tr>
                          ) : (
                            nvrs.map(n => {
                              const isSelected = selectedNvrIds.includes(n.id);
                              const isCurrent = n.id === selectedNvrId;
                              return (
                                <tr 
                                  key={n.id} 
                                  className={isSelected || isCurrent ? 'selected' : ''}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => setSelectedNvrId(n.id)}
                                >
                                  <td className="admin-td admin-td-checkbox" onClick={e => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      className="admin-table-checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleNvr(n.id)}
                                      aria-label={`Select ${n.name}`}
                                    />
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                                      <HardDrive size={15} style={{ color: isCurrent ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0 }} />
                                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{n.name}</span>
                                      {isCurrent && (
                                        <Badge variant="primary">Active</Badge>
                                      )}
                                    </div>
                                  </td>
                                  <td>
                                    <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                      {n.ip}
                                    </span>
                                  </td>
                                  <td>
                                    <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                                      {n.brand || 'Hikvision'}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      className="admin-action-btn delete"
                                      onClick={() => setNvrToDelete(n)}
                                      title="Delete NVR"
                                      aria-label={`Delete ${n.name}`}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT CARD: STORAGE CONFIGURATION */}
              <div className="nvr-card">
                <div className="nvr-card-header">
                  <h3 className="nvr-card-title">Storage Configuration</h3>
                  <Badge variant={selectedNvr.status === 'online' ? 'success' : 'danger'}>
                    {selectedNvr.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Circular Storage Usage Indicator (Matching Reference Image) */}
                <div className="nvr-storage-gauge-wrap">
                  <div className="nvr-storage-gauge-svg-container">
                    <svg viewBox="0 0 180 180" className="nvr-storage-gauge-svg">
                      {/* Base Track Ring */}
                      <circle
                        cx="90"
                        cy="90"
                        r="68"
                        fill="none"
                        stroke="color-mix(in srgb, var(--text-main) 8%, transparent)"
                        strokeWidth="13"
                      />
                      {/* Segment 1: Red/Pink (Left) */}
                      <circle
                        cx="90"
                        cy="90"
                        r="68"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="13"
                        strokeDasharray="62 365"
                        strokeDashoffset="120"
                        strokeLinecap="round"
                      />
                      {/* Segment 2: Orange (Top-Left) */}
                      <circle
                        cx="90"
                        cy="90"
                        r="68"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="13"
                        strokeDasharray="62 365"
                        strokeDashoffset="50"
                        strokeLinecap="round"
                      />
                      {/* Segment 3: Yellow/Gold (Top-Right & Right) */}
                      <circle
                        cx="90"
                        cy="90"
                        r="68"
                        fill="none"
                        stroke="#eab308"
                        strokeWidth="13"
                        strokeDasharray="145 282"
                        strokeDashoffset="-20"
                        strokeLinecap="round"
                      />
                      {/* Segment 4: Vibrant Blue (Bottom) */}
                      <circle
                        cx="90"
                        cy="90"
                        r="68"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="13"
                        strokeDasharray="70 357"
                        strokeDashoffset="-180"
                        strokeLinecap="round"
                      />
                    </svg>

                    <div className="nvr-gauge-center-content">
                      <div className="nvr-gauge-num">
                        <span>{selectedNvr.storageUsedGB ?? 150}</span>
                        <span className="nvr-gauge-unit">GB</span>
                      </div>
                      <span className="nvr-gauge-subtext">
                        of {selectedNvr.totalStorageGB ?? 500} GB ({Math.min(100, Math.round(((selectedNvr.storageUsedGB ?? 150) / (selectedNvr.totalStorageGB ?? 500)) * 100))}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Storage Settings: 3 Fields in Exact Order */}
                <div className="nvr-storage-settings-group">
                  {/* 1. Files Retention Period */}
                  <TextField
                    label="Files Retention Period"
                    value={retentionDays}
                    onChange={(e) => {
                      setRetentionDays(e.target.value);
                      if (nvrErrors.retention) setNvrErrors(prev => ({ ...prev, retention: undefined }));
                    }}
                    error={nvrErrors.retention}
                    placeholder="e.g. 30"
                  />

                  {/* 2. Storage Full Threshold */}
                  <TextField
                    label="Storage Full Threshold (%)"
                    value={storageThreshold}
                    onChange={(e) => {
                      setStorageThreshold(e.target.value);
                      if (nvrErrors.threshold) setNvrErrors(prev => ({ ...prev, threshold: undefined }));
                    }}
                    error={nvrErrors.threshold}
                    placeholder="e.g. 90"
                  />

                  {/* 3. FIFO delete at threshold (%) */}
                  <TextField
                    label="FIFO delete at threshold (%)"
                    value={fifoDelete}
                    onChange={(e) => {
                      setFifoDelete(e.target.value);
                      if (nvrErrors.fifo) setNvrErrors(prev => ({ ...prev, fifo: undefined }));
                    }}
                    error={nvrErrors.fifo}
                    placeholder="e.g. 10"
                  />
                </div>

                {/* Action Buttons: Save Settings & Delete All Recordings */}
                <div className="nvr-storage-actions">
                  <Button
                    variant="primary"
                    onClick={handleSaveNvrSettings}
                    className="nvr-btn-save"
                  >
                    Save Settings
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="nvr-btn-delete"
                  >
                    Delete All Recordings
                  </Button>
                </div>

              </div>

            </div>

            {/* Explicit Confirmation Modal for Delete All Recordings */}
            <Modal
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              title="Delete All Recordings"
              icon={<AlertTriangle size={20} color="var(--danger, #ef4444)" />}
              maxWidth="460px"
              footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={handleConfirmDeleteRecordings}>
                    Confirm Delete
                  </Button>
                </div>
              }
            >
              <div style={{ padding: '6px 0', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                <p style={{ margin: '0 0 10px' }}>
                  Are you sure you want to delete all surveillance recordings from <strong>{selectedNvr.name}</strong>?
                </p>
                <p style={{ margin: 0, color: 'var(--danger, #ef4444)', fontSize: '13px', fontWeight: 500 }}>
                  ⚠️ This action is permanent and cannot be undone. All video history on this NVR will be erased.
                </p>
              </div>
            </Modal>

            {/* Add NVR Modal */}
            <Modal
              isOpen={isAddNvrModalOpen}
              onClose={() => setIsAddNvrModalOpen(false)}
              title="Add NVR System"
              icon={<Plus size={20} color="var(--primary)" />}
              maxWidth="460px"
              footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <Button variant="secondary" onClick={() => setIsAddNvrModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleAddNvr}>
                    Add NVR
                  </Button>
                </div>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '6px 0' }}>
                {newNvrError && (
                  <div style={{ color: 'var(--danger, #ef4444)', fontSize: '13px', fontWeight: 500 }}>
                    {newNvrError}
                  </div>
                )}
                <TextField
                  label="NVR Name"
                  value={newNvrName}
                  onChange={(e) => {
                    setNewNvrName(e.target.value);
                    if (newNvrError) setNewNvrError('');
                  }}
                  placeholder="e.g. NVR-Warehouse-03"
                />
                <TextField
                  label="NVR IP Address"
                  value={newNvrIp}
                  onChange={(e) => {
                    setNewNvrIp(e.target.value);
                    if (newNvrError) setNewNvrError('');
                  }}
                  placeholder="e.g. 192.168.1.103"
                />
                <div className="nvr-field-group">
                  <CustomSmoothDropdown
                    label="NVR Brand"
                    value={newNvrBrand}
                    onChange={setNewNvrBrand}
                    options={NVR_BRAND_OPTIONS}
                  />
                </div>
              </div>
            </Modal>

            {/* Confirmation Modal for Delete Single NVR Row */}
            <Modal
              isOpen={!!nvrToDelete}
              onClose={() => setNvrToDelete(null)}
              title="Delete NVR"
              icon={<AlertTriangle size={20} color="var(--danger, #ef4444)" />}
              maxWidth="440px"
              footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <Button variant="secondary" onClick={() => setNvrToDelete(null)}>
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={handleConfirmDeleteSingleNvr}>
                    Delete
                  </Button>
                </div>
              }
            >
              <div style={{ padding: '6px 0', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                <p style={{ margin: '0 0 8px' }}>
                  Are you sure you want to delete NVR <strong>{nvrToDelete?.name}</strong> ({nvrToDelete?.ip})?
                </p>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12.5px' }}>
                  This will remove the NVR configuration from the system.
                </p>
              </div>
            </Modal>

          </div>
        )}

        {/* TAB 6: USER MANAGEMENT */}
        {activeTab === 'user' && (
          <div className="admin-tab-pane">
            {/* Sub-tabs: Users | Roles & Permissions */}
            <div className="admin-subtabs-bar" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={userSubTab === 'users'}
                className={`admin-subtab-btn ${userSubTab === 'users' ? 'active' : ''}`}
                onClick={() => setUserSubTab('users')}
              >
                <span className="admin-subtab-icon-badge">
                  <Users size={16} />
                </span>
                <span>Users</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={userSubTab === 'roles'}
                className={`admin-subtab-btn ${userSubTab === 'roles' ? 'active' : ''}`}
                onClick={() => setUserSubTab('roles')}
              >
                <span className="admin-subtab-icon-badge">
                  <Shield size={16} />
                </span>
                <span>Roles & Permissions</span>
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
                      className="admin-add-pill-btn"
                      onClick={() => setIsAddUserOpen(true)}
                      title="Add User"
                      aria-label="Add User"
                    >
                      <Plus size={20} strokeWidth={2.6} />
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
                          <th className="admin-th">User</th>
                          <th className="admin-th">Email</th>
                          <th className="admin-th">System Role</th>
                          <th className="admin-th">Account Status</th>
                          <th className="admin-th">Last Active</th>
                          <th className="admin-th" style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedUsers.map(u => (
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
                  <RowsPerPageSelector
                    value={parseInt(userRowsPerPage, 10) || 5}
                    onChange={(val) => {
                      setUserRowsPerPage(String(val));
                      setUserCurrentPage(1);
                    }}
                    options={[5, 10, 15, 25]}
                  />
                </div>
              </>
            )}

            {/* SUBTAB: Roles & Permissions */}
            {userSubTab === 'roles' && (
              <>
                <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
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

                <div className="admin-pagination">
                  <RowsPerPageSelector
                    value={5}
                    onChange={() => {}}
                    options={[5, 10, 15, 25]}
                  />
                </div>
              </>
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
