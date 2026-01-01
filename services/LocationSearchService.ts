/**
 * Location Search Service using Nominatim (OpenStreetMap) API
 * Free geocoding service, no API key required
 * Rate limit: max 1 request/second, include User-Agent
 */

export interface LocationResult {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  country?: string;
  city?: string;
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

const NOMINATIM_API = "https://nominatim.openstreetmap.org/search";

export async function searchLocations(query: string): Promise<LocationResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      format: "json",
      addressdetails: "1",
      limit: "8",
      "accept-language": "en,zh", // Support both languages
    });

    const response = await fetch(`${NOMINATIM_API}?${params}`, {
      headers: {
        "User-Agent": "SilkSparks/1.0 (Astrology App)",
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data: NominatimResult[] = await response.json();

    return data.map((result) => ({
      name: formatLocationName(result),
      displayName: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      country: result.address?.country,
      city: result.address?.city || result.address?.town || result.address?.village,
    }));
  } catch (error) {
    console.error("Location search failed:", error);
    return [];
  }
}

function formatLocationName(result: NominatimResult): string {
  const address = result.address;
  if (!address) {
    // Fallback: use first two parts of display_name
    const parts = result.display_name.split(",").map((s) => s.trim());
    return parts.slice(0, 2).join(", ");
  }

  const city = address.city || address.town || address.village || "";
  const state = address.state || "";
  const country = address.country || "";

  // Build a concise name
  const parts = [city, state, country].filter(Boolean);

  // Remove duplicates (e.g., "Beijing, Beijing, China" -> "Beijing, China")
  const unique = parts.filter((part, index) =>
    parts.indexOf(part) === index
  );

  return unique.slice(0, 2).join(", ") || result.display_name.split(",")[0] || result.display_name;
}

// Default location when user skips (0, 0 - geometric center)
export const DEFAULT_LOCATION: LocationResult = {
  name: "Not specified",
  displayName: "Location not provided",
  lat: 0,
  lng: 0,
};
