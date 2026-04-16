import type { NextConfig } from 'next';

const isVercel = !!process.env.VERCEL;

const nextConfig: NextConfig = {
  ...(!isVercel && { output: 'standalone' }),
  basePath: '/kaygo',
  assetPrefix: '/kaygo',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/kaygo',
        permanent: true,
        basePath: false,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: '/kaygo',
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
