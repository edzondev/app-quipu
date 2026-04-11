import type { MetadataRoute } from "next";

const BASE_URL = process.env.SITE_URL ?? "https://quipu-finance.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/_next/",
          "/dashboard",
          "/expenses",
          "/savings",
          "/add-expense",
          "/payday",
          "/achievements",
          "/settings",
          "/profile",
          "/plan",
          "/rescue",
          "/register-income",
          "/success",
          "/onboarding",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
