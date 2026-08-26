import { useEffect } from "react";
import LandingNav from "../components/landing/LandingNav";
import HeroSection from "../components/landing/HeroSection";
import PresenceStrip from "../components/landing/PresenceStrip";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import FeatureGrid from "../components/landing/FeatureGrid";
import TimeTravelSection from "../components/landing/TimeTravelSection";
import RBACSection from "../components/landing/RBACSection";
import StatsSection from "../components/landing/StatsSection";
import FinalCTASection from "../components/landing/FinalCTASection";
import LandingFooter from "../components/landing/LandingFooter";

export default function LandingPage() {
  // Set page title & meta
  useEffect(() => {
    document.title = "Scrybe — AI-Powered Collaborative Infinite Canvas";
    // meta description
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content =
      "Scrybe turns your team's brainstorming sessions into structured tasks automatically. Infinite canvas + real-time multiplayer + AI intent classification = zero manual Jira tickets.";
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
        fontFamily: "var(--font-sans)",
        overflowX: "hidden",
      }}
    >
      <LandingNav />
      <main>
        <HeroSection />
        <PresenceStrip />
        <HowItWorksSection />
        <FeatureGrid />
        <TimeTravelSection />
        <RBACSection />
        <StatsSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
