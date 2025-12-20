/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Server-Side: Keep Pinecone external
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', '@pinecone-database/pinecone'],
  },

  // 2. Client-Side: Webpack Config
  webpack: (config, { isServer }) => {
    // Existing Canvas fix
    config.resolve.alias.canvas = false;

    // CRITICAL FIX: Only run this on the client
    if (!isServer) {
      // A. PROTOCOL FIX (The "Scheme Error" Killer)
      // We must alias the `node:` protocol explicitly to false
      // This is what was missing in the previous attempt!
      config.resolve.alias['node:stream'] = false;
      config.resolve.alias['node:buffer'] = false;
      config.resolve.alias['node:util'] = false;
      config.resolve.alias['node:process'] = false;
      config.resolve.alias['node:fs'] = false;

      // B. MODULE FIX (The "Module Not Found" Killer)
      // We fallback standard node modules to false
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        dns: false,
        // "node:stream": false <--- THIS DOES NOT WORK HERE, IT MUST BE IN ALIAS (ABOVE)
      };
    }

    return config;
  },

  // 3. Images (Keep existing)
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
