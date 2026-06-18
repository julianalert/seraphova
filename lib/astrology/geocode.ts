export interface GeoResult {
  lat: number;
  lng: number;
  formatted: string;
}

export async function geocodeCity(city: string): Promise<GeoResult> {
  const key = process.env.OPENCAGE_API_KEY;
  if (!key) throw new Error('OPENCAGE_API_KEY is not set');

  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${key}&limit=1&no_annotations=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenCage request failed: ${res.status}`);

  const data = await res.json();
  if (!data.results?.length) throw new Error(`No geocoding result for "${city}"`);

  const result = data.results[0];
  return {
    lat:       result.geometry.lat,
    lng:       result.geometry.lng,
    formatted: result.formatted,
  };
}
