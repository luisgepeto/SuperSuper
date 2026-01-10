import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CameraPopup from '../components/CameraPopup';
import ProductCard from '../components/ProductCard';
import tripStorage from '../services/tripStorage';
import productLookupService from '../services/productLookupService';

import { fetchAndCompressImage } from '../utils/imageUtils';
import generateGUID from '../utils/guid';
import { Button, Card, Modal, EmptyState, ScanIcon, MoreVerticalIcon, AlertTriangleIcon } from '../components/ui';


const Trip = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const tripId = searchParams.get('tripId');
    const [isScanning, setIsScanning] = useState(false);
    const [scannedItems, setScannedItems] = useState([]);
    const [tripName, setTripName] = useState('');
    const [isTripActive, setIsTripActive] = useState(false);
    const [editModeItemId, setEditModeItemId] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const supermarketName = 'SuperMarket X';

    useEffect(() => {
        // If no tripId provided, check for an active trip or create a new one
        if (!tripId) {
            const activeTrip = tripStorage.getActiveTrip();
            if (activeTrip) {
                // Redirect to the existing active trip
                setSearchParams({ tripId: activeTrip.tripId });
            } else {
                // Create a new trip ID and redirect to it
                const newTripId = generateGUID();
                setSearchParams({ tripId: newTripId });
            }
            return;
        }

        const existingTrip = tripStorage.getTrip(tripId);
        if (existingTrip) {
            setScannedItems(existingTrip.items || []);
            setTripName(existingTrip.name);
            setIsTripActive(true);
        } else {
            setTripName(tripStorage.formatTripName(new Date()));
        }
    }, [tripId, setSearchParams]);

    const { totalItems, totalPrice } = useMemo(() => {
        let items = 0;
        let price = 0;
        scannedItems.forEach((item) => {
            const qty = item.quantity || 1;
            // Treat missing price as 0 for summation
            const unitPrice = item.price || 0;
            items += qty;
            price += unitPrice * qty;
        });
        return { totalItems: items, totalPrice: price.toFixed(2) };
    }, [scannedItems]);

    const handleScanItem = () => {
        setIsScanning(true);
    };

    const handleBarcodeScanned = async (barcode) => {
        const existingItem = scannedItems.find((item) => item.barcode === barcode);
        
        if (existingItem) {
            const itemsWithoutExisting = scannedItems.filter((item) => item.barcode !== barcode);
            const updatedExistingItem = { ...existingItem, quantity: (existingItem.quantity || 1) + 1 };
            const updatedItems = [...itemsWithoutExisting, updatedExistingItem];
            setScannedItems(updatedItems);
            setIsScanning(false);
            if (tripId) {
                tripStorage.updateTripItems(tripId, updatedItems);
            }
            return;
        }

        const newItem = {
            id: Date.now(),
            barcode: barcode,
            productName: null,
            quantity: 1,
            timestamp: new Date().toLocaleString()
        };
        
        const updatedItems = [...scannedItems, newItem];
        setScannedItems(updatedItems);
        setIsScanning(false);

        if (tripId) {
            if (!isTripActive) {
                tripStorage.createTrip(tripId, tripName, supermarketName);
                setIsTripActive(true);
            }
            tripStorage.updateTripItems(tripId, updatedItems);
        }

        const result = await productLookupService.lookupProduct(barcode);
        if (result.success && result.product?.title) {
            // Check if we have a price from the lookup
            const lookupPrice = result.product.lowestPrice || null;
            
            // Fetch and compress the image to store locally (avoid repeated API calls)
            let compressedImage = null;
            if (result.product.image) {
                compressedImage = await fetchAndCompressImage(result.product.image);
            }
            
            setScannedItems((currentItems) => {
                const itemIndex = currentItems.findIndex((item) => item.id === newItem.id);
                if (itemIndex !== -1) {
                    const updatedItemsWithName = [...currentItems];
                    updatedItemsWithName[itemIndex] = {
                        ...updatedItemsWithName[itemIndex],
                        productName: result.product.title,
                        image: compressedImage,
                        thumbnail: compressedImage,
                        price: lookupPrice,
                    };
                    if (tripId) {
                        tripStorage.updateTripItems(tripId, updatedItemsWithName);
                    }
                    return updatedItemsWithName;
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

    const handleQuantityChange = (itemId, newQuantity) => {
        const updatedItems = scannedItems.map((item) =>
            item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        setScannedItems(updatedItems);
        if (tripId) {
            tripStorage.updateTripItems(tripId, updatedItems);
        }
    };

    const handleRemoveItem = (itemId) => {
        const updatedItems = scannedItems.filter((item) => item.id !== itemId);
        setScannedItems(updatedItems);
        setEditModeItemId(null);
        if (tripId) {
            tripStorage.updateTripItems(tripId, updatedItems);
        }
    };

    const handleProductUpdate = (itemId, updatedProduct, newQuantity) => {
        const updatedItems = scannedItems.map((item) =>
            item.id === itemId ? { ...updatedProduct, quantity: newQuantity } : item
        );
        setScannedItems(updatedItems);
        if (tripId) {
            tripStorage.updateTripItems(tripId, updatedItems);
        }
    };

    const handleEditModeChange = (itemId, isEditMode) => {
        setEditModeItemId(isEditMode ? itemId : null);
    };
  
    const handleMenuToggle = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleCancelTripClick = () => {
        setIsMenuOpen(false);
        setIsCancelDialogOpen(true);
    };

    const handleCancelTripConfirm = () => {
        if (tripId) {
            tripStorage.deleteTrip(tripId);
        }
        setIsCancelDialogOpen(false);
        navigate('/');
    };

    const handleCancelDialogClose = () => {
        setIsCancelDialogOpen(false);
    };

    return (
        <div className="h-full bg-warm-50 flex flex-col overflow-hidden">
            {/* Sticky Header */}
            <header className="flex-shrink-0 bg-gradient-to-br from-primary-600 to-primary-700 text-white sticky top-0 z-10">
                <div className="px-5 pt-6 pb-5">
                    <div className="flex items-start justify-between">
                        {/* Left side: Trip name and supermarket */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-bold truncate">
                                {tripName || 'Shopping Trip'}
                            </h1>
                            <p className="text-sm text-primary-100 mt-0.5">
                                @ {supermarketName}
                            </p>
                        </div>
                        
                        {/* Right side: Total price, item count, and menu */}
                        <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 text-right">
                                <p className="text-xl font-bold">
                                    ${totalPrice}
                                </p>
                                <p className="text-sm text-primary-100 mt-0.5">
                                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                                </p>
                            </div>
                            
                            {/* Menu button */}
                            <div className="relative">
                                <button
                                    id="trip-menu-button"
                                    onClick={handleMenuToggle}
                                    className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-smooth"
                                    aria-label="Trip options"
                                    aria-haspopup="true"
                                    aria-expanded={isMenuOpen}
                                >
                                    <MoreVerticalIcon size={20} className="text-white" />
                                </button>
                                
                                {/* Dropdown menu */}
                                {isMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-20"
                                            onClick={() => setIsMenuOpen(false)}
                                        />
                                        <div 
                                            className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg z-30 overflow-hidden"
                                            role="menu"
                                            aria-labelledby="trip-menu-button"
                                        >
                                            <button
                                                onClick={handleCancelTripClick}
                                                className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-smooth"
                                                role="menuitem"
                                            >
                                                Cancel trip
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
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
                        />
                    </div>
                ) : (
                    <div className="p-4 pb-24 space-y-4">
                        {scannedItems.slice().reverse().map((item) => (
                            <ProductCard
                                key={item.id}
                                product={item}
                                quantity={item.quantity || 1}
                                onQuantityChange={handleQuantityChange}
                                onRemove={handleRemoveItem}
                                onProductUpdate={handleProductUpdate}
                                isEditMode={editModeItemId === item.id}
                                onEditModeChange={(isEditMode) => handleEditModeChange(item.id, isEditMode)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Floating Scan Button */}
            <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center px-6" role="region" aria-label="Scan action" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                <Button
                    variant="accent"
                    size="lg"
                    onClick={handleScanItem}
                    icon={<ScanIcon size={22} />}
                    className="shadow-lg"
                    aria-label="Scan item barcode"
                >
                    Scan Item
                </Button>
            </div>

            {/* Camera Popup */}
            {isScanning && (
                <CameraPopup
                    onClose={handleScanClose}
                    onScan={handleBarcodeScanned}
                    onError={handleScanError}
                />
            )}

            {/* Cancel Trip Confirmation Modal */}
            <Modal isOpen={isCancelDialogOpen} onClose={handleCancelDialogClose}>
                <Card variant="default" padding="lg" className="max-w-sm w-full">
                    <Card.Header>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-error-light rounded-lg">
                                <AlertTriangleIcon size={18} className="text-error" />
                            </div>
                            <Card.Title>Cancel trip?</Card.Title>
                        </div>
                    </Card.Header>
                    <Card.Content>
                        <p className="text-sm text-warm-600 mb-4">
                            This will remove all items from your current trip. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                fullWidth
                                onClick={handleCancelDialogClose}
                            >
                                Keep shopping
                            </Button>
                            <Button
                                variant="danger"
                                fullWidth
                                onClick={handleCancelTripConfirm}
                            >
                                Cancel trip
                            </Button>
                        </div>
                    </Card.Content>
                </Card>
            </Modal>
        </div>
    );
};

export default Trip;
