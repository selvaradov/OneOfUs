import { GeolocationData } from './types';

// In-memory cache to avoid repeated API calls for the same IP
const geoCache = new Map<string, GeolocationData>();

/**
 * Get geolocation data for an IP address using ip-api.com
 * Free tier: 45 requests per minute
 * @param ipAddress - The IP address to look up
 * @returns GeolocationData or null if lookup fails
 */
export async function getGeolocation(ipAddress: string): Promise<GeolocationData | null> {
  if (ipAddress === 'unknown' || !ipAddress) return null;

  // Check cache first
  if (geoCache.has(ipAddress)) {
    return geoCache.get(ipAddress)!;
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
    const data = await response.json();

    if (data.status === 'success') {
      const geo: GeolocationData = {
        city: data.city || 'Unknown',
        country: data.country || 'Unknown',
        countryCode: data.countryCode || 'XX',
        region: data.regionName || 'Unknown',
        lat: data.lat || 0,
        lon: data.lon || 0,
      };

      // Store in cache
      geoCache.set(ipAddress, geo);
      return geo;
    } else {
      console.warn(`Geolocation lookup failed for ${ipAddress}:`, data.message);
      return null;
    }
  } catch (error) {
    console.error('Geolocation lookup error:', error);
    return null;
  }
}

/**
 * Batch geolocation lookup for multiple IP addresses
 * Processes in batches with delays to respect rate limits (45 req/min)
 * @param ipAddresses - Array of IP addresses to look up
 * @returns Map of IP addresses to geolocation data
 */
export async function batchGeolocation(
  ipAddresses: string[]
): Promise<Map<string, GeolocationData>> {
  const results = new Map<string, GeolocationData>();

  // Get unique IPs only
  const unique = [...new Set(ipAddresses)].filter((ip) => ip && ip !== 'unknown');

  // Process in batches of 10 with delays to respect rate limits
  // 45 req/min means we can do ~40 safely, so 10 per 15 seconds
  const batchSize = 10;
  const delayBetweenBatches = 15000; // 15 seconds

  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize);
    const promises = batch.map((ip) => getGeolocation(ip));
    const geoData = await Promise.all(promises);

    batch.forEach((ip, idx) => {
      if (geoData[idx]) {
        results.set(ip, geoData[idx]!);
      }
    });

    // Wait between batches if there are more to process
    if (i + batchSize < unique.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}

/**
 * Clear the geolocation cache
 * Useful for testing or if you want to force fresh lookups
 */
export function clearGeolocationCache(): void {
  geoCache.clear();
}

/**
 * Get cache statistics
 */
export function getGeolocationCacheStats(): { size: number; ips: string[] } {
  return {
    size: geoCache.size,
    ips: Array.from(geoCache.keys()),
  };
}
