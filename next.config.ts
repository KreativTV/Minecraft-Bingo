import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        allowedDevOrigins: ['192.168.0.61', 'localhost:3000']
    } as any,
};

export default nextConfig;