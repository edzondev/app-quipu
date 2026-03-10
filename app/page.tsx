import { LandingNavbar } from "@/modules/landing/components/landing-navbar";
import HeroSection from "@/modules/landing/components/hero-section";
import ProblemSection from "@/modules/landing/components/problem-section";
import HowItWorksSection from "@/modules/landing/components/how-it-works-section";
import DifferentiatorsSection from "@/modules/landing/components/differentiators-section";
import SocialProofSection from "@/modules/landing/components/social-proof-section";
import FeaturesSection from "@/modules/landing/components/features-section";
import PricingSection from "@/modules/landing/components/pricing-section";
import { CTASection } from "@/modules/landing/components/cta-section";
import { LandingFooter } from "@/modules/landing/components/landing-footer";

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
