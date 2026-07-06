/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Speech / MediaRecorder features are client-only; nothing special needed server-side.
  eslint: {
    // Keep production builds unblocked by lint style rules; correctness is enforced by tsc.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
