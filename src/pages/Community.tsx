import Header from "../components/Header";
import Footer from "../components/Footer";
import CommunityHero from "../sections/CommunityHero";
import CommunityWhoWeAre from "../sections/CommunityWhoWeAre";
import CommunityAction from "../sections/CommunityAction";
import CommunityVoices from "../sections/CommunityVoices";
import CommunityJoinCta from "../sections/CommunityJoinCta";

export default function Community() {
  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Header />
      <main id="main-content" className="flex-1">
        <CommunityHero />
        <CommunityWhoWeAre />
        <CommunityAction />
        <CommunityVoices />
        <CommunityJoinCta />
      </main>
      <Footer />
    </div>
  );
}
