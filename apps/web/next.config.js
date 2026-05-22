/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@openbusinessos/shared-types', '@openbusinessos/event-definitions', '@openbusinessos/utils'],
  output: 'standalone',
};

module.exports = nextConfig;
