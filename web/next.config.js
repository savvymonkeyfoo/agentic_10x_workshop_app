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

  // 4. Security Headers (Phase 2)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://v6qw9wirvrirowaa.public.blob.vercel-storage.com https://generativelanguage.googleapis.com https://*.pinecone.io",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
