// Simple in-memory cache for API responses
class APICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear() {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now();
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    });
  }
}

export const apiCache = new APICache();

// Cleanup expired cache entries every 10 minutes
setInterval(() => {
  apiCache.cleanup();
}, 600000);

export function withCache(handler: Function, ttl: number = 300000) {
  return async (request: Request, ...args: any[]) => {
    const url = new URL(request.url);
    const cacheKey = `${request.method}:${url.pathname}:${url.searchParams.toString()}`;
    
    // Check cache first
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Execute original handler
    const response = await handler(request, ...args);
    
    // Cache successful responses
    if (response.ok) {
      const data = await response.clone().json();
      apiCache.set(cacheKey, data, ttl);
    }

    return response;
  };
}
