import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function SwapPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isNSFW, setIsNSFW] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('isNSFW', isNSFW.toString());

      const axiosInstance = api.getInstance();
      const response = await axiosInstance.post('/swaps/queue', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Navigate to swap chat with swap ID
      navigate(`/swap/${response.data.swapId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload photo');
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            PixSwap
          </h1>
          <p className="text-xl text-gray-300 font-light">
            Share a photo, match with someone random, chat instantly
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12">
          {/* NSFW Toggle - Prominent at top */}
          <div className="mb-8 p-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl border border-orange-500/30">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">NSFW Content Filter</h3>
                  <button
                    onClick={() => setIsNSFW(!isNSFW)}
                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 ${
                      isNSFW 
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/50' 
                        : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
                        isNSFW ? 'translate-x-9' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  <span className="font-medium text-orange-300">
                    {isNSFW ? '⚠️ NSFW Mode Active' : '✓ Safe Mode Active'}
                  </span>
                  <br />
                  {isNSFW 
                    ? 'You will only be matched with other users who have NSFW mode enabled. Must be 18+.'
                    : 'You will only be matched with safe-for-work content.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="space-y-6">
            {!preview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-purple-400/50 hover:border-purple-400 rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 bg-gradient-to-br from-purple-500/5 to-pink-500/5 hover:from-purple-500/10 hover:to-pink-500/10"
              >
                <div className="transform group-hover:scale-105 transition-transform duration-300">
                  <Camera className="w-20 h-20 mx-auto mb-6 text-purple-400" />
                  <p className="text-2xl font-semibold text-white mb-3">Choose a photo</p>
                  <p className="text-gray-400">
                    Click to select an image • Max 10MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black/20">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70"
                >
                  Change Photo
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile || isUploading}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300"
              size="lg"
            >
              {isUploading ? (
                <>
                  <div className="loading-spinner mr-3" />
                  Finding your match...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-3" />
                  Swap Photo
                </>
              )}
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              By using PixSwap, you confirm you're 18+ if using NSFW mode and agree to our community guidelines.
              <br />
              All chats are temporary and photos are automatically deleted after 24 hours.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-400">
            Anonymous • Temporary • Random
          </p>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}