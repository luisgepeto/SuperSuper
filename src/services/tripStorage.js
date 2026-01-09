// Trip storage service using localStorage for frontend-only persistence
const TRIPS_STORAGE_KEY = 'supersuper_trips';

class TripStorage {
  // Get all trips from localStorage
  getAllTrips() {
    try {
      const stored = localStorage.getItem(TRIPS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading trips from localStorage:', error);
      return {};
    }
  }

  // Save all trips to localStorage
  saveAllTrips(trips) {
    try {
      localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
    } catch (error) {
      console.error('Error saving trips to localStorage:', error);
    }
  }

  // Get all active trips (not completed)
  getActiveTrips() {
    const trips = this.getAllTrips();
    return Object.values(trips)
      .filter(trip => !trip.completed)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Get a specific trip by ID
  getTrip(tripId) {
    const trips = this.getAllTrips();
    return trips[tripId] || null;
  }

  // Create a new trip (called on first scan)
  createTrip(tripId, name, supermarketName = null) {
    const trips = this.getAllTrips();
    const newTrip = {
      tripId,
      name,
      supermarketName,
      createdAt: new Date().toISOString(),
      items: [],
      completed: false
    };
    trips[tripId] = newTrip;
    this.saveAllTrips(trips);
    return newTrip;
  }

  // Update trip items
  updateTripItems(tripId, items) {
    const trips = this.getAllTrips();
    if (trips[tripId]) {
      trips[tripId].items = items;
      this.saveAllTrips(trips);
      return trips[tripId];
    }
    return null;
  }

  // Format trip name from date (e.g., "Trip 01/07/2026")
  formatTripName(date = new Date()) {
    const formattedDate = date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
    return `Trip ${formattedDate}`;
  }
}

// Create singleton instance
const tripStorage = new TripStorage();

export default tripStorage;
