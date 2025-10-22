import React, { useState } from 'react';
import { EyeOff, Eye } from 'lucide-react';

interface NSFWToggleProps {
  isNSFW: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}

const NSFWToggle: React.FC<NSFWToggleProps> = ({ isNSFW, onChange, className = '' }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingValue, setPendingValue] = useState(false);

  const handleToggle = (value: boolean) => {
    setPendingValue(value);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    onChange(pendingValue);
    setShowConfirmation(false);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={() => handleToggle(!isNSFW)}
          className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isNSFW
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
          title={isNSFW ? 'NSFW Mode Active' : 'SFW Mode Active'}
        >
          {isNSFW ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span className="hidden sm:inline">NSFW</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">SFW</span>
            </>
          )}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              {pendingValue ? (
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <EyeOff className="w-6 h-6 text-red-600" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {pendingValue ? 'Enable NSFW Content?' : 'Disable NSFW Content?'}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {pendingValue ? (
                    <>
                      You are about to enable <strong>NSFW (Not Safe For Work)</strong> content.
                      This may include mature, explicit, or adult content.
                      <br /><br />
                      <strong>By continuing, you confirm:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>You are at least 18 years of age</li>
                        <li>You consent to viewing adult content</li>
                        <li>This complies with your local laws</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      You are switching to <strong>SFW (Safe For Work)</strong> mode.
                      You will only see content that has been marked as safe for work.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  pendingValue
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {pendingValue ? 'Enable NSFW' : 'Switch to SFW'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NSFWToggle;
