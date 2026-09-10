import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  LayoutPanelTop, Layout, LayoutPanelLeft, Users,
  Type, Image, Ban, Save, Eye, CheckCircle2, Info, X, RotateCcw
} from 'lucide-react';
import './GlobalSettingsWorkspace.css';

import { ImageCropperModal } from './ImageCropperModal';

interface GlobalSettingsWorkspaceProps {
  onClose: () => void;
  headerConfig: {
    logo: string;
    showLogo: boolean;
    companyName: string;
    showCompanyName: boolean;
    companyCaption: string;
    showCompanyCaption: boolean;
    textColor: string;
    textColorApply: 'both' | 'name' | 'caption';
    companyNameColor?: string;
    companyCaptionColor?: string;
    companyNameStyle?: string;
    companyCaptionStyle?: string;
    companyNameWeight?: string;
    companyCaptionWeight?: string;
    headerBgColor?: string;
  };
  onSaveConfig: (config: any) => void;
  sidebarAutoHide: boolean;
  setSidebarAutoHide: (val: boolean) => void;
  sidebarExpandedWidth: number;
  setSidebarExpandedWidth: (val: number) => void;
  sidebarCollapsedWidth: number;
  setSidebarCollapsedWidth: (val: number) => void;
  sidebarShowIcons: boolean;
  setSidebarShowIcons: (val: boolean) => void;
  sidebarShowLabels: boolean;
  setSidebarShowLabels: (val: boolean) => void;
  sidebarColor?: string;
  setSidebarColor?: (val: string) => void;
  onSyncFooter: (footerData: any) => void;
  setSidebarCollapsed: (val: boolean) => void;
  onTabChange?: (tab: string) => void;
  onSyncCustomerProfile?: (data: {
    showCustomerProfile: boolean;
    customerName: string;
    customerColorFollow: boolean;
    showCustomerLogo: boolean;
    customerLogo: string;
    customerNameStyle?: string;
    customerNameColor?: string;
    customerNameWeight?: string;
    customerCaptionWeight?: string;
    showCustomerCaption?: boolean;
    customerCaption?: string;
    customerCaptionStyle?: string;
    customerCaptionColor?: string;
  }) => void;
  onShowToast?: (message: string) => void;
}

type TabId = 'header' | 'footer' | 'sidebar' | 'profile';

