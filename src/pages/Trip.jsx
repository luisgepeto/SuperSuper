import { useSearchParams } from 'react-router-dom';
import FloatingActionButton from '../components/FloatingActionButton';
import PlusIcon from '../components/PlusIcon';
import CameraIcon from '../components/CameraIcon';

const Trip = () => {
    const [searchParams] = useSearchParams();
    const tripId = searchParams.get('tripId');

    // Get current date in MM/DD/YY format
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
    });

    const handleAddItem = () => {
        // Placeholder - will do nothing for now
        console.log('Add item clicked');
    };

    const handleScanItem = () => {
        // Placeholder - will do nothing for now
        console.log('Scan item clicked');
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
            </div>

            {/* Floating Action Buttons */}
            <FloatingActionButton
                onClick={handleScanItem}
                size="large"
            >
                <CameraIcon size={24} />
            </FloatingActionButton>
        </div>
    );
};

export default Trip;