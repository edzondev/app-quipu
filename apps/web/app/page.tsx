import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/auth/auth-server";
import { defaultPageTitle, pageMetadata } from "@/core/seo";
import { LandingView } from "@/modules/landing/components/landing-view";

export const metadata: Metadata = pageMetadata({
  title: defaultPageTitle,
  path: "/",
  index: true,
});

export default async function HomePage() {
  if (await isAuthenticated()) {
    redirect("/dashboard");
  }

  return <LandingView />;
}
