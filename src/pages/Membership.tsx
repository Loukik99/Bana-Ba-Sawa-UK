import Header from "../components/Header";
import Footer from "../components/Footer";
import MembershipHero from "../sections/MembershipHero";
import MembershipWhy from "../sections/MembershipWhy";
import MembershipJoin from "../sections/MembershipJoin";
import MembershipAccountCta from "../sections/MembershipAccountCta";
import MembershipDuties from "../sections/MembershipDuties";
import MembershipEligibility from "../sections/MembershipEligibility";
import MembershipVoices from "../sections/MembershipVoices";

export default function Membership() {
  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Header />
      <main id="main-content" className="flex-1">
        <MembershipHero />
        <MembershipWhy />
        <MembershipJoin />
        <MembershipAccountCta />
        <MembershipDuties />
        <MembershipEligibility />
        <MembershipVoices />
      </main>
      <Footer />
    </div>
  );
}
