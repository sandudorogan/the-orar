import { CtaSection } from "./components/cta-section.tsx"
import { FeaturesSection } from "./components/features-section.tsx"
import { HeroSection } from "./components/hero-section.tsx"
import { HighlightsSection } from "./components/highlights-section.tsx"
import { HowItWorksSection } from "./components/how-it-works-section.tsx"
import { LandingFooter } from "./components/landing-footer.tsx"
import { LandingHeader } from "./components/landing-header.tsx"

export function LandingPage() {
	return (
		<main className="min-h-screen bg-surface-page">
			<LandingHeader />
			<HeroSection />
			<FeaturesSection />
			<HowItWorksSection />
			<HighlightsSection />
			<CtaSection />
			<LandingFooter />
		</main>
	)
}
