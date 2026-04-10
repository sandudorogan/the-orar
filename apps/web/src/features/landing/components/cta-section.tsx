import { useMessages } from "@/app/i18n/use-i18n.ts"
import { Button } from "@orar/ui"
import { Link } from "@tanstack/react-router"

export function CtaSection() {
	const messages = useMessages()

	return (
		<section className="bg-landing-cta-bg py-20">
			<div className="max-w-3xl mx-auto px-4 text-center">
				<h2 className="text-3xl sm:text-4xl font-bold text-white">{messages.landing.ctaTitle}</h2>
				<p className="text-lg text-landing-cta-text mt-4">{messages.landing.ctaSubtitle}</p>
				<div className="mt-8">
					<Button
						asChild
						className="bg-landing-cta-button-bg text-landing-cta-button-text hover:bg-landing-cta-button-hover"
					>
						<Link to="/dashboard">{messages.landing.ctaButton}</Link>
					</Button>
				</div>
			</div>
		</section>
	)
}
