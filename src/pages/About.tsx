import Header from "../components/Header";
import Footer from "../components/Footer";
import AboutHero from "../sections/AboutHero";
import AboutHeritage from "../sections/AboutHeritage";
import AboutValues from "../sections/AboutValues";
import AboutCommitment from "../sections/AboutCommitment";
import AboutJoinCta from "../sections/AboutJoinCta";

export default function About() {
  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Header />
      <main id="main-content" className="flex-1">
        <AboutHero />
        <AboutHeritage />
        <AboutValues />
        <AboutCommitment />
        <AboutJoinCta />
      </main>
      <Footer />
    </div>
  );
}
