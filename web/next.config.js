/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep Pinecone external for the server runtime
    serverComponentsExternalPackages: ['pdf-parse', '@pinecone-database/pinecone'],
  },
  webpack: (config) => {
    // Keep the canvas fix for pdf-parse
    config.resolve.alias.canvas = false;
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
