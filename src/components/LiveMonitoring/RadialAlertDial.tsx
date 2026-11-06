import React, { useMemo } from 'react';
import { 
  User, 
  Flame, 
  ShieldCheck, 
  ScanFace, 
  ScanLine, 
  Car, 
  RotateCw,
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  Info
} from 'lucide-react';
import './RadialAlertDial.css';

export type AlertPriorityId = 'critical' | 'high' | 'medium' | 'low';

export interface PriorityMeta {
  id: AlertPriorityId;
  label: string;
  next: AlertPriorityId;
  color: string;
  glow: string;
  bgLight: string;
  badgeBg: string;
}

export const PRIORITY_CONFIG: Record<AlertPriorityId, PriorityMeta> = {
  critical: {
    id: 'critical',
    label: 'Critical',
    next: 'high',
    color: '#dc2626', // Crimson Red
    glow: 'rgba(220, 38, 38, 0.4)',
    bgLight: 'rgba(220, 38, 38, 0.12)',
    badgeBg: '#b91c1c'
  },
  high: {
    id: 'high',
    label: 'High Priority',
    next: 'medium',
    color: '#ea580c', // Red-Orange
    glow: 'rgba(234, 88, 12, 0.4)',
    bgLight: 'rgba(234, 88, 12, 0.12)',
    badgeBg: '#c2410c'
  },
  medium: {
    id: 'medium',
    label: 'Medium Priority',
    next: 'low',
    color: '#d97706', // Amber
    glow: 'rgba(217, 119, 6, 0.4)',
    bgLight: 'rgba(217, 119, 6, 0.12)',
    badgeBg: '#b45309'
  },
  low: {
    id: 'low',
    label: 'Low Priority',
    next: 'critical',
    color: '#16a34a', // Emerald Green
    glow: 'rgba(22, 163, 74, 0.4)',
    bgLight: 'rgba(22, 163, 74, 0.12)',
    badgeBg: '#15803d'
  }
};

// Default detection element selected for each priority level
export const DEFAULT_PRIORITY_USE_CASE: Record<AlertPriorityId, string> = {
  critical: 'fire-smoke', // Default Critical: Fire & Smoke
  high: 'person',        // Default High Priority: Person Detection (7 alerts)
  medium: 'anpr',        // Default Medium Priority: ANPR (5 alerts)
  low: 'vehicle'         // Default Low Priority: Vehicle Detection
};

export interface DialUseCase {
  id: string;
  name: string;
  shortName: string;
  angle: number; // 0 = 12 o'clock, 60 = 2 o'clock, etc.
  counts: Record<AlertPriorityId, number>;
  cameraIds: string[];
}

export const DIAL_USE_CASES: DialUseCase[] = [
  {
    id: 'person',
    name: 'Person Detection',
    shortName: 'Person',
    angle: 0, // 12 o'clock
    counts: { critical: 10, high: 7, medium: 5, low: 3 },
    cameraIds: ['cam-1', 'cam-4', 'cam-6', 'cam-8']
  },
  {
    id: 'fire-smoke',
    name: 'Fire & Smoke',
    shortName: 'Fire',
    angle: 60, // 2 o'clock
    counts: { critical: 8, high: 4, medium: 2, low: 1 },
    cameraIds: ['cam-3', 'cam-6', 'cam-8']
  },
  {
    id: 'ppe',
    name: 'PPE Compliance',
    shortName: 'PPE',
    angle: 120, // 4 o'clock
    counts: { critical: 6, high: 5, medium: 4, low: 2 },
    cameraIds: ['cam-3', 'cam-5', 'cam-8']
  },
  {
    id: 'face',
    name: 'Face Recognition',
    shortName: 'Face',
    angle: 180, // 6 o'clock
    counts: { critical: 5, high: 6, medium: 3, low: 2 },
    cameraIds: ['cam-1', 'cam-4', 'cam-6']
  },
  {
    id: 'anpr',
    name: 'ANPR',
    shortName: 'ANPR',
    angle: 240, // 8 o'clock
    counts: { critical: 4, high: 3, medium: 5, low: 2 },
    cameraIds: ['cam-4', 'cam-7']
  },
  {
    id: 'vehicle',
    name: 'Vehicle Detection',
    shortName: 'Vehicle',
    angle: 300, // 10 o'clock
    counts: { critical: 5, high: 4, medium: 3, low: 2 },
    cameraIds: ['cam-2', 'cam-4', 'cam-7']
  }
];

