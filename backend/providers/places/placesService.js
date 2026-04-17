// backend/utils/placesService.js
// Secure Google Places API proxy — key must be set via GOOGLE_PLACES_API_KEY env var

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function searchPlaces(query) {
  if (!PLACES_API_KEY) {
    logger.warn('GOOGLE_PLACES_API_KEY not set — Places search disabled');
    return [];
  }

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=lodging&key=${PLACES_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Google Places API returned ${response.status}`);

    const data = await response.json();
    return (data.results || []).map(place => ({
      place_id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      photo_reference: place.photos ? place.photos[0].photo_reference : null
    }));
  } catch (error) {
    logger.error('Google Places Proxy Error:', error.message);
    return [];
  }
}

export function getPhotoUrl(photoReference, maxWidth = 800) {
  if (!photoReference || !PLACES_API_KEY) return null;
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${PLACES_API_KEY}`;
}
