import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/match/history',
        destination: '/matches',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
