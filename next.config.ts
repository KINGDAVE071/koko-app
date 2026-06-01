import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.10.11.53'],
};

const serwistConfig = {
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  swUrl: "/sw.js",
  reloadOnOnline: true,
  disable: process.env.NODE_ENV !== "production", // ← désactivé en dev
};

export default withSerwist(serwistConfig)(nextConfig);
