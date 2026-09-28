import type { NextConfig } from 'next';

// Static export: the film ships as plain files. Runway is used only at
// production time, so there is no server and no secret at runtime.
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
