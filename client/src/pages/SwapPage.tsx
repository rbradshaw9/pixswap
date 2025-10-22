import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Upload, AlertCircle, Shield, Sparkles, Users, MessageCircle, Image as ImageIcon, ArrowRight, CheckCircle, ScanEye, Zap, LogIn, UserPlus, FolderOpen, LogOut } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import * as nsfwjs from 'nsfwjs';
import imageCompression from 'browser-image-compression';

export default function SwapPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isAuthenticated, logout } = useAuthStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [fileType, setFileType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [isNSFW, setIsNSFW] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [nsfwModel, setNsfwModel] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nsfwDetected, setNsfwDetected] = useState(false);
  const [nsfwPredictions, setNsfwPredictions] = useState<any>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [debugMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === 'true';
  });

  // Load NSFW model on mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('Loading NSFW detection model...');
        const model = await nsfwjs.load();
        setNsfwModel(model);
        console.log('NSFW model loaded successfully');
      } catch (err) {
        console.error('Failed to load NSFW model:', err);
      }
    };
    loadModel();
  }, []);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Extract frame from video for NSFW analysis
  const extractVideoFrame = async (videoFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        // Seek to 10% into the video for analysis
        video.currentTime = Math.min(video.duration * 0.1, 5);
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx?.drawImage(video, 0, 0);
        
        const frameData = canvas.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(video.src);
        resolve(frameData);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(videoFile);
    });
  };

  const analyzeImage = async (imageSrc: string) => {
    if (debugMode) console.log('[DEBUG] analyzeImage called');
    
    // Skip analysis if NSFW mode is enabled (user explicitly wants NSFW)
    if (isNSFW) {
      if (debugMode) console.log('[DEBUG] NSFW mode enabled, skipping detection');
      setNsfwDetected(false);
      setError('');
      return;
    }
    
    if (!nsfwModel) {
      if (debugMode) console.log('[DEBUG] No NSFW model loaded yet');
      return;
    }

    setIsAnalyzing(true);
    try {
      const img = new Image();
      img.src = imageSrc;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const predictions = await nsfwModel.classify(img);
      setNsfwPredictions(predictions);
      
      if (debugMode) console.log('[DEBUG] NSFW predictions:', predictions);
      
      // Check for NSFW content with 0.4 threshold for better detection
      // Checks: Porn, Hentai, Sexy (exposed body parts, suggestive poses)
      const nsfwContent = predictions.find((p: any) => 
        (p.className === 'Porn' || p.className === 'Hentai' || p.className === 'Sexy') && p.probability > 0.4
      );

      if (nsfwContent) {
        console.log('🔞 NSFW content detected:', nsfwContent);
        setNsfwDetected(true);
        setError(`NSFW content detected (${nsfwContent.className}: ${Math.round(nsfwContent.probability * 100)}%). Please enable NSFW mode to upload this content.`);
      } else {
        console.log('✅ Content passed NSFW check');
        setNsfwDetected(false);
        setError('');
      }
    } catch (err) {
      console.error('Failed to analyze image:', err);
      // Don't block upload on analysis error
      setNsfwDetected(false);
      setError('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (debugMode) console.log('[DEBUG] File selected:', { name: file.name, size: file.size, type: file.type });

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      setError('Please select an image or video file');
      return;
    }

    setError('');
    setNsfwDetected(false);
    setIsCompressing(true);
    setCompressionProgress(0);

    try {
      let processedFile = file;

      if (isVideo) {
        // Check video duration
        const videoDuration = await new Promise<number>((resolve, reject) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          
          video.onloadedmetadata = function() {
            window.URL.revokeObjectURL(video.src);
            resolve(video.duration);
          };
          
          video.onerror = () => {
            window.URL.revokeObjectURL(video.src);
            reject(new Error('Failed to load video'));
          };
          
          video.src = URL.createObjectURL(file);
        });

        if (videoDuration > 120) {
          setError('Video must be less than 2 minutes');
          setIsCompressing(false);
          return;
        }

        // Extract frame and analyze for NSFW
        setCompressionProgress(30);
        try {
          const frameData = await extractVideoFrame(file);
          await analyzeImage(frameData);
        } catch (err) {
          console.warn('Could not analyze video frame:', err);
        }

        // Check video size (100MB limit)
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 100) {
          setError(`Video is too large (${sizeMB.toFixed(1)}MB). Please select a video under 100MB. Try reducing quality or duration.`);
          setIsCompressing(false);
          return;
        }
        
        console.log(`📹 Video accepted: ${sizeMB.toFixed(1)}MB, ${videoDuration.toFixed(1)}s`);

        setCompressionProgress(100);
      } else if (isImage) {
        // Compress image
        setCompressionProgress(20);
        
        if (debugMode) console.log('[DEBUG] Starting image compression', { originalSize: file.size });
        
        const options = {
          maxSizeMB: 2.0, // 2MB max for better quality
          maxWidthOrHeight: 2048, // Max dimension
          useWebWorker: true,
          maxIteration: 10, // Limit iterations
          onProgress: (progress: number) => {
            if (debugMode) console.log('[DEBUG] Compression progress:', progress);
            setCompressionProgress(20 + progress * 0.6); // 20-80%
          },
        };

        try {
          processedFile = await imageCompression(file, options);
          if (debugMode) console.log('[DEBUG] Compression complete', { newSize: processedFile.size });
          setCompressionProgress(80);
        } catch (compressionErr) {
          console.error('[DEBUG] Compression failed, using original file:', compressionErr);
          // If compression fails, use original file if it's under 5MB
          if (file.size > 5 * 1024 * 1024) {
            setError('Image is too large and compression failed. Please select a smaller image.');
            setIsCompressing(false);
            return;
          }
          processedFile = file;
          setCompressionProgress(80);
        }

        // Analyze compressed image
        const reader = new FileReader();
        const imageData = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(processedFile);
        });

        await analyzeImage(imageData);
        setCompressionProgress(100);
      }

      setSelectedFile(processedFile);
      setFileType(isVideo ? 'video' : 'image');

      // Create preview (use blob URL for videos to avoid memory issues)
      if (isVideo) {
        // Revoke previous blob URL if it exists
        if (preview && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
        setPreview(URL.createObjectURL(processedFile));
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(processedFile);
      }

    } catch (err: any) {
      console.error('File processing error:', err);
      setError(err.message || 'Failed to process file');
    } finally {
      setIsCompressing(false);
      setCompressionProgress(0);
    }
  };

  const handleSubmit = async () => {
    console.log('📤 handleSubmit called:', { 
      hasFile: !!selectedFile,
      fileName: selectedFile?.name, 
      isNSFW,
      caption: caption.substring(0, 50),
      nsfwDetected 
    });
    
    if (!selectedFile) {
      console.log('❌ No file selected');
      return;
    }

    // Block upload if NSFW detected and filter not enabled
    if (nsfwDetected && !isNSFW) {
      console.log('❌ NSFW detected but mode not enabled');
      setError('Please enable NSFW mode to upload this image, or choose a different photo.');
      return;
    }

    setIsUploading(true);
    setError('');
    
    if (debugMode) console.log('[DEBUG] Starting upload...');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('isNSFW', isNSFW.toString());
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      const axiosInstance = api.getInstance();
      const baseURL = axiosInstance.defaults.baseURL;
      if (debugMode) console.log('[DEBUG] API baseURL:', baseURL);
      if (debugMode) console.log('[DEBUG] Posting to: /swap/queue');
      
      const response = await axiosInstance.post('/swap/queue', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Upload response:', {
        success: response.data.success,
        hasContent: !!response.data.content,
        contentId: response.data.content?.id,
        isNSFW: response.data.content?.isNSFW,
        caption: response.data.content?.caption?.substring(0, 30),
      });

      if (response.data.success && response.data.content) {
        console.log('➡️ Navigating to view page');
        // Got content, navigate to view page
        const contentParam = encodeURIComponent(JSON.stringify(response.data.content));
        navigate(`/view?content=${contentParam}`);
      } else if (!response.data.success && response.data.isEmpty) {
        // Empty pool - show encouraging message
        setError(response.data.message || 'No content available yet. Be the first to share!');
        setIsUploading(false);
        // Clear file selection to allow new upload
        setSelectedFile(null);
        setPreview('');
      } else {
        if (debugMode) console.log('[DEBUG] Unexpected response format');
        // Handle unexpected response
        console.warn('Unexpected response format:', response.data);
        setError(response.data.message || 'Upload succeeded but no content received. Please try again.');
        setIsUploading(false);
      }
    } catch (err: any) {
      console.error('[DEBUG] Upload failed:', err);
      if (debugMode) {
        console.log('[DEBUG] Error details:', {
          message: err.message,
          response: err.response,
          status: err.response?.status,
          data: err.response?.data
        });
      }
      
      // Handle rate limiting
      if (err.response?.status === 429) {
        const retryAfter = err.response?.data?.retryAfter;
        const minutes = retryAfter ? Math.ceil((retryAfter - Date.now() / 1000) / 60) : 15;
        setError(`You're uploading too quickly! Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`);
      } else {
        setError(err.response?.data?.message || 'Failed to upload photo');
      }
      setIsUploading(false);
    }
  };

  // Re-analyze when NSFW toggle changes
  useEffect(() => {
    if (preview) {
      analyzeImage(preview);
    }
    
    // Save NSFW preference to user account if authenticated
    if (isAuthenticated) {
      api.patch('/user/nsfw-preference', { nsfwEnabled: isNSFW }).catch(err => {
        console.warn('Failed to save NSFW preference:', err);
      });
    }
  }, [isNSFW, isAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      <NavBar variant="transparent" />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
            Share. Match. Connect.
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
            Upload a photo, get instantly matched with someone random, and start a conversation about your shared images.
          </p>
        </div>

        {/* How It Works */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/50">
              <ImageIcon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">1. Upload Your Photo</h3>
            <p className="text-gray-300 leading-relaxed">
              Choose any image from your device. Set your content preference and privacy settings.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/50">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">2. Get Matched</h3>
            <p className="text-gray-300 leading-relaxed">
              We instantly pair you with another user based on your preferences and availability.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/50">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">3. Chat & Share</h3>
            <p className="text-gray-300 leading-relaxed">
              See both photos side-by-side and chat in real-time. Share more photos or start a new swap anytime.
            </p>
          </div>
        </div>

        {/* Main Upload Section */}
        <div className="max-w-4xl mx-auto">
          {/* Content Filter Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-xl rounded-3xl border border-orange-500/20 overflow-hidden">
              <div className="p-8">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Content Filter</h3>
                        <p className="text-gray-300 text-sm">
                          Choose your content preference for matching
                        </p>
                      </div>
                      
                      <button
                        onClick={() => setIsNSFW(!isNSFW)}
                        className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-300 shadow-lg ${
                          isNSFW 
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-orange-500/50' 
                            : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                      >
                        <span
                          className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform duration-300 shadow-xl ${
                            isNSFW ? 'translate-x-11' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="bg-black/20 rounded-xl p-6 border border-white/10">
                      {isNSFW ? (
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-orange-300 font-semibold mb-2">⚠️ NSFW Mode Active</p>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              You will only be matched with other users who have NSFW mode enabled. 
                              By proceeding, you confirm you are 18 years or older and understand this content may be explicit.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-green-300 font-semibold mb-2">✓ Safe Mode Active</p>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              You will only be matched with safe-for-work content. 
                              All photos are moderated to ensure a family-friendly experience.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Card */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
            <div className="p-8 md:p-12">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">Upload Your Photo</h2>
              
              {!preview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative border-2 border-dashed border-purple-400/30 hover:border-purple-400/60 rounded-3xl p-20 text-center cursor-pointer transition-all duration-500 bg-gradient-to-br from-purple-500/5 to-pink-500/5 hover:from-purple-500/10 hover:to-pink-500/10 overflow-hidden"
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 animate-pulse"></div>
                  </div>
                  
                  <div className="relative transform group-hover:scale-105 transition-transform duration-500">
                    <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/50 group-hover:shadow-purple-500/70 transition-shadow duration-500">
                      <Camera className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-4">Choose a Photo or Video</p>
                    <p className="text-lg text-gray-300 mb-2">
                      Click or drag to upload
                    </p>
                    <p className="text-sm text-gray-400">
                      Images auto-compressed • Videos up to 100MB (2min max)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl">
                  {fileType === 'video' ? (
                    <video
                      src={preview}
                      controls
                      className="w-full h-[500px] object-cover"
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-[500px] object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  
                  <div className="absolute top-6 right-6 flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setPreview('');
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="bg-black/50 backdrop-blur-xl border-white/20 text-white hover:bg-black/70 shadow-lg"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Change
                    </Button>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                      <p className="text-white font-semibold mb-1">Ready to swap</p>
                      <p className="text-gray-300 text-sm">
                        Your {fileType} will be shared with someone random
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {preview && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Caption (Optional)
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a description, story, or context to your photo..."
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-500/20 resize-none transition-all"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    {caption.length}/500 characters
                  </p>
                </div>
              )}

              {isCompressing && (
                <div className="mt-6 p-5 bg-blue-500/10 border border-blue-500/30 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-6 h-6 text-blue-400 animate-pulse" />
                    <p className="font-medium text-blue-200">
                      {fileType === 'video' ? 'Processing video...' : 'Compressing image...'}
                    </p>
                    <span className="ml-auto text-blue-300 font-semibold">{compressionProgress}%</span>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${compressionProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {isAnalyzing && !isCompressing && (
                <div className="mt-6 flex items-center gap-3 p-5 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-blue-200 backdrop-blur-sm">
                  <ScanEye className="w-6 h-6 flex-shrink-0 animate-pulse" />
                  <p className="font-medium">Analyzing content...</p>
                </div>
              )}

              {error && (
                <div className="mt-6 flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 backdrop-blur-sm">
                  <AlertCircle className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{error}</p>
                    {nsfwDetected && (
                      <button
                        onClick={() => setIsNSFW(true)}
                        className="mt-2 text-sm underline hover:text-orange-300 transition-colors"
                      >
                        Enable NSFW mode
                      </button>
                    )}
                  </div>
                </div>
              )}

              {nsfwPredictions && !error && preview && (
                <div className="mt-6 p-4 bg-black/20 border border-white/10 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <p className="text-sm font-medium text-white">Content Analysis Complete</p>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    {nsfwPredictions.map((pred: any) => (
                      <div key={pred.className} className="flex justify-between">
                        <span>{pred.className}:</span>
                        <span className={pred.probability > 0.5 ? 'text-orange-400 font-semibold' : ''}>
                          {(pred.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!selectedFile || isUploading || isAnalyzing || isCompressing || (nsfwDetected && !isNSFW)}
                className="w-full h-16 text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white rounded-2xl shadow-2xl shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 mt-8 group"
                size="lg"
              >
                {isCompressing ? (
                  <>
                    <Zap className="w-6 h-6 mr-3 animate-pulse" />
                    Processing...
                  </>
                ) : isAnalyzing ? (
                  <>
                    <ScanEye className="w-6 h-6 mr-3 animate-pulse" />
                    Analyzing content...
                  </>
                ) : isUploading ? (
                  <>
                    <div className="loading-spinner mr-3" />
                    Finding your match...
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                    Start Swap
                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-8 px-8 py-4 bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 text-gray-300">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium">End-to-End Encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium">100% Anonymous</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium">Auto-Delete 24h</span>
              </div>
            </div>
            
            <p className="mt-6 text-xs text-gray-400 max-w-2xl mx-auto leading-relaxed">
              By using PixSwap, you confirm you're 18+ if using NSFW mode and agree to our community guidelines.
              All chats are temporary and content is automatically deleted after 24 hours for your privacy.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}