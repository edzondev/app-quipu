import type { Metadata } from "next";
import { CTASection } from "@/modules/landing/components/cta-section";
import DifferentiatorsSection from "@/modules/landing/components/differentiators-section";
import FeaturesSection from "@/modules/landing/components/features-section";
import HeroSection from "@/modules/landing/components/hero-section";
import HowItWorksSection from "@/modules/landing/components/how-it-works-section";
import { LandingFooter } from "@/modules/landing/components/landing-footer";
import { LandingNavbar } from "@/modules/landing/components/landing-navbar";
import PricingSection from "@/modules/landing/components/pricing-section";
import ProblemSection from "@/modules/landing/components/problem-section";
import SocialProofSection from "@/modules/landing/components/social-proof-section";

export const metadata: Metadata = {
  title: "Distribuye tu sueldo antes de gastarlo",
  description:
    "Quipu aplica la regla 50/30/20 a tu sueldo mensual. Decide a dónde va tu dinero antes de recibirlo. Sin banco, sin complicaciones.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <LandingNavbar />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <DifferentiatorsSection />
      <SocialProofSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
      <LandingFooter />
    </main>
  );
}
