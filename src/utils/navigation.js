import tripStorage from '../services/tripStorage';
import generateGUID from './guid';

export const navigateToTrip = (navigate) => {
  const activeTrip = tripStorage.getActiveTrip();

  if (activeTrip) {
    navigate(`/trips?tripId=${activeTrip.tripId}`);
  } else {
    const tripId = generateGUID();
    navigate(`/trips?tripId=${tripId}`);
  }
};
