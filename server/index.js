const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory storage for trips (will be replaced with MongoDB in the future)
const trips = new Map();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Basic API routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SuperSuper API is running',
    timestamp: new Date().toISOString()
  });
});

// Trip API routes

// Get all active trips (not completed)
app.get('/api/trips', (req, res) => {
  try {
    const activeTrips = Array.from(trips.values())
      .filter(trip => !trip.completed)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(activeTrips);
  } catch (err) {
    console.error('Error fetching trips:', err);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// Get a specific trip by ID
app.get('/api/trips/:tripId', (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = trips.get(tripId);
    
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    res.json(trip);
  } catch (err) {
    console.error('Error fetching trip:', err);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// Create a new trip
app.post('/api/trips', (req, res) => {
  try {
    const { tripId, name, createdAt, items } = req.body;
    
    if (!tripId || !name) {
      return res.status(400).json({ error: 'tripId and name are required' });
    }
    
    const trip = {
      tripId,
      name,
      createdAt: createdAt || new Date().toISOString(),
      items: items || [],
      completed: false
    };
    
    trips.set(tripId, trip);
    res.status(201).json(trip);
  } catch (err) {
    console.error('Error creating trip:', err);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// Update a trip (add items, update status)
app.put('/api/trips/:tripId', (req, res) => {
  try {
    const { tripId } = req.params;
    const existingTrip = trips.get(tripId);
    
    if (!existingTrip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    const updatedTrip = {
      ...existingTrip,
      ...req.body,
      tripId // Ensure tripId cannot be changed
    };
    
    trips.set(tripId, updatedTrip);
    res.json(updatedTrip);
  } catch (err) {
    console.error('Error updating trip:', err);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// Delete a trip
app.delete('/api/trips/:tripId', (req, res) => {
  try {
    const { tripId } = req.params;
    
    if (!trips.has(tripId)) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    trips.delete(tripId);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting trip:', err);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});