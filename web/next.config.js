/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 1. Keep Pinecone external for the server build
    serverComponentsExternalPackages: ['pdf-parse', '@pinecone-database/pinecone'],
  },
  webpack: (config, { isServer }) => {
    // 2. Existing fix for canvas
    config.resolve.alias.canvas = false;

    // 3. CRITICAL FIX: Ignore Node.js modules on the client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "node:stream": false, // Fixes the Pinecone/Webpack error
        fs: false,            // Fixes file system access errors
        net: false,
        tls: false
      };
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'v6qw9wirvrirowaa.public.blob.vercel-storage.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
      },
    ],
  },
};

module.exports = nextConfig;
