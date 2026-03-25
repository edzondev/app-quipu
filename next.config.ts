import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
  pageExtensions: ["ts", "tsx", "mdx", "md", "js", "jsx"],
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [["remark-gfm"]], // string en lugar de import
  },
});

export default withSentryConfig(withMDX(nextConfig), {
  org: "edzonperez",
  project: "app-quipu",
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
