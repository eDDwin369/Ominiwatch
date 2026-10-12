import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  LayoutPanelTop, Layout, LayoutPanelLeft, Users,
  CheckCircle2, Info, X, RotateCcw, AlertCircle, Settings, ArrowLeft, Trash2, Check
} from 'lucide-react';
import './GlobalSettingsWorkspace.css';

import { ImageCropperModal } from './ImageCropperModal';
import { useThemeStore, DEFAULT_SETTINGS } from 'omnieye-theme-studio';
import { Dropdown } from '../shared/Dropdown';
import { TextField } from '../shared/TextField';

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
  onPreviewConfig: (config: any) => void;
  sidebarAutoHide: boolean;
  setSidebarAutoHide: (val: boolean) => void;
  sidebarExpandedWidth: number;
  setSidebarExpandedWidth: (val: number) => void;
  sidebarCollapsedWidth: number;
  setSidebarCollapsedWidth: (val: number) => void;
  sidebarShowIcons: boolean;
  setSidebarShowIcons: (val: boolean) => void;
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
            borderRadius: 'calc(var(--radius-unit, 1px) * 8)',
            padding: '7px 12px',
            color: 'var(--text-main)',
            fontSize: 'var(--font-size-caption, 12px)',
            fontWeight: 'var(--app-font-weight, 400)',
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
const GS_WEIGHT_OPTIONS = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];
const GS_STYLE_OPTIONS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((v) => ({ value: v, label: v.toUpperCase() }));