// Info Tooltip Component with Sleek Popover
const InfoTooltip = ({ 
  text, 
  position = 'below-left' 
}: { 
  text: string; 
  position?: 'above' | 'below' | 'below-left' | 'below-right' | 'right' 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  let positionStyle: React.CSSProperties = {
    top: 'calc(100% + 8px)',
    left: '0',
    right: 'auto',
    transform: 'none',
  };

  if (position === 'below-right') {
    positionStyle = {
      top: 'calc(100% + 8px)',
      right: '0',
      left: 'auto',
      transform: 'none',
    };
  } else if (position === 'above') {
    positionStyle = {
      bottom: 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
    };
  } else if (position === 'right') {
    positionStyle = {
      left: 'calc(100% + 8px)',
      top: '50%',
      transform: 'translateY(-50%)',
    };
  }

  return (
    <span 
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '6px', cursor: 'pointer' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Info 
        size={13} 
        style={{ 
          color: isHovered ? 'var(--primary-light)' : 'var(--text-muted)', 
          transition: 'color 0.15s ease',
          flexShrink: 0 
        }} 
      />
      {isHovered && (
        <span 
          style={{
            position: 'absolute',
            ...positionStyle,
            background: 'var(--bg-dashboard)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '8px',
            padding: '7px 12px',
            color: 'var(--text-main)',
            fontSize: '11.5px',
            fontWeight: 400,
            whiteSpace: 'normal',
            width: 'max-content',
            maxWidth: '220px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.65), 0 0 12px rgba(59, 130, 246, 0.3)',
            zIndex: 100000,
            pointerEvents: 'none',
            lineHeight: '1.45',
            textAlign: 'left',
            animation: 'gsTooltipPop 0.15s ease-out'
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
};

// Apple-style toggle switch (Matching User Screenshot 1:1)
// Shared style for the small rounded "pill" <select> controls (H1 / weight).
const GS_PILL_SELECT: React.CSSProperties = {
  width: '64px', height: '30px', borderRadius: '15px', border: '1px solid var(--gs-input-border)',
  fontSize: '12px', fontWeight: 600, padding: '0 6px', backgroundColor: 'var(--gs-input-bg)',
  color: 'var(--gs-text-color)', cursor: 'pointer', outline: 'none',
};
const GS_WEIGHT_OPTIONS = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];

const AppleToggle = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`gs-apple-toggle ${checked ? 'checked' : ''}`}
    >
      <div className="gs-apple-toggle-thumb" />
    </button>
  );
};

export function GlobalSettingsWorkspace({ 
  onClose, 
  headerConfig, 
  onSaveConfig,
  sidebarAutoHide,
  setSidebarAutoHide,
  sidebarExpandedWidth,
  setSidebarExpandedWidth,
  sidebarCollapsedWidth,
  setSidebarCollapsedWidth,
  sidebarShowIcons,
  setSidebarShowIcons,
  sidebarShowLabels,
  setSidebarShowLabels,
  sidebarColor = '',
  setSidebarColor,
  onSyncFooter,
  setSidebarCollapsed,
  onTabChange,
  onSyncCustomerProfile,
  onShowToast
}: GlobalSettingsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabId>('header');

  // Local form states (Header Config)

  // Cropper State
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [pendingCropImage, setPendingCropImage] = useState('');
  const [cropperTarget, setCropperTarget] = useState<'header' | 'footer' | 'customer' | null>(null);

  const [logo, setLogo] = useState(headerConfig.logo);
  const [showLogo, setShowLogo] = useState(headerConfig.showLogo);
  const [companyName, setCompanyName] = useState(headerConfig.companyName);
  const [showCompanyName, setShowCompanyName] = useState(headerConfig.showCompanyName);
  const [companyCaption, setCompanyCaption] = useState(headerConfig.companyCaption);
  const [showCompanyCaption, setShowCompanyCaption] = useState(headerConfig.showCompanyCaption !== undefined ? headerConfig.showCompanyCaption : true);
  const [textColor] = useState(headerConfig.textColor || '#ffffff');
  const [textColorApply] = useState<any>(headerConfig.textColorApply || 'both');
  const [headerBgColor] = useState(headerConfig.headerBgColor || 'linear-gradient(135deg, #000000, #011446)');
  const [companyNameColor, setCompanyNameColor] = useState(headerConfig.companyNameColor || '#ffffff');
  const [companyCaptionColor, setCompanyCaptionColor] = useState(headerConfig.companyNameColor || headerConfig.textColor || '#000000');
  const [companyNameStyle, setCompanyNameStyle] = useState(headerConfig.companyNameStyle || 'h1');
  const [companyCaptionStyle, setCompanyCaptionStyle] = useState(headerConfig.companyCaptionStyle || 'h3');
  const [companyNameWeight, setCompanyNameWeight] = useState(headerConfig.companyNameWeight || localStorage.getItem('gs_companyNameWeight') || '700');
  const [companyCaptionWeight, setCompanyCaptionWeight] = useState(headerConfig.companyCaptionWeight || localStorage.getItem('gs_companyCaptionWeight') || '600');

  // Footer Config States
  const [footerVisible, setFooterVisible] = useState(() => {
    const saved = localStorage.getItem('gs_footerVisible');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [copyrightText, setCopyrightText] = useState(() => {
    return localStorage.getItem('gs_copyrightText') || '© {year} OomniEye. All rights reserved.';
  });
  const [footerPoweredByType, setFooterPoweredByType] = useState<'text' | 'image'>(() => {
    try {
      const saved = localStorage.getItem('gs_footerPoweredByType');
      return saved ? JSON.parse(saved) : 'text';
    } catch {
      return 'text';
    }
  });
  const [footerPoweredByText, setFooterPoweredByText] = useState(() => {
    return localStorage.getItem('gs_footerPoweredByText') || 'Powered by OomniEye Digital Solutions';
  });
  const [footerPoweredByImage, setFooterPoweredByImage] = useState(() => {
    return localStorage.getItem('gs_footerPoweredByImage') || '';
  });
  const [footerLinks, setFooterLinks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gs_footerLinks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sidebar Config States
  const [startExpanded, setStartExpanded] = useState(() => {
    const saved = localStorage.getItem('gs_startExpanded');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [isHoveringExpanded] = useState(false);
  const [isDraggingExpanded] = useState(false);
  const [isHoveringCollapsed] = useState(false);
  const [isDraggingCollapsed] = useState(false);
  const [sidebarBg, setSidebarBg] = useState(sidebarColor || localStorage.getItem('gs_sidebarColor') || '');
  const [autoHideSidebar, setAutoHideSidebar] = useState(sidebarAutoHide);
  const [expandedWidth, setExpandedWidth] = useState(sidebarExpandedWidth);
  const [collapsedWidth, setCollapsedWidth] = useState(sidebarCollapsedWidth);
  const [showIcons, setShowIcons] = useState(sidebarShowIcons);
  const [showLabels, setShowLabels] = useState(sidebarShowLabels);

  // Track if changes have been saved to avoid reverting on close
  const isSavedRef = useRef(false);

  // Close modal — changes are auto-persisted, no revert needed
  const handleCancelAndClose = () => {
    onClose();
  };

  // Sync Header config in real-time
  useEffect(() => {
    onSaveConfig({
      logo,
      showLogo,
      companyName,
      showCompanyName,
      companyCaption,
      showCompanyCaption,
      textColor,
      textColorApply,
      companyNameColor,
      companyCaptionColor,
      companyNameStyle,
      companyCaptionStyle,
      companyNameWeight,
      companyCaptionWeight,
      headerBgColor
    });
  }, [logo, showLogo, companyName, showCompanyName, companyCaption, showCompanyCaption, textColor, textColorApply, companyNameColor, companyCaptionColor, companyNameStyle, companyCaptionStyle, companyNameWeight, companyCaptionWeight, headerBgColor]);

  // Sync Footer config in real-time
  useEffect(() => {
    onSyncFooter({
      footerVisible,
      copyrightText,
      footerPoweredByType,
      footerPoweredByText,
      footerPoweredByImage,
      footerLinks
    });
  }, [footerVisible, copyrightText, footerPoweredByType, footerPoweredByText, footerPoweredByImage, footerLinks]);

  // Sync Sidebar config in real-time
  useEffect(() => {
    setSidebarAutoHide(autoHideSidebar);
    setSidebarExpandedWidth(expandedWidth);
    setSidebarCollapsedWidth(collapsedWidth);
    setSidebarShowIcons(showIcons);
    setSidebarShowLabels(showLabels);
  }, [autoHideSidebar, expandedWidth, collapsedWidth, showIcons, showLabels]);

  // Push sidebar custom colour up in real-time.
  useEffect(() => {
    if (setSidebarColor) setSidebarColor(sidebarBg);
  }, [sidebarBg]);

  // Sync active settings tab with parent
  useEffect(() => {
    if (onTabChange) {
      onTabChange(activeTab);
    }
  }, [activeTab, onTabChange]);

  // Clean up tab track on unmount
  useEffect(() => {
    return () => {
      if (onTabChange) onTabChange('');
    };
  }, [onTabChange]);

  // Security Config States
  // (Removed unused security states based on tsc output)

  // Customer Profile Config States
  const [showCustomerProfile, setShowCustomerProfile] = useState(() => {
    const saved = localStorage.getItem('gs_showCustomerProfile');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem('gs_customerName') || 'OomniEye';
  });
  const [customerNameStyle, setCustomerNameStyle] = useState(() => {
    return localStorage.getItem('gs_customerNameStyle') || 'h1';
  });
  const [customerNameColor, setCustomerNameColor] = useState(() => {
    return localStorage.getItem('gs_customerNameColor') || '#ffffff';
  });
  const [customerCaption, setCustomerCaption] = useState(() => {
    return localStorage.getItem('gs_customerCaption') || 'Digital Twin Solutions';
  });
  const [showCustomerCaption, setShowCustomerCaption] = useState(() => {
    const saved = localStorage.getItem('gs_showCustomerCaption');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [customerCaptionStyle, setCustomerCaptionStyle] = useState(() => {
    return localStorage.getItem('gs_customerCaptionStyle') || 'h3';
  });
  const [customerCaptionColor, setCustomerCaptionColor] = useState(() => {
    return localStorage.getItem('gs_customerCaptionColor') || 'rgba(255, 255, 255, 0.65)';
  });

  const [customerColorFollow, setCustomerColorFollow] = useState(() => {
    const saved = localStorage.getItem('gs_customerColorFollow');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [customerNameWeight, setCustomerNameWeight] = useState(() => localStorage.getItem('gs_customerNameWeight') || '700');
  const [customerCaptionWeight, setCustomerCaptionWeight] = useState(() => localStorage.getItem('gs_customerCaptionWeight') || '600');
  const [showCustomerLogo, setShowCustomerLogo] = useState(() => {
    const saved = localStorage.getItem('gs_showCustomerLogo');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [customerLogo, setCustomerLogo] = useState(() => {
    return localStorage.getItem('gs_customerLogo') || '';
  });

  const customerLogoInputRef = useRef<HTMLInputElement>(null);

  const handleCustomerLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPendingCropImage(reader.result);
          setCropperTarget('customer');
          setIsCropperOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Sync Customer Profile config in real-time
  useEffect(() => {
    if (onSyncCustomerProfile) {
      onSyncCustomerProfile({
        showCustomerProfile,
        customerName,
        customerColorFollow,
        showCustomerLogo,
        customerLogo,
        customerNameStyle,
        customerNameColor,
        customerNameWeight,
        customerCaptionWeight,
        showCustomerCaption,
        customerCaption,
        customerCaptionStyle,
        customerCaptionColor
      });
    }
  }, [showCustomerProfile, customerName, customerColorFollow, showCustomerLogo, customerLogo, customerNameStyle, customerNameColor, customerNameWeight, customerCaptionWeight, showCustomerCaption, customerCaption, customerCaptionStyle, customerCaptionColor, onSyncCustomerProfile]);

  // Equal height is now enforced via CSS (.gs-config-card height: 286px) to maintain a perfectly static layout.
  // Notifications Config States
  const [previewTarget, setPreviewTarget] = useState<string | null>('name');

  const togglePreviewTarget = (target: string) => {
    setPreviewTarget(target);
  };

  // Auto-sync previewTarget focus:
  // - header -> 'name'
  // - profile -> 'customer-logo'
  // - footer & sidebar -> null (normal focus handled by component)
  useEffect(() => {
    if (activeTab === 'header') {
      setPreviewTarget('name');
    } else if (activeTab === 'profile') {
      setPreviewTarget('customer-logo');
    } else {
      setPreviewTarget(null);
    }
  }, [activeTab]);





  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isHoveringExpanded || isDraggingExpanded) {
      setSidebarCollapsed(false);
    } else if (isHoveringCollapsed || isDraggingCollapsed) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(!startExpanded);
    }
  }, [isHoveringExpanded, isDraggingExpanded, isHoveringCollapsed, isDraggingCollapsed, startExpanded, setSidebarCollapsed]);

  // Removed unused containerRef
  const fileInputRef = useRef<HTMLInputElement>(null);
  const footerFileInputRef = useRef<HTMLInputElement>(null);

  // Sync activeTab with parent component to highlight active section
  useEffect(() => {
    if (onTabChange) {
      onTabChange(activeTab);
    }
  }, [activeTab, onTabChange]);

  // Handle Logo file upload
  const handleFooterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPendingCropImage(reader.result);
          setCropperTarget('footer');
          setIsCropperOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPendingCropImage(reader.result);
          setCropperTarget('header');
          setIsCropperOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };



  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const triggerToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    if (onShowToast) onShowToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Save changes
  const handleSave = () => {
    isSavedRef.current = true;
    localStorage.setItem('gs_footerVisible', JSON.stringify(footerVisible));
    localStorage.setItem('gs_copyrightText', copyrightText);
    localStorage.setItem('gs_startExpanded', JSON.stringify(startExpanded));
    localStorage.setItem('sidebarCollapsed', JSON.stringify(!startExpanded));
    setSidebarAutoHide(autoHideSidebar);
    localStorage.setItem('gs_footerPoweredByType', JSON.stringify(footerPoweredByType));
    localStorage.setItem('gs_footerPoweredByText', footerPoweredByText);
    localStorage.setItem('gs_footerPoweredByImage', footerPoweredByImage);
    localStorage.setItem('gs_footerLinks', JSON.stringify(footerLinks));

    localStorage.setItem('gs_showCustomerProfile', JSON.stringify(showCustomerProfile));
    localStorage.setItem('gs_customerName', customerName);
    localStorage.setItem('gs_customerNameStyle', customerNameStyle);
    localStorage.setItem('gs_customerNameColor', customerNameColor);
    localStorage.setItem('gs_customerCaption', customerCaption);
    localStorage.setItem('gs_showCustomerCaption', JSON.stringify(showCustomerCaption));
    localStorage.setItem('gs_customerCaptionStyle', customerCaptionStyle);
    localStorage.setItem('gs_customerCaptionColor', customerCaptionColor);
    localStorage.setItem('gs_customerColorFollow', JSON.stringify(customerColorFollow));
    localStorage.setItem('gs_showCustomerLogo', JSON.stringify(showCustomerLogo));
    localStorage.setItem('gs_customerLogo', customerLogo);
    localStorage.setItem('gs_expandedWidth', JSON.stringify(expandedWidth));
    localStorage.setItem('gs_collapsedWidth', JSON.stringify(collapsedWidth));
    localStorage.setItem('gs_showIcons', JSON.stringify(showIcons));
    localStorage.setItem('gs_showLabels', JSON.stringify(showLabels));
    localStorage.setItem('gs_sidebarColor', sidebarBg);
    localStorage.setItem('gs_companyNameWeight', companyNameWeight);
    localStorage.setItem('gs_companyCaptionWeight', companyCaptionWeight);
    localStorage.setItem('gs_customerNameWeight', customerNameWeight);
    localStorage.setItem('gs_customerCaptionWeight', customerCaptionWeight);
    if (setSidebarColor) setSidebarColor(sidebarBg);
    setSidebarExpandedWidth(expandedWidth);
    setSidebarCollapsedWidth(collapsedWidth);
    setSidebarShowIcons(showIcons);
    setSidebarShowLabels(showLabels);

    // Sync Footer real-time to Dashboard state
    onSyncFooter({
      footerVisible,
      copyrightText,
      footerPoweredByType,
      footerPoweredByText,
      footerPoweredByImage,
      footerLinks
    });

    if (onSyncCustomerProfile) {
      onSyncCustomerProfile({
        showCustomerProfile,
        customerName,
        customerColorFollow,
        showCustomerLogo,
        customerLogo,
        customerNameStyle,
        customerNameColor,
        customerNameWeight,
        customerCaptionWeight
      });
    }

    onSaveConfig({
      logo,
      showLogo,
      companyName,
      showCompanyName,
      companyCaption,
      showCompanyCaption,
      textColor,
      textColorApply,
      companyNameColor,
      companyCaptionColor,
      companyNameStyle,
      companyCaptionStyle,
      companyNameWeight,
      companyCaptionWeight,
      headerBgColor,
      autoHideSidebar,
      startExpanded
    });

    const tabLabel = activeTab === 'header' ? 'Header' : activeTab === 'profile' ? 'Customer Profile' : activeTab === 'footer' ? 'Footer' : 'Sidebar';
    if (onShowToast) {
      onShowToast(`${tabLabel} settings updated successfully!`);
    }
    triggerToast(`${tabLabel} settings updated successfully!`);
    onClose();
  };



  // Close on Escape keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelAndClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleCancelAndClose]);

  const navItems = [
    { id: 'header', label: 'Header', icon: <LayoutPanelTop size={20} /> },
    { id: 'profile', label: 'Customer Profile', icon: <Users size={20} /> },
    { id: 'footer', label: 'Footer', icon: <Layout size={20} /> },
    { id: 'sidebar', label: 'Sidebar', icon: <LayoutPanelLeft size={20} /> },
  ];

  return (
    <div className="gs-overlay" onClick={handleCancelAndClose}>
      {previewTarget && (
        <>
          {/* Glowing Focus Spotlight Outline around active element */}
          <div 
            className="gs-header-spotlight-box"
            style={
              previewTarget === 'logo'
                ? { top: '8px', left: '24px', width: '76px', height: '52px' }
                : previewTarget === 'name'
                ? { top: '8px', left: '104px', width: '250px', height: '52px' }
                : previewTarget === 'customer-logo'
                ? { top: '8px', left: 'calc(50% - 115px)', width: '76px', height: '52px' }
                : previewTarget === 'profile'
                ? { top: '8px', left: 'calc(50% - 130px)', width: '260px', height: '52px' }
                : { top: '6px', left: '16px', width: 'calc(100vw - 32px)', height: '56px' }
            }
          />

          {/* Pointing Arrow Beam Badge */}
          <div 
            className="gs-target-pointer-overlay"
            style={
              previewTarget === 'logo'
                ? { top: '68px', left: '24px' }
                : previewTarget === 'name'
                ? { top: '68px', left: '104px' }
                : previewTarget === 'customer-logo'
                ? { top: '68px', left: 'calc(50% - 115px)' }
                : previewTarget === 'profile'
                ? { top: '68px', left: 'calc(50% - 130px)' }
                : { top: '70px', left: '40px' }
            }
          >
            <div className="gs-pointing-arrow-beam">
              <span className="gs-arrow-icon">↖</span>
              <span className="gs-arrow-label">
                Editing {previewTarget === 'logo' ? 'Main Company Logo' : previewTarget === 'customer-logo' ? 'Center Customer Logo' : previewTarget === 'name' ? 'Company Name & Caption' : previewTarget === 'profile' ? 'Customer Profile' : 'Main Header Bar'}
              </span>
            </div>
          </div>
        </>
      )}


      <div className="gs-workspace-layout" onClick={e => e.stopPropagation()}>

        <ImageCropperModal 
          isOpen={isCropperOpen}
          imageUrl={pendingCropImage}
          onClose={() => setIsCropperOpen(false)}
          onConfirm={(croppedUrl) => {
            if (cropperTarget === 'header') {
              setLogo(croppedUrl);
            } else if (cropperTarget === 'footer') {
              setFooterPoweredByImage(croppedUrl);
            } else if (cropperTarget === 'customer') {
              setCustomerLogo(croppedUrl);
            }
            setIsCropperOpen(false);
          }}
        />

        {/* Floating Left Sidebar Dock (Frame 20 in User Mockup) */}
        <div className="gs-left-dock">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabId)}
              className={`gs-dock-btn ${activeTab === item.id ? 'active' : ''}`}
              title={item.label}
            >
              {item.icon}
              <span className="gs-dock-tooltip">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Main Blurred Grey Window Card (Frame 19 in User Mockup) */}
        <div className="gs-modal" style={{ position: 'relative' }}>
          {toastMessage && (
            <div 
              style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 100000,
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 10px 30px rgba(29, 78, 216, 0.7), 0 0 20px rgba(59, 130, 246, 0.5)',
                borderRadius: '20px',
                padding: '8px 24px',
                color: 'var(--text-main)',
                fontSize: '13.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                animation: 'gsToastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            >
              <CheckCircle2 size={16} style={{ color: '#60a5fa', flexShrink: 0 }} />
              <span>{toastMessage}</span>
            </div>
          )}
          <div className="gs-header">
            <div className="gs-header-left">
              <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#ffffff', letterSpacing: '-0.3px' }}>Global Settings</h2>
            </div>
            <div className="gs-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                type="button"
                className="gs-top-action-btn gs-top-btn-cancel" 
                title="Cancel" 
                onClick={handleCancelAndClose}
                style={{
                  width: '46px',
                  height: '32px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Ban size={16} />
              </button>
              <button 
                type="button"
                className="gs-top-action-btn gs-top-btn-save" 
                title="Save Settings" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSave();
                }}
                style={{
                  width: '46px',
                  height: '32px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Save size={16} />
              </button>
            </div>
          </div>

          {/* CONTENT PANEL BODY (2 Inner Cards) */}
          <div className="gs-content-body">
            <div style={{ padding: '0 8px 10px 8px', fontSize: '17px', fontWeight: 500, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>{activeTab === 'header' ? 'Header' : activeTab === 'profile' ? 'Customer Profile' : activeTab === 'footer' ? 'Footer' : 'Sidebar'}</span>
              {(activeTab === 'header' || activeTab === 'profile') && (
                <button
                  type="button"
                  className={`gs-eye-preview-btn ${previewTarget === (activeTab === 'header' ? 'name' : 'customer-logo') ? 'active' : ''}`}
                  title="Highlight section on page with pointing arrow"
                  onClick={() => togglePreviewTarget(activeTab === 'header' ? 'name' : 'customer-logo')}
                >
                  <Eye size={15} />
                </button>
              )}
            </div>

          {activeTab === 'header' && (
            <div className="gs-tab-content-container">
              <div className="gs-cards-2x2">

                {/* Left Card: Customer Logo */}
                <div className="gs-config-card">
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-main)', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>Customer Logo <InfoTooltip text="Upload or crop the primary customer logo displayed on the page header." /></span>
                    <button
                      type="button"
                      className={`gs-eye-preview-btn ${previewTarget === 'logo' ? 'active' : ''}`}
                      title="Show target area on page header with pointing arrow"
                      onClick={() => togglePreviewTarget('logo')}
                    >
                      <Eye size={15} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
                    <div 
                      className="gs-iphone-dropzone"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          if (file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setPendingCropImage(reader.result as string);
                              setCropperTarget('header');
                              setIsCropperOpen(true);
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                    >
                      <div className="gs-iphone-orb-btn">
                        <Upload size={22} />
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)' }}>Choose customer logo</span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />

                    {logo && (
                      <div className="gs-iphone-file-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={logo} alt="Uploaded Preview" style={{ height: '30px', width: '30px', objectFit: 'contain', borderRadius: '6px' }} />
                          <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>Uploaded logo</span>
                        </div>
                        <button type="button" onClick={() => {
                          setLogo('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }} className="gs-iphone-file-remove-btn">
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '14px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, display: 'inline-flex', alignItems: 'center' }}>Show Customer Logo <InfoTooltip text="Toggle visibility of the customer logo on the header bar." /></span>
                    <AppleToggle checked={showLogo} onChange={setShowLogo} />
                  </div>
                </div>

                {/* Right Card: Header Branding Visibility */}
                <div className="gs-config-card">
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-main)', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>Header Branding Visibility <InfoTooltip text="Configure font style, color, and visibility for company title and caption." position="below-right" /></span>
                    <button
                      type="button"
                      className={`gs-eye-preview-btn ${previewTarget === 'name' ? 'active' : ''}`}
                      title="Show target area on page header with pointing arrow"
                      onClick={() => togglePreviewTarget('name')}
                    >
                      <Eye size={15} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
                    {/* Row 1: Company Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>
                        <input 
                          type="text" 
                          className="gs-underline-input"
                          value={companyName} 
                          onChange={e => setCompanyName(e.target.value)} 
                          placeholder="Company Name"
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                        <select
                          value={companyNameStyle}
                          onChange={(e) => setCompanyNameStyle(e.target.value)}
                          style={{
                            width: '58px',
                            height: '30px',
                            borderRadius: '15px',
                            border: '1px solid var(--gs-input-border)',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '0 8px',
                            backgroundColor: 'var(--gs-input-bg)',
                            color: 'var(--gs-text-color)',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="h1">H1</option>
                          <option value="h2">H2</option>
                          <option value="h3">H3</option>
                          <option value="h4">H4</option>
                        </select>

                        <select
                          value={companyNameWeight}
                          onChange={(e) => setCompanyNameWeight(e.target.value)}
                          title="Font weight"
                          style={GS_PILL_SELECT}
                        >
                          {GS_WEIGHT_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
                        </select>

                        <div style={{ position: 'relative' }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              background: companyNameColor ? companyNameColor : '#ffffff',
                              border: '1.5px solid rgba(255, 255, 255, 0.6)',
                              cursor: 'pointer',
                              boxShadow: '0 0 8px rgba(255, 255, 255, 0.15)'
                            }}
                            onClick={() => document.getElementById('gs-color-picker-company-name')?.click()}
                          />
                          <input
                            id="gs-color-picker-company-name"
                            type="color"
                            value={companyNameColor || '#ffffff'}
                            onChange={(e) => setCompanyNameColor(e.target.value)}
                            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
                          />
                        </div>

                        <AppleToggle checked={showCompanyName} onChange={setShowCompanyName} />
                      </div>
                    </div>

                    {/* Row 2: Company Caption */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>
                        <input 
                          type="text" 
                          className="gs-underline-input"
                          value={companyCaption} 
                          onChange={e => setCompanyCaption(e.target.value)} 
                          placeholder="Company Caption"
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                        <select
                          value={companyCaptionStyle}
                          onChange={(e) => setCompanyCaptionStyle(e.target.value)}
                          style={{
                            width: '58px',
                            height: '30px',
                            borderRadius: '15px',
                            border: '1px solid var(--gs-input-border)',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '0 8px',
                            backgroundColor: 'var(--gs-input-bg)',
                            color: 'var(--gs-text-color)',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="h1">H1</option>
                          <option value="h2">H2</option>
                          <option value="h3">H3</option>
                          <option value="h4">H4</option>
                        </select>

                        <select
                          value={companyCaptionWeight}
                          onChange={(e) => setCompanyCaptionWeight(e.target.value)}
                          title="Font weight"
                          style={GS_PILL_SELECT}
                        >
                          {GS_WEIGHT_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
                        </select>

                        <div style={{ position: 'relative' }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              background: companyCaptionColor ? companyCaptionColor : 'rgba(255, 255, 255, 0.65)',
                              border: '1.5px solid rgba(255, 255, 255, 0.6)',
                              cursor: 'pointer',
                              boxShadow: '0 0 8px rgba(255, 255, 255, 0.15)'
                            }}
                            onClick={() => document.getElementById('gs-color-picker-company-caption')?.click()}
                          />
                          <input
                            id="gs-color-picker-company-caption"
                            type="color"
                            value={companyCaptionColor.startsWith('rgba') ? '#a0aec0' : companyCaptionColor}
                            onChange={(e) => setCompanyCaptionColor(e.target.value)}
                            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
                          />
                        </div>

                        <AppleToggle checked={showCompanyCaption} onChange={setShowCompanyCaption} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Footer Config Panel */}
          {activeTab === 'footer' && (
            <div className="gs-tab-content-container" style={{ padding: '24px 32px' }}>
              <div className="gs-cards-2x2">
                            {/* Left Card: Powered By Settings */}
                <div className="gs-config-card" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-main)', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', display: 'inline-flex', alignItems: 'center' }}>
                      Powered By <InfoTooltip text="Configure footer 'Powered By' attribution as custom text or logo image." />
                    </div>

                    {/* Tabs: Text vs Image */}
                    <div className="gs-segmented-tabs" style={{ display: 'flex', width: '100%' }}>
                      <button
                        type="button"
                        onClick={() => setFooterPoweredByType('text')}
                        className={`gs-tab-btn ${footerPoweredByType === 'text' ? 'active' : ''}`}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Type size={14} /> TEXT
                      </button>
                      <button
                        type="button"
                        onClick={() => setFooterPoweredByType('image')}
                        className={`gs-tab-btn ${footerPoweredByType === 'image' ? 'active' : ''}`}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Image size={14} /> IMAGE
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Inputs */}
                  {footerPoweredByType === 'text' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, paddingTop: '10px' }}>
                      <input 
                        type="text" 
                        className="gs-underline-input"
                        value={footerPoweredByText}
                        onChange={(e) => setFooterPoweredByText(e.target.value)}
                        placeholder="Powered By Text"
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'center' }}>
                      {/* Dashed upload area */}
                      <div 
                        className="gs-iphone-dropzone"
                        onClick={() => footerFileInputRef.current?.click()}
                      >
                        <div className="gs-iphone-orb-btn">
                          <Upload size={20} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Choose image</span>
                      </div>
                      <input
                        ref={footerFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFooterImageUpload}
                        style={{ display: 'none' }}
                      />

                      {/* Uploaded image preview */}
                      {footerPoweredByImage && (
                        <div className="gs-iphone-file-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={footerPoweredByImage} alt="Uploaded Preview" style={{ height: '36px', width: '36px', objectFit: 'contain', borderRadius: '6px' }} />
                            <span style={{ fontSize: '13.5px', color: 'var(--text-main)', fontWeight: 600 }}>Uploaded image</span>
                          </div>
                          <button type="button" onClick={() => {
                            setFooterPoweredByImage('');
                            if (footerFileInputRef.current) footerFileInputRef.current.value = '';
                          }} className="gs-iphone-file-remove-btn">
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Card: Footer Settings */}
                <div className="gs-config-card" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-main)', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', display: 'inline-flex', alignItems: 'center' }}>
                    Footer Settings <InfoTooltip text="Control overall footer bar visibility, copyright text, and navigation links." position="below-right" />
                  </div>

                  {/* Row 1: Footer Visibility */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, display: 'inline-flex', alignItems: 'center' }}>Footer Visibility <InfoTooltip text="Toggle whether footer bar is displayed at bottom of screen." /></span>
                    <AppleToggle checked={footerVisible} onChange={setFooterVisible} />
                  </div>

                  <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }} />

                  {/* Row 2: Copyright Text */}
                  <div>
                    <input 
                      type="text" 
                      className="gs-underline-input"
                      value={copyrightText} 
                      onChange={(e) => setCopyrightText(e.target.value)}
                      placeholder="Copyright Text"
                    />
                  </div>

                  <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }} />

                  {/* Row 3: Add Footer Link */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, display: 'inline-flex', alignItems: 'center' }}>Footer Links <InfoTooltip text="Manage custom navigation links displayed in footer bar." /></span>
                    <button
                      type="button"
                      onClick={() => setFooterLinks([...footerLinks, 'New Link (https://)'])}
                      style={{
                        padding: '6px 16px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                        color: 'var(--text-main)',
                        border: 'none',
                        borderRadius: '14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      + ADD LINK
                    </button>
                  </div>

                  {footerLinks.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {footerLinks.map((entry, i) => {
                        const m = entry.match(/^(.*?)\s*\((.*?)\)$/);
                        const label = m ? m[1] : entry;
                        const url = m ? m[2] : '';
                        const write = (l: string, u: string) => {
                          const next = [...footerLinks];
                          next[i] = `${l} (${u})`;
                          setFooterLinks(next);
                        };
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              className="gs-underline-input"
                              style={{ flex: '1 1 40%' }}
                              value={label}
                              placeholder="Label"
                              onChange={(e) => write(e.target.value, url)}
                            />
                            <input
                              className="gs-underline-input"
                              style={{ flex: '1 1 60%' }}
                              value={url}
                              placeholder="https://example.com"
                              onChange={(e) => write(label, e.target.value)}
                            />
                            <button
                              type="button"
                              title="Remove link"
                              onClick={() => setFooterLinks(footerLinks.filter((_, x) => x !== i))}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: '4px' }}
                            >
                              <X size={15} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Sidebar Config Panel */}
          {activeTab === 'sidebar' && (
            <div className="gs-tab-content-container" style={{ padding: '24px 32px' }}>
              <div className="gs-cards-2x2">
                
                {/* Behavior Card */}
                <div className="gs-config-card" style={{ padding: '22px 32px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-main)', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', display: 'inline-flex', alignItems: 'center' }}>
                    Sidebar Behavior <InfoTooltip text="Configure auto-collapse, auto-hide, and item visibility preferences for navigation sidebar." />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center' }}>Choose color <InfoTooltip text="Custom background colour for the navigation sidebar." /></span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {sidebarBg && (
                          <button
                            type="button"
                            title="Reset sidebar color to theme default"
                            onClick={() => setSidebarBg('')}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: '2px' }}
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                        <div style={{ position: 'relative' }}>
                          <div
                            title="Choose sidebar color"
                            style={{ width: '30px', height: '30px', borderRadius: '50%', background: sidebarBg || '#ffffff', border: '1.5px solid rgba(255, 255, 255, 0.6)', cursor: 'pointer', boxShadow: '0 0 8px rgba(255, 255, 255, 0.15)' }}
                            onClick={() => document.getElementById('gs-color-picker-sidebar')?.click()}
                          />
                          <input
                            id="gs-color-picker-sidebar"
                            type="color"
                            value={sidebarBg || '#ffffff'}
                            onChange={(e) => setSidebarBg(e.target.value)}
                            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
                          />
                        </div>
                      </div>
                    </div>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center' }}>Start Expanded <InfoTooltip text="Choose whether sidebar initializes in expanded mode when app loads." /></span>
                      <AppleToggle checked={startExpanded} onChange={(val) => {
                        setStartExpanded(val);
                        setSidebarCollapsed(!val);
                      }} />
                    </div>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center' }}>Auto Hide Sidebar <InfoTooltip text="Automatically collapse sidebar when not in active use." /></span>
                      <AppleToggle checked={autoHideSidebar} onChange={setAutoHideSidebar} />
                    </div>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', fontWeight: 200, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center' }}>Show Icons <InfoTooltip position="above" text="Display navigation item icons in sidebar. At least one of Show Icons or Show Labels must stay on, or the menu would be invisible." /></span>
                      <AppleToggle checked={showIcons} onChange={(v) => { if (v || showLabels) setShowIcons(v); }} />
                    </div>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', fontWeight: 200, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center' }}>Show Labels <InfoTooltip position="above" text="Display navigation item text labels in sidebar. At least one of Show Icons or Show Labels must stay on, or the menu would be invisible." /></span>
                      <AppleToggle checked={showLabels} onChange={(v) => { if (v || showIcons) setShowLabels(v); }} />
                    </div>
                  </div>
                </div>

                {/* Width Configuration Card */}
                <div className="gs-config-card" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-main)', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', display: 'inline-flex', alignItems: 'center' }}>
                    Sidebar Dimensions <InfoTooltip text="Adjust custom pixel widths for expanded and collapsed sidebar states." position="below-right" />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', flex: 1 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>Expanded Width <InfoTooltip text="Set width (in pixels) of sidebar when fully expanded." /></span>
                        <span style={{ fontWeight: 700 }}>{expandedWidth}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="180" 
                        max="300" 
                        value={expandedWidth} 
                        onChange={e => {
                          setExpandedWidth(Number(e.target.value));
                          setStartExpanded(true);
                          setSidebarCollapsed(false);
                        }}
                        onInput={e => {
                          setExpandedWidth(Number((e.target as HTMLInputElement).value));
                          setStartExpanded(true);
                          setSidebarCollapsed(false);
                        }}
                        onMouseDown={() => {
                          setStartExpanded(true);
                          setSidebarCollapsed(false);
                        }}
                        onTouchStart={() => {
                          setStartExpanded(true);
                          setSidebarCollapsed(false);
                        }}
                        style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }}
                      />
                    </div>

                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }} />

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>Collapsed Width <InfoTooltip text="Set width (in pixels) of sidebar when in minimal collapsed mode." /></span>
                        <span style={{ fontWeight: 700 }}>{collapsedWidth}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" 
                        max="90" 
                        value={collapsedWidth} 
                        onChange={e => {
                          setCollapsedWidth(Number(e.target.value));
                          setStartExpanded(false);
                          setSidebarCollapsed(true);
                        }}
                        onInput={e => {
                          setCollapsedWidth(Number((e.target as HTMLInputElement).value));
                          setStartExpanded(false);
                          setSidebarCollapsed(true);
                        }}
                        onMouseDown={() => {
                          setStartExpanded(false);
                          setSidebarCollapsed(true);
                        }}
                        onTouchStart={() => {
                          setStartExpanded(false);
                          setSidebarCollapsed(true);
                        }}
                        style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }}
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Customer Profile Config Panel */}
          {activeTab === 'profile' && (
            <div className="gs-tab-content-container" style={{ padding: '24px 32px' }}>
              <div className="gs-cards-2x2">
                
                {/* Left Card: Customer Logo */}
                <div className="gs-config-card">
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-main)', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>Customer Logo <InfoTooltip text="Upload or crop customer profile logo image." /></span>
                    <button
                      type="button"
                      className={`gs-eye-preview-btn ${previewTarget === 'customer-logo' ? 'active' : ''}`}
                      title="Show target area on page header with pointing arrow"
                      onClick={() => togglePreviewTarget('customer-logo')}
                    >
                      <Eye size={15} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
                    <div 
                      className="gs-iphone-dropzone"
                      onClick={() => customerLogoInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          if (file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setPendingCropImage(reader.result as string);
                              setCropperTarget('customer');
                              setIsCropperOpen(true);
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                    >
                      <div className="gs-iphone-orb-btn">
                        <Upload size={22} />
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)' }}>Choose customer logo</span>
                    </div>
                    <input
                      ref={customerLogoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCustomerLogoUpload}
                      style={{ display: 'none' }}
                    />

                    {customerLogo && (
                      <div className="gs-iphone-file-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={customerLogo} alt="Uploaded Preview" style={{ height: '30px', width: '30px', objectFit: 'contain', borderRadius: '6px' }} />
                          <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>Uploaded logo</span>
                        </div>
                        <button type="button" onClick={() => {
                          setCustomerLogo('');
                          if (customerLogoInputRef.current) customerLogoInputRef.current.value = '';
                        }} className="gs-iphone-file-remove-btn">
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '14px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, display: 'inline-flex', alignItems: 'center' }}>Show Customer Logo <InfoTooltip text="Toggle whether customer profile logo is displayed." /></span>
                    <AppleToggle checked={showCustomerLogo} onChange={setShowCustomerLogo} />
                  </div>
                </div>

                {/* Right Card: Customer Profile Visibility */}
                <div className="gs-config-card" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-main)', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>Customer Profile Visibility <InfoTooltip text="Manage visibility, typography styles, and color follow settings for customer profile." position="below-right" /></span>
                    <button
                      type="button"
                      className={`gs-eye-preview-btn ${previewTarget === 'profile' ? 'active' : ''}`}
                      title="Show target area on page header with pointing arrow"
                      onClick={() => togglePreviewTarget('profile')}
                    >
                      <Eye size={15} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
                    {/* Row 1: Customer Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>
                        <input 
                          type="text" 
                          className="gs-underline-input"
                          value={customerName} 
                          onChange={e => setCustomerName(e.target.value)} 
                          placeholder="Customer Name"
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                        <select
                          value={customerNameStyle}
                          onChange={(e) => setCustomerNameStyle(e.target.value)}
                          style={{
                            width: '58px',
                            height: '30px',
                            borderRadius: '15px',
                            border: '1px solid var(--gs-input-border)',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '0 8px',
                            backgroundColor: 'var(--gs-input-bg)',
                            color: 'var(--gs-text-color)',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="h1">H1</option>
                          <option value="h2">H2</option>
                          <option value="h3">H3</option>
                          <option value="h4">H4</option>
                        </select>

                        <select
                          value={customerNameWeight}
                          onChange={(e) => setCustomerNameWeight(e.target.value)}
                          title="Font weight"
                          style={GS_PILL_SELECT}
                        >
                          {GS_WEIGHT_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
                        </select>

                        <div style={{ position: 'relative' }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              background: customerNameColor ? customerNameColor : '#ffffff',
                              border: '1.5px solid rgba(255, 255, 255, 0.6)',
                              cursor: 'pointer',
                              boxShadow: '0 0 8px rgba(255, 255, 255, 0.15)'
                            }}
                            onClick={() => document.getElementById('gs-color-picker-customer-name')?.click()}
                          />
                          <input
                            id="gs-color-picker-customer-name"
                            type="color"
                            value={customerNameColor || '#ffffff'}
                            onChange={(e) => setCustomerNameColor(e.target.value)}
                            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
                          />
                        </div>

                        <AppleToggle checked={showCustomerProfile} onChange={setShowCustomerProfile} />
                      </div>
                    </div>

                    {/* Row 2: Customer Caption (Matching User Screenshot 1:1) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>
                        <input 
                          type="text" 
                          className="gs-underline-input"
                          value={customerCaption} 
                          onChange={e => setCustomerCaption(e.target.value)} 
                          placeholder="Digital Twin Solutions"
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                        <select
                          value={customerCaptionStyle}
                          onChange={(e) => setCustomerCaptionStyle(e.target.value)}
                          style={{
                            width: '58px',
                            height: '30px',
                            borderRadius: '15px',
                            border: '1px solid var(--gs-input-border)',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '0 8px',
                            backgroundColor: 'var(--gs-input-bg)',
                            color: 'var(--gs-text-color)',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="h1">H1</option>
                          <option value="h2">H2</option>
                          <option value="h3">H3</option>
                          <option value="h4">H4</option>
                        </select>

                        <select
                          value={customerCaptionWeight}
                          onChange={(e) => setCustomerCaptionWeight(e.target.value)}
                          title="Font weight"
                          style={GS_PILL_SELECT}
                        >
                          {GS_WEIGHT_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
                        </select>

                        <div style={{ position: 'relative' }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              background: customerCaptionColor ? customerCaptionColor : 'rgba(255, 255, 255, 0.65)',
                              border: '1.5px solid rgba(255, 255, 255, 0.6)',
                              cursor: 'pointer',
                              boxShadow: '0 0 8px rgba(255, 255, 255, 0.15)'
                            }}
                            onClick={() => document.getElementById('gs-color-picker-customer-caption')?.click()}
                          />
                          <input
                            id="gs-color-picker-customer-caption"
                            type="color"
                            value={customerCaptionColor.startsWith('rgba') ? '#a0aec0' : customerCaptionColor}
                            onChange={(e) => setCustomerCaptionColor(e.target.value)}
                            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
                          />
                        </div>

                        <AppleToggle checked={showCustomerCaption} onChange={setShowCustomerCaption} />
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, display: 'inline-flex', alignItems: 'center' }}>Text Color matches theme <InfoTooltip position="above" text="When on, customer name and caption follow the theme text colour and the colour swatches are ignored." /></span>
                    <AppleToggle checked={customerColorFollow} onChange={setCustomerColorFollow} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}
