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

  // Save all trips to localStorage and dispatch update event
  saveAllTrips(trips) {
    try {
      localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
      // Dispatch custom event to notify components of trip updates
      window.dispatchEvent(new CustomEvent('tripUpdated'));
    } catch (error) {
      console.error('Error saving trips to localStorage:', error);
    }
  }

  // Get the single active trip (not completed and has items), returns null if none exists
  // A trip with no items is considered "not started" and won't be returned as active
  getActiveTrip() {
    const trips = this.getAllTrips();
    const activeTrips = Object.values(trips)
      .filter(trip => !trip.completed && trip.items && trip.items.length > 0)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return activeTrips.length > 0 ? activeTrips[0] : null;
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

  // Delete a trip by ID
  deleteTrip(tripId) {
    const trips = this.getAllTrips();
    if (trips[tripId]) {
      delete trips[tripId];
      this.saveAllTrips(trips);
      return true;
    }
    return false;
  }

  // Complete a trip and remove it from storage
  // Returns the trip items for pantry update, or null if trip not found
  // Completed trips are not persisted since historical trip data is not used
  completeTrip(tripId) {
    const trips = this.getAllTrips();
    if (trips[tripId]) {
      const tripItems = trips[tripId].items || [];
      // Remove the completed trip from storage instead of keeping it
      delete trips[tripId];
      this.saveAllTrips(trips);
      return tripItems;
    }
    return null;
  }
}

// Create singleton instance
const tripStorage = new TripStorage();

// Export the storage key for use in event listeners
export { TRIPS_STORAGE_KEY };
export default tripStorage;
