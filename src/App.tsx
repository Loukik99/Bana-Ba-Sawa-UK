import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Community from "./pages/Community";
import Membership from "./pages/Membership";
import ComingSoon from "./pages/ComingSoon";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Portal from "./pages/Portal";
import Profile from "./pages/Profile";
import ScrollToTop from "./components/ScrollToTop";
import { GuestRoute, ProtectedRoute } from "./components/AuthRoutes";
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
        <Route
          path={ROUTES.login}
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path={ROUTES.register}
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route
          path={ROUTES.forgotPassword}
          element={
            <GuestRoute>
              <ForgotPassword />
            </GuestRoute>
          }
        />
        <Route path={ROUTES.resetPassword} element={<ResetPassword />} />
        <Route path={ROUTES.verifyEmail} element={<VerifyEmail />} />
        <Route
          path={ROUTES.portal}
          element={
            <ProtectedRoute>
              <Portal />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.profile}
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
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
