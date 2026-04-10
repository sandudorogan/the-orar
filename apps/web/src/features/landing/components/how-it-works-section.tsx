import { useMessages } from "@/app/i18n/use-i18n.ts"
import { cn } from "@orar/ui"

const steps = [
	{ number: "01", titleKey: "step1Title", descKey: "step1Desc" },
	{ number: "02", titleKey: "step2Title", descKey: "step2Desc" },
	{ number: "03", titleKey: "step3Title", descKey: "step3Desc" },
	{ number: "04", titleKey: "step4Title", descKey: "step4Desc" },
] as const

export function HowItWorksSection() {
	const messages = useMessages()

	return (
		<section className="bg-surface-raised">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
				<div className="text-center">
					<h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
						{messages.landing.howItWorksTitle}
					</h2>
					<p className="text-lg text-text-secondary mt-4 max-w-2xl mx-auto">
						{messages.landing.howItWorksSubtitle}
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
					{steps.map((step, i) => (
						<div key={step.titleKey} className="relative">
							<span className="text-4xl font-bold text-landing-accent opacity-20">
								{step.number}
							</span>
							<h3 className="font-semibold text-text-primary mt-2">
								{messages.landing[step.titleKey]}
							</h3>
							<p className="text-sm text-text-secondary mt-1">{messages.landing[step.descKey]}</p>
							{i < steps.length - 1 && (
								<span
									className={cn(
										"hidden lg:block absolute top-4 -right-5 text-2xl",
										"text-landing-accent opacity-20 select-none",
									)}
									aria-hidden="true"
								>
									&rarr;
								</span>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
