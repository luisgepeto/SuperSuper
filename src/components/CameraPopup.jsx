import { Scanner } from '@yudiel/react-qr-scanner';
import { CloseIcon } from './ui/Icons';

const CameraPopup = ({ onClose, onScan, onError }) => {
  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const barcode = detectedCodes[0].rawValue;
      if (onScan) {
        onScan(barcode);
      }
    }
  };

  const handleError = (error) => {
    console.error('Scanner error:', error);
    if (onError) {
      onError(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 safe-area-top">
        <h2 className="text-white text-lg font-semibold">Scan Barcode</h2>
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-smooth"
          aria-label="Close scanner"
        >
          <CloseIcon size={24} className="text-white" />
        </button>
      </div>

      {/* Scanner View */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl">
          <Scanner
            onScan={handleScan}
            onError={handleError}
            constraints={{
              advanced: [{ zoom: 3 }]
            }}
            formats={['qr_code', 'ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e']}
            components={{
              audio: false,
              onOff: false,
              torch: false,
              zoom: true,
              finder: true
            }}
            styles={{
              container: {
                width: '100%',
                height: '100%',
              },
            }}
          />
          
          {/* Corner Guides */}
          <div className="absolute inset-8 pointer-events-none">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/80 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/80 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/80 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/80 rounded-br-lg" />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex-shrink-0 text-center px-6 pb-8 safe-area-bottom">
        <p className="text-white/80 text-sm">
          Position the barcode within the frame
        </p>
        <button
          onClick={onClose}
          className="mt-4 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-smooth"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CameraPopup;
