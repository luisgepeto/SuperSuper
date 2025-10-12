import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FloatingActionButton from '../components/FloatingActionButton';
import CameraIcon from '../components/CameraIcon';
import CameraPopup from '../components/CameraPopup';

const Trip = () => {
    const [searchParams] = useSearchParams();
    const tripId = searchParams.get('tripId');
    const [isScanning, setIsScanning] = useState(false);
    const [scannedItems, setScannedItems] = useState([]);

    // Get current date in MM/DD/YY format
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
    });

    const handleScanItem = () => {
        console.log('Camera button clicked - opening scanner');
        setIsScanning(true);
    };

    const handleBarcodeScanned = (barcode) => {
        console.log('Trip: Barcode scanned:', barcode);
        
        // Add the scanned barcode to our items list
        const newItem = {
            id: Date.now(),
            barcode: barcode,
            timestamp: new Date().toLocaleString()
        };
        
        setScannedItems(prev => [...prev, newItem]);
        
        // Close scanner after successful scan
        console.log('Trip: Closing scanner after successful scan');
        setIsScanning(false);
        
        // You can add more logic here like:
        // - Look up product information from a database
        // - Show product details modal
        // - Add to shopping list
    };

    const handleScanClose = () => {
        console.log('Trip: User manually closed scanner');
        setIsScanning(false);
    };

    const handleScanError = (error) => {
        console.error('Trip: Scan error:', error);
        setIsScanning(false);
    };

    return (
        <div className="h-full bg-gray-50 overflow-hidden relative">
            <div className="container mx-auto px-4 py-8 h-full flex flex-col justify-start">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center">
                    Trip {formattedDate}
                </h1>

                {/* Debug info - can be removed later */}
                {tripId && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                        Trip ID: {tripId}
                    </p>
                )}

                {/* Scanned Items List */}
                {scannedItems.length > 0 && (
                    <div className="mt-6 space-y-2">
                        <h3 className="text-lg font-semibold text-gray-700 text-center">
                            Scanned Items ({scannedItems.length})
                        </h3>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                            {scannedItems.map((item) => (
                                <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm">
                                    <p className="font-mono text-sm text-gray-800">{item.barcode}</p>
                                    <p className="text-xs text-gray-500">{item.timestamp}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <FloatingActionButton
                onClick={handleScanItem}
                size="large"
            >
                <CameraIcon size={24} />
            </FloatingActionButton>

            {/* Camera Popup */}
            {isScanning && (
                <CameraPopup
                    onClose={handleScanClose}
                    onScan={handleBarcodeScanned}
                    onError={handleScanError}
                />
            )}
        </div>
    );
};

export default Trip;