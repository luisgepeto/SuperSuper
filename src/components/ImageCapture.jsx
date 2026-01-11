import { useRef, useEffect } from 'react';
import { CloseIcon, CameraIcon } from './ui/Icons';
import { compressImage, captureFromVideo } from '../utils/imageUtils';
import { useMediaStream } from '../hooks/useMediaStream';

const ImageCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const { stream, isReady, error, stopStream } = useMediaStream({
    video: {
      facingMode: 'environment',
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
    audio: false,
  });

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleCapture = async () => {
    if (!videoRef.current || !isReady) return;

    try {
      const rawImage = captureFromVideo(videoRef.current);
      const compressedImage = await compressImage(rawImage, 200, 200, 0.7);
      
      stopStream();
      
      if (onCapture) {
        onCapture(compressedImage);
      }
    } catch (err) {
      console.error('Capture error:', err);
    }
  };

  const handleClose = () => {
    stopStream();
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[70] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 safe-area-top">
        <h2 className="text-white text-lg font-semibold">Take Photo</h2>
        <button
          onClick={handleClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-smooth"
          aria-label="Close camera"
        >
          <CloseIcon size={24} className="text-white" />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 flex items-center justify-center p-4">
        {error ? (
          <div className="text-white text-center p-4">
            <p className="mb-4">{error}</p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-white/20 rounded-xl text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-sm aspect-square bg-black rounded-2xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onCanPlay={() => {}}
              className="w-full h-full object-cover"
            />
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white">Starting camera...</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Capture Button */}
      {!error && (
        <div className="flex-shrink-0 flex justify-center pb-8 safe-area-bottom">
          <button
            onClick={handleCapture}
            disabled={!isReady}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-warm-100 active:scale-95 transition-all"
            aria-label="Capture photo"
          >
            <CameraIcon size={28} className="text-warm-800" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageCapture;
