import BaseStorage from './baseStorage';
import { STORAGE_KEYS } from '../constants';

// Trip storage service using localStorage for frontend-only persistence
class TripStorage extends BaseStorage {
  constructor() {
    super(STORAGE_KEYS.TRIPS);
  }

  // Get all trips from localStorage
  getAllTrips() {
    return this.getData();
  }

  // Save all trips to localStorage
  saveAllTrips(trips) {
    this.saveData(trips);
  }

  // Get the single active trip (not completed), returns null if none exists
  getActiveTrip() {
    const trips = this.getAllTrips();
    const activeTrips = Object.values(trips)
      .filter(trip => !trip.completed)
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
}

// Create singleton instance
const tripStorage = new TripStorage();

export default tripStorage;
