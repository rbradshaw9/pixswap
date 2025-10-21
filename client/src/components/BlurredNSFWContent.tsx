import { useState } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface BlurredNSFWContentProps {
  children: React.ReactNode;
  isNSFW: boolean;
  className?: string;
}

export default function BlurredNSFWContent({ children, isNSFW, className = '' }: BlurredNSFWContentProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!isNSFW) {
    // Not NSFW, show directly
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Content with conditional blur */}
      <div className={isRevealed ? '' : 'blur-3xl select-none pointer-events-none'}>
        {children}
      </div>

      {/* Overlay with reveal button */}
      {!isRevealed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center p-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">NSFW Content</h3>
            <p className="text-gray-300 mb-6 max-w-sm mx-auto">
              This content has been marked as Not Safe For Work. Click to reveal.
            </p>
            <button
              onClick={() => setIsRevealed(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl"
            >
              <Eye className="w-5 h-5" />
              Show Content
            </button>
          </div>
        </div>
      )}

      {/* Hide button when revealed */}
      {isRevealed && (
        <button
          onClick={() => setIsRevealed(false)}
          className="absolute top-4 right-4 px-4 py-2 rounded-lg bg-black/70 hover:bg-black/90 text-white text-sm font-medium transition-all flex items-center gap-2 backdrop-blur-sm border border-white/20"
        >
          <EyeOff className="w-4 h-4" />
          Hide
        </button>
      )}
    </div>
  );
}
