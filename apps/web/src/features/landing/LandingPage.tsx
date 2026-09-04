import { LandingNavbar } from "./LandingNavbar.js";
import { Hero } from "./hero/Hero.js";
import { PersonaRail } from "./PersonaRail.js";
import { WorkspaceShowcase } from "./workspace/WorkspaceShowcase.js";
import { ProductCategoryGrid } from "./categories/ProductCategoryGrid.js";
import { JourneySection } from "./journey/JourneySection.js";
import { ConnectedEcosystem } from "./ecosystem/ConnectedEcosystem.js";
import { GrowthAnalytics } from "./analytics/GrowthAnalytics.js";
import { UseCases } from "./usecases/UseCases.js";
import { FinalCTA } from "./cta/FinalCTA.js";
import { LandingFooter } from "./LandingFooter.js";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <LandingNavbar />
      <Hero />
      <PersonaRail />
      <WorkspaceShowcase />
      <ProductCategoryGrid />
      <JourneySection />
      <ConnectedEcosystem />
      <GrowthAnalytics />
      <UseCases />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