export interface RadialAlertDialProps {
  selectedPriority: AlertPriorityId;
  onPriorityChange: (priority: AlertPriorityId) => void;
  selectedUseCaseId: string | null;
  onSelectUseCase: (useCaseId: string | null) => void;
  variant?: 1 | 2 | 3;
}

export const RadialAlertDial: React.FC<RadialAlertDialProps> = ({
  selectedPriority,
  onPriorityChange,
  selectedUseCaseId,
  onSelectUseCase,
  variant = 1
}) => {
  const priorityMeta = PRIORITY_CONFIG[selectedPriority] || PRIORITY_CONFIG.critical;

  // Total alert count for the current priority
  const currentPriorityTotal = useMemo(() => {
    return DIAL_USE_CASES.reduce((sum, item) => sum + item.counts[selectedPriority], 0);
  }, [selectedPriority]);

  // Click center button to cycle priority (automatically selects default element for new priority)
  const handleCyclePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPriority = priorityMeta.next;
    onPriorityChange(nextPriority);
    const defaultUseCase = DEFAULT_PRIORITY_USE_CASE[nextPriority] || 'fire-smoke';
    onSelectUseCase(defaultUseCase);
  };

  // Center coordinates & Radii
  const CX = 190;
  const CY = 190;
  const R_CENTER = 76;
  const R_MIDDLE = 118;
  const R_OUTER_INNER = 152;

  // Helper to convert polar to cartesian (0 deg = 12 o'clock)
  const polarToCartesian = (angleDeg: number, radius: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180.0;
    return {
      x: CX + radius * Math.cos(rad),
      y: CY + radius * Math.sin(rad)
    };
  };

  // Build sector wedge path covering the active icon sector cleanly
  const createWedgePath = (angle: number) => {
    const halfSpan = 28;
    const startAngle = angle - halfSpan;
    const endAngle = angle + halfSpan;
    
    const p1 = polarToCartesian(startAngle, R_CENTER);
    const p2 = polarToCartesian(startAngle, R_OUTER_INNER);
    const p3 = polarToCartesian(endAngle, R_OUTER_INNER);
    const p4 = polarToCartesian(endAngle, R_CENTER);

    return `
      M ${p1.x} ${p1.y}
      L ${p2.x} ${p2.y}
      A ${R_OUTER_INNER} ${R_OUTER_INNER} 0 0 1 ${p3.x} ${p3.y}
      L ${p4.x} ${p4.y}
      A ${R_CENTER} ${R_CENTER} 0 0 0 ${p1.x} ${p1.y}
      Z
    `;
  };

  // Render detection icon by id
  const renderIcon = (id: string, size = 19) => {
    switch (id) {
      case 'person':
        return <User size={size} />;
      case 'fire-smoke':
        return <Flame size={size} />;
      case 'ppe':
        return <ShieldCheck size={size} />;
      case 'face':
        return <ScanFace size={size} />;
      case 'anpr':
        return <ScanLine size={size} />;
      case 'vehicle':
        return <Car size={size} />;
      default:
        return <User size={size} />;
    }
  };

  // Render priority icon by priority level (recognized by icon & color)
  const renderPriorityIcon = (priority: AlertPriorityId, size = 38) => {
    switch (priority) {
      case 'critical':
        return <AlertOctagon size={size} strokeWidth={2.4} />;
      case 'high':
        return <AlertTriangle size={size} strokeWidth={2.4} />;
      case 'medium':
        return <AlertCircle size={size} strokeWidth={2.4} />;
      case 'low':
        return <Info size={size} strokeWidth={2.4} />;
      default:
        return <AlertOctagon size={size} strokeWidth={2.4} />;
    }
  };

  // ==========================================
  // OPTION 3: HORIZONTAL MINI-DIAL CAPSULE
  // ==========================================
  if (variant === 3) {
    return (
      <div className="dial-option3-capsule" aria-label="Horizontal Priority Alert Bar">
        {/* Tactile Priority Cycle Button */}
        <button
          type="button"
          className="dial-option3-priority-btn"
          onClick={handleCyclePriority}
          style={{ backgroundColor: priorityMeta.color }}
          title={`Priority: ${priorityMeta.label} (${currentPriorityTotal} alerts). Click to cycle.`}
        >
          <span className="dial-option3-priority-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
            {renderPriorityIcon(selectedPriority, 16)}
          </span>
          <span className="dial-option3-priority-count">{currentPriorityTotal}</span>
          <RotateCw size={11} className="dial-option3-cycle-icon" />
        </button>

        <div className="dial-option3-divider" />

        {/* 6 Detection Use Case Chips */}
        <div className="dial-option3-chips-list">
          {DIAL_USE_CASES.map((uc) => {
            const isSelected = selectedUseCaseId === uc.id;
            const count = uc.counts[selectedPriority];
            return (
              <button
                key={uc.id}
                type="button"
                className={`dial-option3-chip ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectUseCase(isSelected ? null : uc.id)}
                style={{
                  borderColor: isSelected ? priorityMeta.color : undefined,
                  backgroundColor: isSelected ? priorityMeta.color : undefined,
                  color: isSelected ? '#ffffff' : undefined
                }}
                title={`${uc.name}: ${count} alerts`}
              >
                <span className="dial-option3-chip-icon">{renderIcon(uc.id, 14)}</span>
                <span className="dial-option3-chip-name">{uc.shortName}</span>
                <span 
                  className="dial-option3-chip-count"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : priorityMeta.bgLight,
                    color: isSelected ? '#ffffff' : priorityMeta.color
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // OPTION 1 & OPTION 2: CIRCULAR RADIAL DIAL
  // ==========================================
  const dialClass = variant === 2 
    ? 'radial-dial-inline-widget option2-hud' 
    : 'radial-dial-inline-widget option1-compact';

  return (
    <div className={dialClass} aria-label="Radial Priority Alert Dial">
      <div className="radial-dial-svg-container">
        <svg
          viewBox="30 30 320 320"
          className="radial-dial-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Center button drop shadow */}
            <filter id="radialCenterShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={priorityMeta.glow} />
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.25)" />
            </filter>

            {/* Active wedge glow */}
            <filter id="activeWedgeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={priorityMeta.glow} />
            </filter>

            {/* Circular Clip for Center Button */}
            <clipPath id="centerButtonClip">
              <circle cx={CX} cy={CY} r={R_CENTER} />
            </clipPath>
          </defs>

          {/* TRACK: Middle icon ring background */}
          <circle
            cx={CX}
            cy={CY}
            r={(R_CENTER + R_OUTER_INNER) / 2}
            fill="none"
            stroke="color-mix(in srgb, var(--text-main) 4%, transparent)"
            strokeWidth={R_OUTER_INNER - R_CENTER}
            className="radial-middle-track-bg"
          />

          {/* OUTER BOUNDARY: Clean circular boundary border */}
          <circle
            cx={CX}
            cy={CY}
            r={R_OUTER_INNER}
            fill="none"
            stroke="color-mix(in srgb, var(--text-main) 12%, transparent)"
            strokeWidth="1.5"
            className="radial-outer-boundary"
          />

          {/* ACTIVE WEDGE / SECTOR HIGHLIGHT */}
          {selectedUseCaseId && (() => {
            const activeItem = DIAL_USE_CASES.find(u => u.id === selectedUseCaseId);
            if (!activeItem) return null;
            return (
              <path
                d={createWedgePath(activeItem.angle)}
                fill={priorityMeta.color}
                filter="url(#activeWedgeGlow)"
                className="radial-active-wedge"
              />
            );
          })()}

          {/* 6 DETECTION ICONS */}
          {DIAL_USE_CASES.map((useCase) => {
            const isSelected = selectedUseCaseId === useCase.id;
            const iconPos = polarToCartesian(useCase.angle, R_MIDDLE);
            const count = useCase.counts[selectedPriority];

            return (
              <g
                key={`icon-${useCase.id}`}
                className={`radial-icon-group ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectUseCase(isSelected ? null : useCase.id)}
                role="button"
                tabIndex={0}
              >
                <title>{`${useCase.name}: ${count} alerts (${priorityMeta.label})`}</title>

                {/* Circular hover target / node */}
                <circle
                  cx={iconPos.x}
                  cy={iconPos.y}
                  r="21"
                  fill={isSelected ? 'transparent' : 'color-mix(in srgb, var(--text-main) 5%, transparent)'}
                  stroke={isSelected ? 'transparent' : 'color-mix(in srgb, var(--text-main) 12%, transparent)'}
                  strokeWidth="1"
                  className="radial-icon-node-bg"
                />

                {/* Icon */}
                <foreignObject
                  x={iconPos.x - 12}
                  y={iconPos.y - 12}
                  width="24"
                  height="24"
                  className="radial-foreign-icon"
                >
                  <div 
                    className="radial-icon-wrapper"
                    style={{
                      color: isSelected ? '#ffffff' : 'var(--text-main, #334155)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px'
                    }}
                  >
                    {renderIcon(useCase.id, 19)}
                  </div>
                </foreignObject>

                {/* Label on selected wedge */}
                {isSelected && (
                  <text
                    x={iconPos.x}
                    y={iconPos.y + (useCase.angle > 90 && useCase.angle < 270 ? -16 : 22)}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="800"
                    letterSpacing="0.04em"
                    style={{ textTransform: 'uppercase' }}
                  >
                    {useCase.shortName}
                  </text>
                )}
              </g>
            );
          })}

          {/* CENTER PRIORITY BUTTON (Tactile Button that cycles on click) */}
          <g
            className="radial-center-button-group"
            onClick={handleCyclePriority}
            role="button"
            tabIndex={0}
          >
            <title>{`Current Priority: ${priorityMeta.label}. Click to switch to ${PRIORITY_CONFIG[priorityMeta.next].label}`}</title>
            
            {/* Outer Glow Ring */}
            <circle
              cx={CX}
              cy={CY}
              r={R_CENTER + 3}
              fill="none"
              stroke={priorityMeta.color}
              strokeWidth="2"
              opacity="0.45"
              className="radial-center-glow-ring"
            />

            {/* Core Solid Button Circle */}
            <circle
              cx={CX}
              cy={CY}
              r={R_CENTER}
              fill={priorityMeta.color}
              filter="url(#radialCenterShadow)"
              className="radial-center-disc"
            />

            {/* Center Priority Icon (No text label, recognized by icon & color) */}
            <foreignObject
              x={CX - 22}
              y={CY - 35}
              width="44"
              height="44"
              className="radial-center-icon-foreign"
            >
              <div 
                style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))'
                }}
              >
                {renderPriorityIcon(selectedPriority, 38)}
              </div>
            </foreignObject>

            {/* Subtext: Alert count */}
            <text
              x={CX}
              y={CY + 21}
              textAnchor="middle"
              fill="rgba(255, 255, 255, 0.95)"
              fontSize="12.5"
              fontWeight="800"
              letterSpacing="0.04em"
              style={{ textTransform: 'uppercase' }}
              fontFamily="system-ui, -apple-system, sans-serif"
              className="radial-center-sub"
            >
              {currentPriorityTotal} ALERTS
            </text>

            {/* Cycle Icon Hint */}
            <foreignObject
              x={CX - 8}
              y={CY + 29}
              width="16"
              height="16"
              className="radial-center-cycle-foreign"
            >
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RotateCw size={11} />
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>
    </div>
  );
};
