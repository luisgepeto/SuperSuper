import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CameraPopup from '../components/CameraPopup';
import tripStorage from '../services/tripStorage';
import productLookupService from '../services/productLookupService';
import { Button, Card, Badge, EmptyState, ScanIcon, BarcodeIcon, ChevronLeftIcon } from '../components/ui';

const Trip = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const tripId = searchParams.get('tripId');
    const [isScanning, setIsScanning] = useState(false);
    const [scannedItems, setScannedItems] = useState([]);
    const [tripName, setTripName] = useState('');
    const [isTripActive, setIsTripActive] = useState(false);

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
            setTripName(tripStorage.formatTripName());
        }
    }, [tripId]);

    const handleScanItem = () => {
        setIsScanning(true);
    };

    const handleBarcodeScanned = async (barcode) => {
        const newItem = {
            id: Date.now(),
            barcode: barcode,
            product: null,
            timestamp: new Date().toLocaleString()
        };
        
        // Add item immediately with barcode as fallback
        const updatedItems = [...scannedItems, newItem];
        setScannedItems(updatedItems);
        setIsScanning(false);

        // Save to storage
        if (tripId) {
            if (!isTripActive) {
                tripStorage.createTrip(tripId, tripName);
                setIsTripActive(true);
            }
            tripStorage.updateTripItems(tripId, updatedItems);
        }

        // Look up product details asynchronously
        const result = await productLookupService.lookupProduct(barcode);
        if (result.success && result.product) {
            // Update the item with the product details
            setScannedItems((currentItems) => {
                const itemIndex = currentItems.findIndex((item) => item.id === newItem.id);
                if (itemIndex !== -1) {
                    const updatedItemsWithProduct = [...currentItems];
                    updatedItemsWithProduct[itemIndex] = {
                        ...updatedItemsWithProduct[itemIndex],
                        product: result.product,
                    };
                    // Update storage with product details
                    if (tripId) {
                        tripStorage.updateTripItems(tripId, updatedItemsWithProduct);
                    }
                    return updatedItemsWithProduct;
                }
                return currentItems;
            });
        }
    };

    const handleScanClose = () => {
        setIsScanning(false);
    };

    const handleScanError = (error) => {
        console.error('Scan error:', error);
        setIsScanning(false);
    };

    const handleBack = () => {
        navigate('/');
    };

    return (
        <div className="h-full bg-warm-50 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex-shrink-0 bg-white border-b border-warm-100 safe-area-top">
                <div className="flex items-center px-4 py-3">
                    <button 
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-xl hover:bg-warm-100 transition-smooth"
                    >
                        <ChevronLeftIcon size={24} className="text-warm-600" />
                    </button>
                    <div className="flex-1 ml-2">
                        <h1 className="font-semibold text-warm-900 truncate">
                            {tripName || 'Shopping Trip'}
                        </h1>
                        {scannedItems.length > 0 && (
                            <p className="text-xs text-warm-500">
                                {scannedItems.length} item{scannedItems.length !== 1 ? 's' : ''} scanned
                            </p>
                        )}
                    </div>
                    <Badge variant="primary" size="sm" dot>
                        Active
                    </Badge>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {scannedItems.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-6">
                        <EmptyState
                            icon={<ScanIcon size={48} />}
                            title="Ready to scan"
                            description="Tap the scan button below to start adding products to your trip"
                            action={
                                <Button 
                                    variant="accent" 
                                    onClick={handleScanItem}
                                    icon={<ScanIcon size={18} />}
                                >
                                    Start Scanning
                                </Button>
                            }
                        />
                    </div>
                ) : (
                    <div className="p-4 pb-40 space-y-3">
                        {scannedItems.slice().reverse().map((item, index) => (
                            <Card 
                                key={item.id} 
                                variant="default" 
                                padding="none"
                                className="overflow-hidden"
                            >
                                <div className="flex items-center p-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-warm-100 rounded-xl flex items-center justify-center mr-3">
                                        <BarcodeIcon size={20} className="text-warm-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-warm-900 truncate">
                                            {item.product?.title || item.barcode}
                                        </p>
                                        <p className="text-xs text-warm-400 mt-0.5">
                                            {item.product?.title ? item.barcode : item.timestamp}
                                        </p>
                                    </div>
                                    <Badge variant="default" size="sm">
                                        #{scannedItems.length - index}
                                    </Badge>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Floating Scan Button */}
            {scannedItems.length > 0 && (
                <div className="fixed bottom-20 left-0 right-0 flex justify-center pb-4 pointer-events-none">
                    <Button
                        variant="accent"
                        size="lg"
                        onClick={handleScanItem}
                        icon={<ScanIcon size={22} />}
                        className="pointer-events-auto shadow-lg"
                    >
                        Scan Item
                    </Button>
                </div>
            )}

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