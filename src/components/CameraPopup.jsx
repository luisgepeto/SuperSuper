import { Scanner } from '@yudiel/react-qr-scanner';

const CameraPopup = ({ onClose, onScan, onError }) => {
  const handleScan = (detectedCodes) => {
    // detectedCodes is an array of IDetectedBarcode[]
    if (detectedCodes && detectedCodes.length > 0) {
      // Get the first detected code's rawValue
      const barcode = detectedCodes[0].rawValue;
      console.log('CameraPopup: Barcode detected:', barcode);
      if (onScan) {
        onScan(barcode);
      }
    }
  };

  const handleError = (error) => {
    console.error('CameraPopup: Scanner error:', error);
    if (onError) {
      onError(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-zinc-700">
          <h2 className="text-white text-lg font-semibold">Scan Barcode</h2>
          <button
            onClick={onClose}
            className="text-white text-2xl font-bold hover:text-gray-300 leading-none"
            aria-label="Close scanner"
          >
            ×
          </button>
        </div>

        {/* Camera View */}
        <div className="relative aspect-square bg-black overflow-hidden">
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
        </div>

        {/* Footer Controls */}
        <div className="p-4 flex justify-end border-t border-zinc-700">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraPopup;
