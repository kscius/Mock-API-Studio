import { Injectable, Logger } from '@nestjs/common';

// Simple geo-location service using a free IP geolocation API
// In production, consider using a library like geoip-lite or maxmind

interface GeoLocation {
  country: string | null;
  city: string | null;
}

@Injectable()
export class GeoLocationService {
  private readonly logger = new Logger(GeoLocationService.name);
  private cache = new Map<string, GeoLocation>();

  async getLocation(ip: string): Promise<GeoLocation> {
    // Check cache first
    if (this.cache.has(ip)) {
      return this.cache.get(ip)!;
    }

    // Skip localhost and private IPs
    if (this.isLocalOrPrivateIP(ip)) {
      const result = { country: 'Local', city: 'Local' };
      this.cache.set(ip, result);
      return result;
    }

    try {
      // Use ip-api.com free tier (limit: 45 requests per minute)
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city`);
      const data = await response.json();

      if (data.status === 'success') {
        const result = {
          country: data.country || null,
          city: data.city || null,
        };
        
        // Cache for 1 hour
        this.cache.set(ip, result);
        
        // Clear cache after 1 hour
        setTimeout(() => {
          this.cache.delete(ip);
        }, 3600000);

        return result;
      }

      return { country: null, city: null };
    } catch (error) {
      this.logger.error(`Failed to get geo location for ${ip}: ${error.message}`);
      return { country: null, city: null };
    }
  }

  private isLocalOrPrivateIP(ip: string): boolean {
    // Check for localhost
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return true;
    }

    // Check for private IP ranges
    const parts = ip.split('.');
    if (parts.length !== 4) {
      return false;
    }

    const first = parseInt(parts[0]);
    const second = parseInt(parts[1]);

    // 10.0.0.0 – 10.255.255.255
    if (first === 10) {
      return true;
    }

    // 172.16.0.0 – 172.31.255.255
    if (first === 172 && second >= 16 && second <= 31) {
      return true;
    }

    // 192.168.0.0 – 192.168.255.255
    if (first === 192 && second === 168) {
      return true;
    }

    return false;
  }
}

