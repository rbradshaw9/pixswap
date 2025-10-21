import { useState, useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';

interface ProtectedMediaProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  alt?: string;
  className?: string;
  showWatermark?: boolean;
  username?: string;
}

export default function ProtectedMedia({ 
  mediaUrl, 
  mediaType, 
  alt = 'Content', 
  className = '',
  showWatermark = true,
  username = 'PixSwap'
}: ProtectedMediaProps) {
  const [blobUrl, setBlobUrl] = useState<string>('');
  const mediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch media and convert to blob URL for additional protection
    const loadProtectedMedia = async () => {
      try {
        const response = await fetch(mediaUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        
        // Cleanup blob URL on unmount
        return () => URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to load protected media:', error);
        // Fallback to direct URL
        setBlobUrl(mediaUrl);
      }
    };

    loadProtectedMedia();
  }, [mediaUrl]);

  // Prevent context menu (right-click)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // Prevent drag
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  // Prevent selection
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  if (!blobUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-800/50`}>
        <div className="text-center">
          <Eye className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mediaRef}
      className="relative select-none"
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onMouseDown={handleMouseDown}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {mediaType === 'image' ? (
        <img
          src={blobUrl}
          alt={alt}
          className={className}
          draggable={false}
          onContextMenu={handleContextMenu}
          onDragStart={handleDragStart}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
          }}
        />
      ) : (
        <video
          src={blobUrl}
          className={className}
          controls
          controlsList="nodownload nofullscreen"
          disablePictureInPicture
          onContextMenu={handleContextMenu}
          onDragStart={handleDragStart}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        />
      )}
      
      {/* Invisible overlay to prevent direct interaction */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'transparent',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      />
      
      {/* Watermark */}
      {showWatermark && (
        <>
          {/* Top-left watermark */}
          <div className="absolute top-4 left-4 text-white/30 font-bold text-sm pointer-events-none select-none bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
            PixSwap • {username}
          </div>
          
          {/* Center watermark (semi-transparent) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <div className="text-white/10 font-bold text-6xl md:text-8xl transform rotate-[-30deg]">
              PIXSWAP
            </div>
          </div>
          
          {/* Bottom-right watermark */}
          <div className="absolute bottom-4 right-4 text-white/30 font-bold text-xs pointer-events-none select-none bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
            pixswap.com
          </div>
        </>
      )}
    </div>
  );
}
