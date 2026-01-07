import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import FloatingActionButton from '../components/FloatingActionButton';
import CameraIcon from '../components/CameraIcon';
import CameraPopup from '../components/CameraPopup';
import tripStorage from '../services/tripStorage';

const Trip = () => {
    const [searchParams] = useSearchParams();
    const tripId = searchParams.get('tripId');
    const [isScanning, setIsScanning] = useState(false);
    const [scannedItems, setScannedItems] = useState([]);
    const [tripName, setTripName] = useState('');
    const [isTripActive, setIsTripActive] = useState(false);

    // Get current date in MM/DD/YY format for display
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
    });

    // Load existing trip data from localStorage on mount
    useEffect(() => {
        if (!tripId) {
            return;
        }

        const existingTrip = tripStorage.getTrip(tripId);
        if (existingTrip) {
            setScannedItems(existingTrip.items || []);
            setTripName(existingTrip.name);
            setIsTripActive(true);
        } else {
            // New trip - set default name but don't save until first scan
            setTripName(tripStorage.formatTripName());
        }
    }, [tripId]);

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
        
        const updatedItems = [...scannedItems, newItem];
        setScannedItems(updatedItems);
        
        // Close scanner after successful scan
        console.log('Trip: Closing scanner after successful scan');
        setIsScanning(false);

        // Save trip to localStorage
        if (tripId) {
            if (!isTripActive) {
                // First scan - create the trip (this makes it "active")
                tripStorage.createTrip(tripId, tripName);
                setIsTripActive(true);
                // Then update with the first item
                tripStorage.updateTripItems(tripId, updatedItems);
            } else {
                // Subsequent scans - just update items
                tripStorage.updateTripItems(tripId, updatedItems);
            }
        }
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
        <div className="h-full bg-gray-50 flex flex-col overflow-hidden relative pb-16">
            {/* Header Section - Fixed */}
            <div className="flex-shrink-0 bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center">
                        {tripName || `Trip ${formattedDate}`}
                    </h1>
                    {tripId && (
                        <p className="text-xs text-gray-500 text-center mt-1">
                            Trip ID: {tripId}
                        </p>
                    )}
                </div>
            </div>

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {scannedItems.length === 0 ? (
                    /* Empty State */
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center">
                            <div className="mb-4">
                                <svg 
                                    className="mx-auto h-24 w-24 text-gray-400" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={1.5} 
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No items scanned yet
                            </h3>
                            <p className="text-sm text-gray-500 max-w-sm">
                                Tap the camera button below to start scanning barcodes and add items to your shopping trip.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Scanned Items List */
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* List Header */}
                        <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Scanned Items
                                </h3>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {scannedItems.length}
                                </span>
                            </div>
                        </div>
                        
                        {/* Scrollable Items List */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-4 space-y-3">
                                {scannedItems.map((item, index) => (
                                    <div 
                                        key={item.id} 
                                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                                                        {scannedItems.length - index}
                                                    </span>
                                                    <p className="font-mono text-base font-medium text-gray-900">
                                                        {item.barcode}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-500 ml-8">
                                                    {item.timestamp}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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