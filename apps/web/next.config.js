/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@truyen/types", "@truyen/db"],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'i.picsum.photos' },
    ],
  },
};

module.exports = nextConfig;
