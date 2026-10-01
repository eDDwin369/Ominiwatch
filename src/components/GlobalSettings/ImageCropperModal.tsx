import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Crop, X } from 'lucide-react';

export interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (croppedDataUrl: string) => void;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  cropShape?: 'round' | 'rect';
  cropWidth?: number;
  cropHeight?: number;
}

export function ImageCropperModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  imageUrl,
  title = "Adjust image",
  subtitle = "Drag and zoom to fit your picture inside the bright frame. Anything in the dimmed area is cropped out.",
  cropShape = "round",
  cropWidth = 180,
  cropHeight = 180
}: ImageCropperModalProps) {
  const [zoomLevel, setZoomLevel] = useState(0); // -100 to 100
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset state when a new image is loaded
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleConfirm = () => {
    if (!imageRef.current || !containerRef.current) return;
    
    // Crop box dimensions
    const cWidth = cropWidth;
    const cHeight = cropHeight;

    // Support crisp rendering on high-DPI displays
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(cWidth * dpr);
    canvas.height = Math.round(cHeight * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Scale factor based on zoom slider (-100 to 100) -> 0.25x to 4x
    const scale = Math.pow(2, zoomLevel / 50);
    
    // Original image intrinsic dimensions
    const imgWidth = imageRef.current.naturalWidth || 1;
    const imgHeight = imageRef.current.naturalHeight || 1;
    
    // In CSS, <img style="max-width: 100%; max-height: 100%; object-fit: contain;"> never upscales
    // an image smaller than its container. Thus baseScale must not exceed 1.
    const containerWidth = containerRef.current.clientWidth || cWidth;
    const containerHeight = containerRef.current.clientHeight || cHeight;
    
    const scaleX = containerWidth / imgWidth;
    const scaleY = containerHeight / imgHeight;
    const baseScale = Math.min(1, scaleX, scaleY);
    
    // imageRef.current.clientWidth/clientHeight give the browser's exact rendered layout box
    const renderedWidth = imageRef.current.clientWidth || (imgWidth * baseScale);
    const renderedHeight = imageRef.current.clientHeight || (imgHeight * baseScale);
    
    // Center of crop box
    ctx.translate(cWidth / 2, cHeight / 2);

    if (cropShape === 'round') {
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(cWidth, cHeight) / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    // Apply zoom and user pan matching CSS transformOrigin 'center center'
    ctx.scale(scale, scale);
    ctx.translate(position.x / scale, position.y / scale);
    
    // Draw the image centered relative to the crop box center
    const drawX = -renderedWidth / 2;
    const drawY = -renderedHeight / 2;
    
    ctx.drawImage(
      imageRef.current,
      drawX,
      drawY,
      renderedWidth,
      renderedHeight
    );

    const dataUrl = canvas.toDataURL('image/png');
    onConfirm(dataUrl);
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="gs-cropper" role="dialog" aria-modal="true" aria-labelledby="gs-cropper-title">
        {/* Header — same dialog standard: icon circle + H4 title in primary, soft-red close */}
        <div className="gs-cropper-header">
          <div className="page-title-group">
            <span className="page-title-icon" aria-hidden="true"><Crop size={18} /></span>
            <h2 id="gs-cropper-title" className="gs-cropper-title brand-gradient-text">{title}</h2>
          </div>
          <button type="button" className="gs-cropper-close" onClick={onClose} aria-label="Close" title="Close">
            <X size={16} />
          </button>
        </div>
        <p className="gs-cropper-desc">{subtitle}</p>

        {/* Cropper Area */}
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{
            width: '100%',
            height: '240px',
            backgroundColor: 'var(--bg-dashboard)',
            backgroundImage: 'linear-gradient(45deg, var(--border-light) 25%, transparent 25%), linear-gradient(-45deg, var(--border-light) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--border-light) 75%), linear-gradient(-45deg, transparent 75%, var(--border-light) 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            borderRadius: 'calc(var(--radius-unit, 1px) * 12)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
          }}
        >
          {/* Actual Image */}
          <img 
            ref={imageRef}
            src={imageUrl} 
            alt="Upload Preview" 
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            draggable={false}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transform: `scale(${Math.pow(2, zoomLevel / 50)}) translate(${position.x / Math.pow(2, zoomLevel / 50)}px, ${position.y / Math.pow(2, zoomLevel / 50)}px)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.05s ease-out',
              pointerEvents: 'auto'
            }} 
          />
          
          {/* Dimmed Area overlay (bright frame cutout) */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${cropWidth}px`,
            height: `${cropHeight}px`,
            borderRadius: cropShape === 'round' ? '50%' : '6px',
            border: '2px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
            pointerEvents: 'none'
          }} />
        </div>

        {/* Zoom Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
          <span className="gs-cropper-label">Zoom</span>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            value={zoomLevel} 
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer' }}
          />
        </div>

        {/* Buttons — same pills as Global Settings' Cancel / Save prompt */}
        <div className="gs-confirm-actions gs-cropper-actions">
          <button type="button" onClick={onClose} className="gs-confirm-btn">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} className="gs-confirm-btn gs-top-btn-save">
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
