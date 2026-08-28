import Header from "../components/Header";
import Footer from "../components/Footer";
import Hero from "../sections/Hero";
import ValuesStrip from "../sections/ValuesStrip";
import AboutIntro from "../sections/AboutIntro";
import ImpactSection from "../sections/ImpactSection";
import WhatWeDo from "../sections/WhatWeDo";
import CommunityStory from "../sections/CommunityStory";
import CommunityCta from "../sections/CommunityCta";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Header />
      <main id="main-content" className="flex-1">
        <Hero />
        <ValuesStrip />
        <AboutIntro />
        <ImpactSection />
        <WhatWeDo />
        <CommunityStory />
        <CommunityCta />
      </main>
      <Footer />
    </div>
  );
}
