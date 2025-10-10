import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

const BarcodeScanner = ({ onScan, onClose, onError }) => {
  const videoRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const codeReader = useRef(null);
  const scanningRef = useRef(false);
  const streamRef = useRef(null);
  const initializingRef = useRef(false);

  const addLog = (message) => {
    console.log(message);
  };

  useEffect(() => {
    let mounted = true;
    let initializationTimeout = null;
    
    const initializeScanner = async () => {
      // Prevent multiple simultaneous initializations
      if (!mounted || initializingRef.current || scanningRef.current) {
        addLog('Initialization skipped - already in progress or unmounted');
        return;
      }
      
      initializingRef.current = true;
      addLog('Initializing scanner...');
      
      // Add small delay to handle React StrictMode double execution
      initializationTimeout = setTimeout(async () => {
        if (!mounted || !initializingRef.current) {
          addLog('Initialization cancelled - component unmounted');
          return;
        }
        
        try {
          codeReader.current = new BrowserMultiFormatReader();
          await startScanning();
        } catch (err) {
          addLog(`Failed to initialize scanner: ${err.message}`);
          if (mounted) {
            setError('Failed to initialize camera scanner');
          }
        } finally {
          if (mounted) {
            initializingRef.current = false;
          }
        }
      }, 50); // Small delay to handle React StrictMode
    };

    initializeScanner();

    // Cleanup only when component unmounts
    return () => {
      mounted = false;
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
      initializingRef.current = false;
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (scanningRef.current) {
      addLog('Already scanning, skipping...');
      return;
    }

    try {
      addLog('Starting camera scan...');
      scanningRef.current = true;
      setIsScanning(true);
      setError('');
      
      // Get video constraints for back camera (better for barcode scanning)
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      addLog('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        addLog('Video stream assigned to video element');
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          const handleMetadata = () => {
            addLog('Video metadata loaded');
            videoRef.current.removeEventListener('loadedmetadata', handleMetadata);
            resolve();
          };
          videoRef.current.addEventListener('loadedmetadata', handleMetadata);
        });
        
        // Give a small delay to ensure video is playing
        setTimeout(() => {
          if (scanningRef.current && codeReader.current && videoRef.current) {
            addLog('Starting ZXing decoder...');
            
            // Start decoding from video stream
            codeReader.current.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
              if (!scanningRef.current) return; // Stop if scanning was cancelled
              
              if (result) {
                // Successfully scanned a barcode
                addLog(`Barcode found: ${result.getText()}`);
                scanningRef.current = false; // Stop scanning
                onScan(result.getText());
              }
              if (err && !(err instanceof NotFoundException)) {
                addLog(`Scanning error: ${err.message}`);
              }
            });
          }
        }, 500);
      }

    } catch (error) {
      addLog(`Camera access error: ${error.message}`);
      scanningRef.current = false;
      initializingRef.current = false;
      let errorMessage = 'Unable to access camera. Please check permissions.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported on this device.';
      }
      
      setError(errorMessage);
      setIsScanning(false);
      if (onError) onError(error);
    }
  };

  const stopScanning = () => {
    addLog('Stopping scanner...');
    scanningRef.current = false;
    initializingRef.current = false;
    setIsScanning(false);
    
    // Stop the camera stream
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        addLog(`Stopping track: ${track.kind}`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Reset the code reader
    if (codeReader.current) {
      try {
        codeReader.current.reset();
        addLog('Code reader reset');
      } catch (err) {
        addLog(`Error resetting code reader: ${err.message}`);
      }
    }
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black bg-opacity-50">
        <h2 className="text-white text-lg font-semibold">Scan Barcode</h2>
        <button
          onClick={handleClose}
          className="text-white text-2xl font-bold hover:text-gray-300"
        >
          ×
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 flex items-center justify-center relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        
        {/* Scanner overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white border-dashed rounded-lg"></div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-white text-lg mb-2">
            Align barcode within the frame
          </p>
          {isScanning && (
            <p className="text-green-400 text-sm">
              📷 Scanning...
            </p>
          )}
          {error && (
            <p className="text-red-400 text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black bg-opacity-70 flex justify-center" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <button
          onClick={handleClose}
          className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-lg min-w-32"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;