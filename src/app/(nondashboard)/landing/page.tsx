import React from 'react'
import HeroSection from './hero-section';
import FeaturesSection from './features-section';
import DiscoverSection from './dicover-section';
import CallToActionsSection from './call-to-actions-sections';
import FooterSection from './footer-section';

const Landing = () => {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <DiscoverSection />
      <CallToActionsSection />
      <FooterSection />
    </div>
  )
}

export default Landing;