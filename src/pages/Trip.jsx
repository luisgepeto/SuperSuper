import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CameraPopup from '../components/CameraPopup';
import ProductCard from '../components/ProductCard';
import tripStorage from '../services/tripStorage';
import productLookupService from '../services/productLookupService';
import { fetchAndCompressImage } from '../utils/imageUtils';
import { Button, EmptyState, ScanIcon } from '../components/ui';

const Trip = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const tripId = searchParams.get('tripId');
    const [isScanning, setIsScanning] = useState(false);
    const [scannedItems, setScannedItems] = useState([]);
    const [tripName, setTripName] = useState('');
    const [isTripActive, setIsTripActive] = useState(false);
    const [editModeItemId, setEditModeItemId] = useState(null);
    const supermarketName = 'SuperMarket X';

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
            setTripName(tripStorage.formatTripName(new Date()));
        }
    }, [tripId]);

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
                        price: lookupPrice,
                    };
                    if (tripId) {
                        tripStorage.updateTripItems(tripId, updatedItemsWithName);
                    }
                    return updatedItemsWithName;
                }
                return currentItems;
            });
            
            // Enable edit mode if no price is available
            if (!lookupPrice) {
                setEditModeItemId(newItem.id);
            }
        } else {
            // Product not found - enable edit mode for the new item
            setEditModeItemId(newItem.id);
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
                        
                        {/* Right side: Total price and item count */}
                        <div className="flex-shrink-0 text-right ml-4">
                            <p className="text-xl font-bold">
                                ${totalPrice}
                            </p>
                            <p className="text-sm text-primary-100 mt-0.5">
                                {totalItems} {totalItems === 1 ? 'item' : 'items'}
                            </p>
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
                    <div className="p-4 pb-6 space-y-4">
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
                        {/* Scan Button - placed after all product cards to prevent overlap */}
                        <div className="flex justify-center pt-4 pb-8">
                            <Button
                                variant="accent"
                                size="lg"
                                onClick={handleScanItem}
                                icon={<ScanIcon size={22} />}
                                className="shadow-lg"
                            >
                                Scan Item
                            </Button>
                        </div>
                    </div>
                )}
            </main>

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