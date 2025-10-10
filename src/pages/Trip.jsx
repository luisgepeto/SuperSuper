import { useSearchParams } from 'react-router-dom';

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
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
    </div>
  );
};

export default Trip;