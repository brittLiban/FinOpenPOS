/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow production builds to complete even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even if there are TypeScript errors
    ignoreBuildErrors: true,
  },
  experimental: {
    // Optimize for production
    optimizeCss: true,
  },
  webpack: (config, { dev, isServer }) => {
    // Fix webpack caching issues in development
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
