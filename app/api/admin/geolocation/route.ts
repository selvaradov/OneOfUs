import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { GeolocationData } from '@/lib/types';

// In-memory cache to avoid repeated API calls
const geoCache = new Map<string, GeolocationData>();

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    if (!verifyAdminAuth(request)) {
      console.error('Admin geolocation: authentication failed (401)');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ips } = body;

    if (!ips || !Array.isArray(ips)) {
      return NextResponse.json({ success: false, error: 'ips array is required' }, { status: 400 });
    }

    // Limit to 50 IPs per request to avoid abuse
    const ipsToLookup = ips.slice(0, 50).filter((ip: string) => ip && ip !== 'unknown');

    const results: Record<string, GeolocationData> = {};

    // Check cache first and identify which IPs need lookup
    const uncachedIps: string[] = [];
    for (const ip of ipsToLookup) {
      if (geoCache.has(ip)) {
        results[ip] = geoCache.get(ip)!;
      } else {
        uncachedIps.push(ip);
      }
    }

    // Fetch uncached IPs from ip-api.com
    // Note: ip-api.com has a batch endpoint but it's paid; we'll do individual calls
    // They allow 45 requests/minute on free tier
    for (const ip of uncachedIps) {
      try {
        const response = await fetch(`http://ip-api.com/json/${ip}`, {
          // Server-side can call HTTP endpoints
        });
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
          geoCache.set(ip, geo);
          results[ip] = geo;
        }
      } catch (err) {
        console.error(`Geolocation lookup failed for ${ip}:`, err);
        // Continue with other IPs
      }
    }

    return NextResponse.json({
      success: true,
      geolocations: results,
    });
  } catch (error) {
    console.error('Admin geolocation API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
