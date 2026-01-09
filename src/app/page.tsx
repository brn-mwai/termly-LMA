'use client';

import { useState } from 'react';
import {
  Banner,
  Header,
  MobileNav,
  HeroSection,
  PreviewSection,
  AudienceSection,
  FeaturesSection,
  HowItWorksSection,
  PricingSection,
  CTASection,
  Footer,
  BackToTop,
} from '@/components/landing';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="landingPage" style={{ minHeight: '100vh', background: '#ffffff' }}>
      <Banner />
      <Header onMobileMenuClick={() => setMobileMenuOpen(true)} />
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <HeroSection />
      <PreviewSection />
      <AudienceSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CTASection />
      <Footer />
      <BackToTop />
    </div>
  );
}
