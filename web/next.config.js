/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', '@pinecone-database/pinecone'],
  },
  webpack: (config, { isServer }) => {
    // 1. Keep your existing canvas fix
    config.resolve.alias.canvas = false;

    // 2. ADD THIS BLOCK: Ignore Node.js modules on the client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "node:stream": false,
        fs: false,
        net: false,
        tls: false
      };
    }

    return config;
  },
  /* config options here */
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

