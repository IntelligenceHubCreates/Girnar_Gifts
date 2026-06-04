/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**' },
    ],
  },
    experimental: {
    // ... your existing experimental options ...
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
  async rewrites() {
    return process.env.USE_BACKEND_REWRITES === 'true'
      ? [
          {
            source: '/api/product/:path*',
            destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/api/product/:path*`,
          },
        ]
      : [];
  },
};
module.exports = nextConfig;
