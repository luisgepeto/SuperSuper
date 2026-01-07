// Trip service for managing shopping trips
import apiService from './apiService';

class TripService {
  constructor() {
    this.baseUrl = apiService.baseUrl;
  }

  // Get all active trips
  async getActiveTrips() {
    try {
      const response = await fetch(`${this.baseUrl}/api/trips`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch trips: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching active trips:', error);
      throw error;
    }
  }

  // Get a specific trip by ID
  async getTrip(tripId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/trips/${tripId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch trip: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching trip:', error);
      throw error;
    }
  }

  // Create a new trip
  async createTrip(tripId, name) {
    try {
      const response = await fetch(`${this.baseUrl}/api/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId,
          name,
          createdAt: new Date().toISOString(),
          items: [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create trip: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating trip:', error);
      throw error;
    }
  }

  // Update trip items
  async updateTripItems(tripId, items) {
    try {
      const response = await fetch(`${this.baseUrl}/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update trip: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating trip:', error);
      throw error;
    }
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
const tripService = new TripService();

export default tripService;
