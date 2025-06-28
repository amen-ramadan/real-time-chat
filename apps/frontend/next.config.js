/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3003', // Specify the port if it's non-standard for http/https
        pathname: '/uploads/**', // Or be more specific if needed, e.g., '/uploads/**'
      },
    ],
  },
};

export default nextConfig;