export const isValidUrl = (urlStr: string): boolean => {
  if (!urlStr || urlStr.trim() === '') return false;
  try {
    const formatted = urlStr.startsWith('http://') || urlStr.startsWith('https://') 
      ? urlStr 
      : `https://${urlStr}`;
    const parsed = new URL(formatted);
    return Boolean(parsed.hostname && parsed.hostname.includes('.') && parsed.hostname.length >= 4);
  } catch {
    return false;
  }
};


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
  onPreviewConfig,
  sidebarAutoHide,
  setSidebarAutoHide,
  sidebarExpandedWidth,
  setSidebarExpandedWidth,
  sidebarCollapsedWidth,
  setSidebarCollapsedWidth,
  sidebarShowIcons,
  setSidebarShowIcons,
  sidebarColor = '',
  setSidebarColor,
  onSyncFooter,
  setSidebarCollapsed,
  onTabChange,
  onSyncCustomerProfile,
  onShowToast
}: GlobalSettingsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabId>('header');

  // Theme Studio is the single source of truth for brand identity (it has the
  // fuller feature set); Global Settings only edits sidebar / header / footer.
  const studioSettings = useThemeStore((s) => s.settings);
  const studioSet = useThemeStore((s) => s.set);

  // Global Settings chrome text (title / tab label / card titles / field labels /
  // dropzone microcopy) follows Theme Studio's heading scale + a colour priority:
  // that heading level's own colour (h1Color..h6Color from the Colour Panel) -> mode-aware
  // text colour (--text-main / --text-secondary). .gs-config-card's background tracks
  // light/dark mode (var(--bg-card)), so a fixed colour breaks contrast in whichever mode
  // it wasn't tuned for — only an explicit per-heading override should be fixed. Size/weight
  // reuse the same --h{n}-size/-weight vars theme-bridge.tsx already syncs from Theme
  // Studio, so both light and dark mode just work (those vars are theme-mode-aware already).
  const headingStyle = (level: 1 | 2 | 3 | 4 | 5 | 6, fallback: 'primary' | 'secondary' = 'primary'): React.CSSProperties => ({
    fontSize: `var(--h${level}-size)`,
    fontWeight: `var(--h${level}-weight)` as React.CSSProperties['fontWeight'],
    fontFamily: 'var(--app-heading-family)',
    color: (studioSettings as Record<string, string>)[`h${level}Color`]
      || (fallback === 'secondary' ? 'var(--text-secondary)' : 'var(--text-main)'),
  });

  // Row labels inside cards use Theme Studio's body text tokens, one step below the H5 card titles.
  const bodyTextStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-body)',
    fontWeight: 'var(--app-font-weight)' as React.CSSProperties['fontWeight'],
    fontFamily: 'var(--app-font-family)',
    color: 'var(--text-main)',
  };

  // Local form states (Header Config)

  // Cropper State
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [pendingCropImage, setPendingCropImage] = useState('');
  const [cropperTarget, setCropperTarget] = useState<'header' | 'footer' | 'customer' | null>(null);

  const [logo, setLogo] = useState(headerConfig.logo);
  const [showLogo, setShowLogo] = useState(headerConfig.showLogo);
  // Seed from Theme Studio (source of truth), falling back to the legacy header config.
  // Fields start empty: the studio's built-in brand defaults don't count as user-entered values.
  const [companyName, setCompanyName] = useState(studioSettings.appName !== DEFAULT_SETTINGS.appName ? studioSettings.appName || '' : '');
  const [showCompanyName, setShowCompanyName] = useState(headerConfig.showCompanyName);
  const [companyCaption, setCompanyCaption] = useState(studioSettings.appTagline !== DEFAULT_SETTINGS.appTagline ? studioSettings.appTagline || '' : '');
  const [showCompanyCaption, setShowCompanyCaption] = useState(headerConfig.showCompanyCaption !== undefined ? headerConfig.showCompanyCaption : true);
  const [textColor] = useState(headerConfig.textColor || '#ffffff');
  const [textColorApply] = useState<any>(headerConfig.textColorApply || 'both');
  const [headerBgColor, setHeaderBgColor] = useState(headerConfig.headerBgColor || 'transparent');
  const [companyNameColor, setCompanyNameColor] = useState(headerConfig.companyNameColor || '#ffffff');
  const [companyCaptionColor, setCompanyCaptionColor] = useState(headerConfig.companyCaptionColor || headerConfig.textColor || '#000000');
  const [companyNameStyle, setCompanyNameStyle] = useState(headerConfig.companyNameStyle || 'h1');
  const [companyCaptionStyle, setCompanyCaptionStyle] = useState(headerConfig.companyCaptionStyle || 'h4');
  const [companyNameWeight, setCompanyNameWeight] = useState(headerConfig.companyNameWeight || localStorage.getItem('gs_companyNameWeight') || '400');
  const [companyCaptionWeight, setCompanyCaptionWeight] = useState(headerConfig.companyCaptionWeight || localStorage.getItem('gs_companyCaptionWeight') || '300');

  // Footer Config States
  const [footerVisible, setFooterVisible] = useState(() => {
    const saved = localStorage.getItem('gs_footerVisible');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [copyrightText, setCopyrightText] = useState(() => {
    return localStorage.getItem('gs_copyrightText') || '';
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
    return localStorage.getItem('gs_footerPoweredByText') || '';
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

  const [sidebarBg, setSidebarBg] = useState(sidebarColor || localStorage.getItem('gs_sidebarColor') || '');
  const [autoHideSidebar, setAutoHideSidebar] = useState(sidebarAutoHide);
  const [expandedWidth, setExpandedWidth] = useState(sidebarExpandedWidth);
  const [collapsedWidth, setCollapsedWidth] = useState(sidebarCollapsedWidth);
  const [showIcons, setShowIcons] = useState(sidebarShowIcons);

  // Track if changes have been saved to avoid reverting on close
  const isSavedRef = useRef(false);

  // Close modal without saving — edits were already pushed live to the app for
  // preview (see the useEffects below), so revert those same paths back to how
  // things were when the modal opened before closing. Nothing was ever written
  // to localStorage (that only happens in handleSave), so no persisted state to undo.
  const handleCancelAndClose = () => {
    if (!isSavedRef.current) {
      const snap = liveSnapshotRef.current;
      onPreviewConfig(snap.header);
      onSyncFooter(snap.footer);
      if (onSyncCustomerProfile) onSyncCustomerProfile(snap.customer);
      if (setSidebarColor) setSidebarColor(snap.sidebar.sidebarBg);
      setSidebarAutoHide(snap.sidebar.autoHideSidebar);
      setSidebarExpandedWidth(snap.sidebar.expandedWidth);
      setSidebarCollapsedWidth(snap.sidebar.collapsedWidth);
      setSidebarShowIcons(snap.sidebar.showIcons);
      setSidebarCollapsed(!snap.sidebar.startExpanded);
    }
    onClose();
  };

  // Header/Footer/Sidebar/Customer-Profile fields are draft state here, pushed
  // live to the app as they change (see useEffects below) so the modal previews
  // instantly. Only handleSave persists them (localStorage); Cancel reverts the
  // live push back to liveSnapshotRef. Theme-Studio brand fields (appName/
  // appTagline) stay Save-only — they're a secondary sync, not part of the
  // header's own live preview.

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
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem('gs_customerName') || '';
  });
  const [customerNameStyle, setCustomerNameStyle] = useState(() => {
    return localStorage.getItem('gs_customerNameStyle') || 'h1';
  });
  const [customerNameColor, setCustomerNameColor] = useState(() => {
    return localStorage.getItem('gs_customerNameColor') || '#ffffff';
  });
  const [customerCaption, setCustomerCaption] = useState(() => {
    return localStorage.getItem('gs_customerCaption') || '';
  });
  const [showCustomerCaption, setShowCustomerCaption] = useState(() => {
    const saved = localStorage.getItem('gs_showCustomerCaption');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [customerCaptionStyle, setCustomerCaptionStyle] = useState(() => {
    return localStorage.getItem('gs_customerCaptionStyle') || 'h4';
  });
  const [customerCaptionColor, setCustomerCaptionColor] = useState(() => {
    return localStorage.getItem('gs_customerCaptionColor') || 'rgba(255, 255, 255, 0.65)';
  });

  const [customerColorFollow, setCustomerColorFollow] = useState(() => {
    const saved = localStorage.getItem('gs_customerColorFollow');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [customerNameWeight, setCustomerNameWeight] = useState(() => localStorage.getItem('gs_customerNameWeight') || '400');
  const [customerCaptionWeight, setCustomerCaptionWeight] = useState(() => localStorage.getItem('gs_customerCaptionWeight') || '300');
  const [showCustomerLogo, setShowCustomerLogo] = useState(() => {
    const saved = localStorage.getItem('gs_showCustomerLogo');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [customerLogo, setCustomerLogo] = useState(() => {
    return localStorage.getItem('gs_customerLogo') || '';
  });

  // Snapshot of the live app values as they were when the modal opened — used to
  // revert the live preview if the user cancels instead of saving.
  const liveSnapshotRef = useRef({
    header: { ...headerConfig },
    footer: { footerVisible, copyrightText, footerPoweredByType, footerPoweredByText, footerPoweredByImage, footerLinks },
    customer: {
      showCustomerProfile, customerName, customerColorFollow, showCustomerLogo, customerLogo,
      customerNameStyle, customerNameColor, customerNameWeight, customerCaptionWeight,
      showCustomerCaption, customerCaption, customerCaptionStyle, customerCaptionColor,
    },
    sidebar: { sidebarBg, autoHideSidebar, expandedWidth, collapsedWidth, showIcons, startExpanded },
  });

  // Every editable draft value — compared against its opening value to detect unsaved changes.
  const draftValues = {
    logo, showLogo, companyName, showCompanyName, companyCaption, showCompanyCaption,
    companyNameColor, companyCaptionColor, companyNameStyle, companyCaptionStyle,
    companyNameWeight, companyCaptionWeight, headerBgColor,
    footerVisible, copyrightText, footerPoweredByType, footerPoweredByText, footerPoweredByImage, footerLinks,
    showCustomerProfile, customerName, customerColorFollow, showCustomerLogo, customerLogo,
    customerNameStyle, customerNameColor, customerNameWeight, customerCaptionWeight,
    showCustomerCaption, customerCaption, customerCaptionStyle, customerCaptionColor,
    sidebarBg, autoHideSidebar, expandedWidth, collapsedWidth, showIcons, startExpanded,
  };
  const [initialDraft] = useState(() => JSON.stringify(draftValues));
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Close button / overlay / Escape all route here: ask first if anything changed.
  const requestClose = () => {
    if (JSON.stringify(draftValues) !== initialDraft) setShowUnsavedPrompt(true);
    else handleCancelAndClose();
  };

  // Live preview: push draft edits straight to the app as they change. Nothing here
  // touches localStorage — persistence only happens in handleSave. Cancel reverts
  // these same paths back to liveSnapshotRef below.
  useEffect(() => {
    onPreviewConfig({
      logo, showLogo, companyName, showCompanyName, companyCaption, showCompanyCaption,
      textColor, textColorApply, companyNameColor, companyCaptionColor,
      companyNameStyle, companyCaptionStyle, companyNameWeight, companyCaptionWeight, headerBgColor,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logo, showLogo, companyName, showCompanyName, companyCaption, showCompanyCaption, companyNameColor, companyCaptionColor, companyNameStyle, companyCaptionStyle, companyNameWeight, companyCaptionWeight, headerBgColor]);

  useEffect(() => {
    onSyncFooter({ footerVisible, copyrightText, footerPoweredByType, footerPoweredByText, footerPoweredByImage, footerLinks });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [footerVisible, copyrightText, footerPoweredByType, footerPoweredByText, footerPoweredByImage, footerLinks]);

  useEffect(() => {
    if (onSyncCustomerProfile) {
      onSyncCustomerProfile({
        showCustomerProfile, customerName, customerColorFollow, showCustomerLogo, customerLogo,
        customerNameStyle, customerNameColor, customerNameWeight, customerCaptionWeight,
        showCustomerCaption, customerCaption, customerCaptionStyle, customerCaptionColor,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCustomerProfile, customerName, customerColorFollow, showCustomerLogo, customerLogo, customerNameStyle, customerNameColor, customerNameWeight, customerCaptionWeight, showCustomerCaption, customerCaption, customerCaptionStyle, customerCaptionColor]);

  useEffect(() => {
    if (setSidebarColor) setSidebarColor(sidebarBg);
    setSidebarAutoHide(autoHideSidebar);
    setSidebarExpandedWidth(expandedWidth);
    setSidebarCollapsedWidth(collapsedWidth);
    setSidebarShowIcons(showIcons);
    setSidebarCollapsed(!startExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarBg, autoHideSidebar, expandedWidth, collapsedWidth, showIcons, startExpanded]);

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

  // Equal height is now enforced via CSS (.gs-config-card height: 286px) to maintain a perfectly static layout.
  // Notifications Config States
  const [previewTarget, setPreviewTarget] = useState<string | null>('name');

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
    const durMs = ((studioSettings as any).autoDismissSec || 8) * 1000;
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, durMs);
  };

  // Link limit popup state (Max 1 link allowed)
  const [linkLimitPopup, setLinkLimitPopup] = useState(false);
  const linkLimitTimeoutRef = useRef<any>(null);

  const handleAddFooterLink = () => {
    if (footerLinks.length >= 1) {
      if (linkLimitTimeoutRef.current) clearTimeout(linkLimitTimeoutRef.current);
      setLinkLimitPopup(true);
      linkLimitTimeoutRef.current = setTimeout(() => {
        setLinkLimitPopup(false);
      }, 3000);
      return;
    }
    setLinkLimitPopup(false);
    setFooterLinks([...footerLinks, 'New Link (https://example.com)']);
  };

  // Save changes
  const handleSave = () => {
    isSavedRef.current = true;

    // Brand name / caption edits flow back into Theme Studio (the source of truth),
    // so both stay identical. Only pushed on Save, not as the fields are typed into.
    const studioPatch: Record<string, string> = {};
    if (companyName !== studioSettings.appName) studioPatch.appName = companyName;
    if (companyCaption !== studioSettings.appTagline) studioPatch.appTagline = companyCaption;
    if (Object.keys(studioPatch).length) studioSet(studioPatch);

    localStorage.setItem('gs_footerVisible', JSON.stringify(footerVisible));
    localStorage.setItem('gs_copyrightText', copyrightText);
    localStorage.setItem('gs_startExpanded', JSON.stringify(startExpanded));
    localStorage.setItem('sidebarCollapsed', JSON.stringify(!startExpanded));
    setSidebarCollapsed(!startExpanded);
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
    localStorage.setItem('gs_sidebarColor', sidebarBg);
    localStorage.setItem('gs_companyNameWeight', companyNameWeight);
    localStorage.setItem('gs_companyCaptionWeight', companyCaptionWeight);
    localStorage.setItem('gs_customerNameWeight', customerNameWeight);
    localStorage.setItem('gs_customerCaptionWeight', customerCaptionWeight);
    if (setSidebarColor) setSidebarColor(sidebarBg);
    setSidebarExpandedWidth(expandedWidth);
    setSidebarCollapsedWidth(collapsedWidth);
    setSidebarShowIcons(showIcons);

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
        customerCaptionWeight,
        showCustomerCaption,
        customerCaption,
        customerCaptionStyle,
        customerCaptionColor
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
      if (e.key !== 'Escape') return;
      if (showUnsavedPrompt) setShowUnsavedPrompt(false);
      else requestClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  const navItems = [
    { id: 'header', label: 'Header', tip: 'Company logo and header branding.', icon: <LayoutPanelTop size={20} /> },
    { id: 'profile', label: 'Customer Profile', tip: 'Customer logo and profile text.', icon: <Users size={20} /> },
    { id: 'footer', label: 'Footer', tip: 'Powered-by, copyright and footer links.', icon: <Layout size={20} /> },
    { id: 'sidebar', label: 'Sidebar', tip: 'Sidebar colour, behaviour and widths.', icon: <LayoutPanelLeft size={20} /> },
  ];

  return (
    <div className="gs-overlay" onClick={requestClose}>
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
          cropShape="rect"
          cropWidth={220}
          cropHeight={150}
          title="Adjust logo"
          subtitle="Drag and zoom to fit your logo inside the bright frame. Anything in the dimmed area is cropped out."
          onClose={() => setIsCropperOpen(false)}
          onConfirm={(croppedUrl) => {
            if (cropperTarget === 'header') {
              setLogo(croppedUrl);
            } else if (cropperTarget === 'footer') {
              setFooterPoweredByImage(croppedUrl);
              setFooterPoweredByType('image');
            } else if (cropperTarget === 'customer') {
              setCustomerLogo(croppedUrl);
            }
            setIsCropperOpen(false);
          }}
        />

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
                borderRadius: 'calc(var(--radius-unit, 1px) * 20)',
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
            <div className="gs-header-left page-title-group">
              <span className="page-title-icon" aria-hidden="true"><Settings size={20} /></span>
              <h2 className="brand-gradient-text" style={headingStyle(2)}>Global Settings</h2>
            </div>
            <div className="gs-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                type="button"
                className="gs-top-action-btn gs-top-btn-cancel" 
                title="Close"
                aria-label="Close"
                onClick={requestClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <X size={18} strokeWidth={2.25} />
              </button>
            </div>
          </div>

          {showUnsavedPrompt && (
            <div className="gs-confirm-backdrop" onClick={() => setShowUnsavedPrompt(false)}>
              <div
                className="gs-confirm"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="gs-confirm-title"
                onClick={e => e.stopPropagation()}
              >
                <div className="page-title-group gs-confirm-header">
                  <span className="page-title-icon" aria-hidden="true"><AlertCircle size={18} /></span>
                  <h3 id="gs-confirm-title" className="gs-confirm-title brand-gradient-text">Unsaved changes</h3>
                </div>
                <p className="gs-confirm-text">You have unsaved changes. Save them before closing Global Settings?</p>
                <div className="gs-confirm-actions">
                  <button type="button" className="gs-confirm-btn shell-btn-icon" data-tip="Cancel — keep editing" aria-label="Cancel — keep editing" onClick={() => setShowUnsavedPrompt(false)}>
                    <ArrowLeft size={18} />
                  </button>
                  <button type="button" className="gs-confirm-btn shell-btn-icon shell-btn-icon--danger" data-tip="Discard changes" aria-label="Discard changes" onClick={handleCancelAndClose}>
                    <Trash2 size={17} />
                  </button>
                  <button type="button" className="gs-confirm-btn gs-top-btn-save shell-btn-icon shell-btn-icon--success" data-tip="Save changes" aria-label="Save changes" onClick={handleSave} autoFocus>
                    <Check size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab strip: inactive tabs form a tinted band; the active tab is transparent so it
              reads as part of the body below, and its neighbours round their inner corner into it. */}
          <div className="gs-tabs" role="tablist">
            {navItems.map(item => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={activeTab === item.id}
                onClick={() => setActiveTab(item.id as TabId)}
                className={`gs-tab ${activeTab === item.id ? 'active' : ''}`}
                data-tip={item.tip}
              >
                <span className="gs-tab-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* CONTENT PANEL BODY (2 Inner Cards) */}
          <div className="gs-content-body">
          {activeTab === 'header' && (
            <div className="gs-tab-content-container">
              <div className="gs-cards-2x2">

                {/* Left Card: Company Logo (headerConfig.logo — the main logo, left of the header bar; distinct from the Customer Logo in the Profile tab) */}
                <div className="gs-config-card">
                  <div className="gs-card-header" style={{ ...headingStyle(4), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}><span className="brand-gradient-text">Company Logo</span> <InfoTooltip text="Upload or crop the primary company logo displayed on the page header." /></span>
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
                      <span style={{ ...headingStyle(6, 'secondary') }}>Choose company logo</span>
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
                          <img src={logo} alt="Uploaded Preview" style={{ maxHeight: '32px', maxWidth: '64px', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 'calc(var(--radius-unit, 1px) * 4)' }} />
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
                    <span style={{ ...bodyTextStyle, display: 'inline-flex', alignItems: 'center' }}>Show Company Logo <InfoTooltip text="Toggle visibility of the company logo on the header bar." /></span>
                    <AppleToggle checked={showLogo} onChange={setShowLogo} />
                  </div>
                </div>

                {/* Right Card: Header Branding Visibility */}
                <div className="gs-config-card">
                  <div className="gs-card-header" style={{ ...headingStyle(4), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}><span className="brand-gradient-text">Header Branding</span> <InfoTooltip text="Configure font style, color, and visibility for company title and caption." position="below-right" /></span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
                    {/* Row 1: Company Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>
                        <TextField label="Company Name" value={companyName} style={{ fontWeight: Number(companyNameWeight) }} onChange={e => setCompanyName(e.target.value)} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                        <Dropdown variant="pill" width="58px" value={companyNameStyle} onChange={setCompanyNameStyle} options={GS_STYLE_OPTIONS} title="Heading level" />

                        <Dropdown variant="pill" width="64px" value={companyNameWeight} onChange={setCompanyNameWeight} options={GS_WEIGHT_OPTIONS} title="Font weight" editable />

                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            className="gs-swatch-btn"
                            title="Choose colour"
                            aria-label="Choose colour"
                            style={{ ['--swatch' as string]: companyNameColor ? companyNameColor : '#ffffff' }}
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
                        <TextField label="Company Caption" value={companyCaption} style={{ fontWeight: Number(companyCaptionWeight) }} onChange={e => setCompanyCaption(e.target.value)} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                        <Dropdown variant="pill" width="58px" value={companyCaptionStyle} onChange={setCompanyCaptionStyle} options={GS_STYLE_OPTIONS} title="Heading level" />

                        <Dropdown variant="pill" width="64px" value={companyCaptionWeight} onChange={setCompanyCaptionWeight} options={GS_WEIGHT_OPTIONS} title="Font weight" editable />

                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            className="gs-swatch-btn"
                            title="Choose colour"
                            aria-label="Choose colour"
                            style={{ ['--swatch' as string]: companyCaptionColor ? companyCaptionColor : 'rgba(255, 255, 255, 0.65)' }}
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

                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ ...bodyTextStyle, display: 'inline-flex', alignItems: 'center' }}>Header background <InfoTooltip position="above" text="Override the theme header colour. Reset to fall back to the active colour template." /></span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {headerBgColor && headerBgColor !== 'transparent' && (
                        <button
                          type="button"
                          title="Reset header background to theme default"
                          onClick={() => setHeaderBgColor('transparent')}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: '2px' }}
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          className="gs-swatch-btn"
                          title="Choose header background color"
                          aria-label="Choose header background color"
                          style={{ ['--swatch' as string]: (headerBgColor && headerBgColor !== 'transparent') ? headerBgColor : '#141b3c' }}
                          onClick={() => document.getElementById('gs-color-picker-header-bg')?.click()}
                        />
                        <input
                          id="gs-color-picker-header-bg"
                          type="color"
                          value={(headerBgColor && headerBgColor.startsWith('#')) ? headerBgColor : '#141b3c'}
                          onChange={(e) => setHeaderBgColor(e.target.value)}
                          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Footer Config Panel */}
          {activeTab === 'footer' && (
            <div className="gs-tab-content-container">
              <div className="gs-cards-2x2">
                            {/* Left Card: Powered By (same layout as Company Logo: header, upload + preview, bottom row) */}
                <div className="gs-config-card">
                  <div className="gs-card-header" style={{ ...headingStyle(4), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}><span className="brand-gradient-text">Powered By</span> <InfoTooltip text="Footer 'Powered By' attribution. An uploaded image is shown instead of the caption." /></span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
                    <div
                      className="gs-iphone-dropzone"
                      onClick={() => footerFileInputRef.current?.click()}
                    >
                      <div className="gs-iphone-orb-btn">
                        <Upload size={22} />
                      </div>
                      <span style={{ ...headingStyle(6, 'secondary') }}>Choose image</span>
                    </div>
                    <input
                      ref={footerFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFooterImageUpload}
                      style={{ display: 'none' }}
                    />

                    {footerPoweredByImage && (
                      <div className="gs-iphone-file-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={footerPoweredByImage} alt="Uploaded Preview" style={{ maxHeight: '32px', maxWidth: '64px', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 'calc(var(--radius-unit, 1px) * 4)' }} />
                          <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>Uploaded image</span>
                        </div>
                        <button type="button" onClick={() => {
                          setFooterPoweredByImage('');
                          setFooterPoweredByType('text');
                          if (footerFileInputRef.current) footerFileInputRef.current.value = '';
                        }} className="gs-iphone-file-remove-btn">
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '14px' }}>
                    <TextField
                      label="Footer Caption"
                      value={footerPoweredByText}
                      maxLength={50}
                      counter
                      onChange={(e) => setFooterPoweredByText(e.target.value.replace(/[\r\n]+/g, ' ').slice(0, 50))}
                      placeholder={`Powered by ${companyName || 'OomniEye'} Digital Solutions`}
                    />
                  </div>
                </div>

                {/* Right Card: Footer Settings */}
                <div className="gs-config-card">
                  <div className="gs-card-header" style={{ ...headingStyle(4), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}><span className="brand-gradient-text">Footer Settings</span> <InfoTooltip text="Control overall footer bar visibility, copyright text, and navigation links." position="below-right" /></span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
                  {/* Row 1: Copyright Text */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <TextField
                      label="Copyright Text"
                      value={copyrightText}
                      maxLength={50}
                      counter
                      onChange={(e) => setCopyrightText(e.target.value.replace(/[\r\n]+/g, ' ').slice(0, 50))}
                    />
                  </div>

                  {/* Row 2: Footer Links */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ ...bodyTextStyle, display: 'inline-flex', alignItems: 'center' }}>Footer Links <InfoTooltip text="Manage custom navigation links displayed in footer bar." /></span>
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                      {linkLimitPopup && (
                        <div
                          role="alert"
                          style={{
                            position: 'absolute',
                            bottom: 'calc(100% + 9px)',
                            right: 0,
                            background: '#ffffff',
                            color: '#0f172a',
                            border: '1px solid rgba(0, 0, 0, 0.12)',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08)',
                            borderRadius: 'calc(var(--radius-unit, 1px) * 10)',
                            padding: '6px 12px',
                            fontSize: 'var(--font-size-caption, 12px)',
                            fontWeight: 'var(--font-weight-strong, 600)',
                            whiteSpace: 'nowrap',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            animation: 'gsFadeIn 0.2s ease-out'
                          }}
                        >
                          <AlertCircle size={14} style={{ color: '#ef4444' }} />
                          <span style={{ color: '#0f172a' }}>You can only add one link</span>
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              right: '24px',
                              width: 0,
                              height: 0,
                              borderLeft: '5px solid transparent',
                              borderRight: '5px solid transparent',
                              borderTop: '5px solid #ffffff'
                            }}
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleAddFooterLink}
                        title={footerLinks.length >= 1 ? 'You can only add one link' : 'Add custom footer link'}
                        className="shell-btn-primary shell-btn-sm"
                      >
                        + ADD LINK
                      </button>
                    </div>
                  </div>

                  {footerLinks.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {footerLinks.map((entry, i) => {
                        const m = entry.match(/^(.*?)\s*\((.*?)\)$/);
                        const label = m ? m[1] : entry;
                        const url = m ? m[2] : '';
                        const isUrlInvalid = url.trim() !== '' && !isValidUrl(url);
                        const write = (l: string, u: string) => {
                          const next = [...footerLinks];
                          next[i] = `${l} (${u})`;
                          setFooterLinks(next);
                        };
                        return (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <TextField
                                label="Link Label"
                                className="gs-link-label"
                                value={label}
                                maxLength={30}
                                title="Link label (up to 30 characters)"
                                onChange={(e) => write(e.target.value, url)}
                              />
                              <TextField
                                label="Link URL"
                                className="gs-link-url"
                                value={url}
                                maxLength={255}
                                placeholder="https://example.com"
                                title="Link URL (up to 255 characters)"
                                error={isUrlInvalid ? 'Please enter a valid URL (e.g. https://example.com)' : undefined}
                                onChange={(e) => write(label, e.target.value)}
                              />
                              <button
                                type="button"
                                title="Remove link"
                                onClick={() => {
                                  setFooterLinks(footerLinks.filter((_, x) => x !== i));
                                  setLinkLimitPopup(false);
                                }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: '4px' }}
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '14px' }}>
                    <span style={{ ...bodyTextStyle, display: 'inline-flex', alignItems: 'center' }}>Footer Visibility <InfoTooltip text="Toggle whether footer bar is displayed at bottom of screen." /></span>
                    <AppleToggle checked={footerVisible} onChange={setFooterVisible} />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Sidebar Config Panel */}
          {activeTab === 'sidebar' && (
            <div className="gs-tab-content-container">
              <div className="gs-cards-2x2">
                
                {/* Behavior Card — rows are direct children of .gs-config-card (not wrapped
                    in an inner flex div) so its `justify-content: space-between` spreads
                    slack evenly across every row instead of dumping it all into one gap
                    after the title (which is what a 2-child title+wrapper split does). */}
                <div className="gs-config-card gs-config-card--stack">
                  <div className="gs-card-header" style={{ ...headingStyle(4), display: 'inline-flex', alignItems: 'center' }}>
                    <span className="brand-gradient-text">Sidebar Behavior</span> <InfoTooltip text="Configure auto-collapse, auto-hide, and item visibility preferences for navigation sidebar." />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ ...bodyTextStyle, display: 'inline-flex', alignItems: 'center' }}>Choose color <InfoTooltip text="Custom background colour for the navigation sidebar." /></span>
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
                        <button
                          type="button"
                          className="gs-swatch-btn"
                          title="Choose sidebar color"
                          aria-label="Choose sidebar color"
                          style={{ ['--swatch' as string]: sidebarBg || '#ffffff' }}
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
                    <span style={{ ...bodyTextStyle, display: 'inline-flex', alignItems: 'center' }}>Start Expanded <InfoTooltip text="Choose whether sidebar initializes in expanded mode when app loads." /></span>
                    <AppleToggle checked={startExpanded} onChange={setStartExpanded} />
                  </div>
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ ...bodyTextStyle, display: 'inline-flex', alignItems: 'center' }}>Auto Hide Sidebar <InfoTooltip text="Automatically collapse sidebar when not in active use." /></span>
                    <AppleToggle checked={autoHideSidebar} onChange={setAutoHideSidebar} />
                  </div>
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ ...bodyTextStyle, display: 'inline-flex', alignItems: 'center' }}>Show Icons <InfoTooltip position="above" text="Display navigation item icons in sidebar." /></span>
                    <AppleToggle checked={showIcons} onChange={setShowIcons} />
                  </div>
                </div>

                {/* Width Configuration Card — same flattening as the Behavior card above. */}
                <div className="gs-config-card gs-config-card--stack">
                  <div className="gs-card-header" style={{ ...headingStyle(4), display: 'inline-flex', alignItems: 'center' }}>
                    <span className="brand-gradient-text">Sidebar Dimensions</span> <InfoTooltip text="Adjust custom pixel widths for expanded and collapsed sidebar states." position="below-right" />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-body-sm, 14px)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>Expanded Width <InfoTooltip text="Set width (in pixels) of sidebar when fully expanded." /></span>
                      <span style={{ fontWeight: 'var(--font-weight-strong, 600)' }}>{expandedWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min="180"
                      max="300"
                      value={expandedWidth}
                      onChange={e => {
                        setExpandedWidth(Number(e.target.value));
                        setStartExpanded(true);
                      }}
                      onInput={e => {
                        setExpandedWidth(Number((e.target as HTMLInputElement).value));
                        setStartExpanded(true);
                      }}
                      onMouseDown={() => setStartExpanded(true)}
                      onTouchStart={() => setStartExpanded(true)}
                      style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                  </div>

                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }} />

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-body-sm, 14px)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>Collapsed Width <InfoTooltip text="Set width (in pixels) of sidebar when in minimal collapsed mode." /></span>
                      <span style={{ fontWeight: 'var(--font-weight-strong, 600)' }}>{collapsedWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="90"
                      value={collapsedWidth}
                      onChange={e => {
                        setCollapsedWidth(Number(e.target.value));
                        setStartExpanded(false);
                      }}
                      onInput={e => {
                        setCollapsedWidth(Number((e.target as HTMLInputElement).value));
                        setStartExpanded(false);
                      }}
                      onMouseDown={() => setStartExpanded(false)}
                      onTouchStart={() => setStartExpanded(false)}
                      style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Customer Profile Config Panel */}
          {activeTab === 'profile' && (
            <div className="gs-tab-content-container">
              <div className="gs-cards-2x2">
                
                {/* Left Card: Customer Logo */}
                <div className="gs-config-card">
                  <div className="gs-card-header" style={{ ...headingStyle(4), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}><span className="brand-gradient-text">Customer Logo</span> <InfoTooltip text="Upload or crop customer profile logo image." /></span>
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
                      <span style={{ ...headingStyle(6, 'secondary') }}>Choose customer logo</span>
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
                          <img src={customerLogo} alt="Uploaded Preview" style={{ maxHeight: '32px', maxWidth: '64px', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 'calc(var(--radius-unit, 1px) * 4)' }} />
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
                    <span style={{ ...bodyTextStyle, display: 'inline-flex', alignItems: 'center' }}>Show Customer Logo <InfoTooltip text="Toggle whether customer profile logo is displayed." /></span>
                    <AppleToggle checked={showCustomerLogo} onChange={setShowCustomerLogo} />
                  </div>
                </div>

                {/* Right Card: Customer Profile Visibility */}
                <div className="gs-config-card">
                  <div className="gs-card-header" style={{ ...headingStyle(4), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}><span className="brand-gradient-text">Customer Profile</span> <InfoTooltip text="Manage visibility, typography styles, and color follow settings for customer profile." position="below-right" /></span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
                    {/* Row 1: Customer Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>
                        <TextField label="Customer Name" value={customerName} style={{ fontWeight: Number(customerNameWeight) }} onChange={e => setCustomerName(e.target.value)} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                        <Dropdown variant="pill" width="58px" value={customerNameStyle} onChange={setCustomerNameStyle} options={GS_STYLE_OPTIONS} title="Heading level" />

                        <Dropdown variant="pill" width="64px" value={customerNameWeight} onChange={setCustomerNameWeight} options={GS_WEIGHT_OPTIONS} title="Font weight" editable />

                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            className="gs-swatch-btn"
                            title="Choose colour"
                            aria-label="Choose colour"
                            style={{ ['--swatch' as string]: customerNameColor ? customerNameColor : '#ffffff' }}
                            onClick={() => document.getElementById('gs-color-picker-customer-name')?.click()}
                          />
                          <input
                            id="gs-color-picker-customer-name"
                            type="color"
                            value={customerNameColor || '#ffffff'}
                            onChange={(e) => { setCustomerNameColor(e.target.value); setCustomerColorFollow(false); }}
                            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
                          />
                        </div>

                        <AppleToggle checked={showCustomerProfile} onChange={setShowCustomerProfile} />
                      </div>
                    </div>

                    {/* Row 2: Customer Caption (Matching User Screenshot 1:1) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>
                        <TextField label="Customer Caption" value={customerCaption} style={{ fontWeight: Number(customerCaptionWeight) }} onChange={e => setCustomerCaption(e.target.value)} placeholder="Digital Twin Solutions" />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                        <Dropdown variant="pill" width="58px" value={customerCaptionStyle} onChange={setCustomerCaptionStyle} options={GS_STYLE_OPTIONS} title="Heading level" />

                        <Dropdown variant="pill" width="64px" value={customerCaptionWeight} onChange={setCustomerCaptionWeight} options={GS_WEIGHT_OPTIONS} title="Font weight" editable />

                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            className="gs-swatch-btn"
                            title="Choose colour"
                            aria-label="Choose colour"
                            style={{ ['--swatch' as string]: customerCaptionColor ? customerCaptionColor : 'rgba(255, 255, 255, 0.65)' }}
                            onClick={() => document.getElementById('gs-color-picker-customer-caption')?.click()}
                          />
                          <input
                            id="gs-color-picker-customer-caption"
                            type="color"
                            value={customerCaptionColor.startsWith('rgba') ? '#a0aec0' : customerCaptionColor}
                            onChange={(e) => { setCustomerCaptionColor(e.target.value); setCustomerColorFollow(false); }}
                            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
                          />
                        </div>

                        <AppleToggle checked={showCustomerCaption} onChange={setShowCustomerCaption} />
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ ...bodyTextStyle, display: 'inline-flex', alignItems: 'center' }}>Text Color matches theme <InfoTooltip position="above" text="When on, customer name and caption follow the theme text colour and the colour swatches are ignored." /></span>
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
