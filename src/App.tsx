import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Community from "./pages/Community";
import Membership from "./pages/Membership";
import ComingSoon from "./pages/ComingSoon";
import ScrollToTop from "./components/ScrollToTop";
import { ROUTES } from "./lib/routes";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path={ROUTES.home} element={<Home />} />
        <Route path={ROUTES.about} element={<About />} />
        <Route path={ROUTES.community} element={<Community />} />
        <Route path={ROUTES.membership} element={<Membership />} />
        <Route path={ROUTES.support} element={<ComingSoon title="Member Support" />} />
        <Route path={ROUTES.events} element={<ComingSoon title="Events" />} />
        <Route path={ROUTES.gallery} element={<ComingSoon title="Gallery" />} />
        <Route path={ROUTES.contact} element={<ComingSoon title="Contact" />} />
        <Route path={ROUTES.privacy} element={<ComingSoon title="Privacy Policy" />} />
        <Route path={ROUTES.documents} element={<ComingSoon title="Documents" />} />
        <Route path="*" element={<ComingSoon title="Page Not Found" />} />
      </Routes>
    </>
  );
}
